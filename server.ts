import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// Initialize Firebase Admin (uses Application Default Credentials or standard init in AI Studio/GCP)
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Read Firebase Config for Project ID and API Key
  let firebaseConfig: any = {};
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const fileContents = await fs.readFile(configPath, 'utf-8');
    firebaseConfig = JSON.parse(fileContents);
  } catch (error) {
    console.warn("Could not read firebase-applet-config.json - verification might fail if API key is not present.");
  }

  // Initialize Stripe lazily to avoid crash if key is missing
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        console.warn("STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.");
        return null;
      }
      stripe = new Stripe(key);
    }
    return stripe;
  };

  app.use(cors());

  // Stripe Webhook Endpoint (MUST be before express.json() to get raw body)
  app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).send("Stripe not configured.");
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).send(`Webhook Error: Missing signature or secret`);
    }

    let event;

    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout Completed for session:', session.id);
      
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;
      const subscriptionId = session.subscription;
      const tier = session.metadata?.tier || 'Free';

      if (userId) {
        try {
          await db.collection("users").doc(userId).set({
            stripe_customer_id: stripeCustomerId,
            subscription_id: subscriptionId,
            subscription_status: 'active',
            tier: tier
          }, { merge: true });
          console.log(`Successfully updated membership status for user ${userId}`);
        } catch (error) {
          console.error(`Failed to update DB for user ${userId}`, error);
        }
      } else {
        console.warn("No client_reference_id (userId) found in session. Unable to link subscription to user.");
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Payment Failed for invoice:', invoice.id);
      
      const stripeCustomerId = invoice.customer as string;
      if (stripeCustomerId) {
        try {
          // Look up user by customer ID
          const usersSnapshot = await db.collection("users")
            .where("stripe_customer_id", "==", stripeCustomerId)
            .get();
          
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscription_status: 'past_due'
            });
            console.log(`Set subscription_status to past_due for user ${userDoc.id}`);
          }
        } catch (error) {
          console.error(`Failed to record payment failure for customer ${stripeCustomerId}`, error);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      if (stripeCustomerId) {
        try {
          const usersSnapshot = await db.collection("users")
            .where("stripe_customer_id", "==", stripeCustomerId)
            .get();
          
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscription_status: 'canceled'
            });
            console.log(`Set subscription_status to canceled for user ${userDoc.id}`);
          }
        } catch (error) {
          console.error(`Failed to record cancellation for customer ${stripeCustomerId}`, error);
        }
      }
    }

    res.sendStatus(200);
  });

  app.use(express.json());

  // Add COOP and COEP headers for SharedArrayBuffer (required by ffmpeg.wasm)
  app.use((req, res, next) => {
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

  // verify-recaptcha endpoint
  app.post("/api/verify-recaptcha", async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: "Missing token" });
    }
    
    // Load the secret key from the project's environment variables
    const secretKey = process.env.reCAPTCHA || process.env.RECAPTCHA;
    const projectId = "songcraft-492422";
    const apiKey = firebaseConfig.apiKey || process.env.FIREBASE_API_KEY;

    if (!secretKey) {
      console.error("Missing reCAPTCHA API key in environment variables");
      return res.status(500).json({ success: false, error: "Server configuration error: Missing reCAPTCHA key" });
    }

    try {
      const response = await fetch(`https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            token: token,
            expectedAction: "LOGIN",
            siteKey: "6LcSAMAsAAAAALe5dbJss12J4SfUW-RbITu-CT4F" // frontend site key
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("reCAPTCHA API error:", data);
        
        console.warn("Enterprise API failed or was invalid. Falling back to standard siteverify with secret key...");
        const fallbackResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: secretKey,
            response: token
          }).toString()
        });
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success) {
          console.log("Fallback verification successful");
          return res.json({ success: true, message: "Token verified successfully." });
        } else {
          console.error("Fallback verification failed:", fallbackData);
          if (fallbackData['error-codes'] && fallbackData['error-codes'].includes('browser-error')) {
              console.warn("Note: 'browser-error' often indicates the token was mangled, expired, or requested from a domain not listed in your reCAPTCHA admin console.");
          }
          return res.status(500).json({ success: false, error: "Both Enterprise and Fallback reCAPTCHA verification failed.", details: fallbackData });
        }
      }

      // Check the risk score and action
      if (data.tokenProperties && data.tokenProperties.valid === true) {
        if (data.tokenProperties.action === "LOGIN") {
           // Optionally check data.riskAnalysis.score here if desired (e.g. >= 0.5)
           res.json({ success: true, message: "Token verified successfully." });
        } else {
           res.status(400).json({ success: false, error: "Invalid action." });
        }
      } else {
        console.error("Invalid token:", data);
        res.status(400).json({ success: false, error: "Invalid or expired token." });
      }
    } catch (err: any) {
      console.error("Exception during reCAPTCHA verification:", err);
      res.status(500).json({ success: false, error: "Failed to verify token." });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post('/create-checkout-session', async (req, res) => {
    const { userId, priceId, tierName } = req.body;
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId." });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        client_reference_id: userId, // Pass the Firebase user ID so the webhook can find it
        line_items: [
          {
            price: priceId, // use the dynamic price ID
            quantity: 1,
          },
        ],
        metadata: {
          tier: tierName || 'Pro'
        },
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/pricing`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
