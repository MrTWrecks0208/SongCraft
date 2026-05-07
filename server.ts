import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
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
