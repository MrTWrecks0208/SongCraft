import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, getDocFromServer } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { SparkleIcon } from './icons/SparkleIcon';
import { UserIcon, X, ArrowLeft } from 'lucide-react';

interface SignInProps {
  onStart: () => void;
  initialIsSignUp?: boolean;
  onBack: () => void;
  isModal?: boolean;
}

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const SignIn: React.FC<SignInProps> = ({ onStart, initialIsSignUp = false, onBack, isModal = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const executeFirebaseAuth = async () => {
    console.log(`Starting Email ${isSignUp ? 'Sign Up' : 'Sign In'}...`);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Email Sign Up success:', user.email);
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'user',
          createdAt: new Date().toISOString(),
          credits: 50
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Email Sign In success');
      }
      // No need to call onStart() here as onAuthStateChanged in App.tsx will handle it
    } catch (err: any) {
      console.error('Email Auth error:', err);
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already in use. Try signing in instead.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        window.grecaptcha.enterprise.ready(async () => {
          try {
            const token = await window.grecaptcha.enterprise.execute('6LcSAMAsAAAAALe5dbJss12J4SfUW-RbITu-CT4F', {action: 'LOGIN'});
            
            const verifyRes = await fetch('/api/verify-recaptcha', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });

            if (!verifyRes.ok) {
                throw new Error("Failed to verify reCAPTCHA on the server.");
            }
            const verifyData = await verifyRes.json();
            if(!verifyData.success) {
                throw new Error(verifyData.error || "reCAPTCHA verification failed.");
            }
            
            await executeFirebaseAuth();
          } catch (recaptchaErr: any) {
            console.error('reCAPTCHA error:', recaptchaErr);
            setError('reCAPTCHA verification failed: ' + recaptchaErr.message);
            setIsLoading(false);
          }
        });
      } else {
        console.warn('reCAPTCHA not loaded, proceeding without it');
        await executeFirebaseAuth();
      }
    } catch (err: any) {
      console.error('Unexpected error during auth flow:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    console.log('Starting Google Auth...');
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      console.log('Google Auth success:', user.email);
      
      const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'user',
          createdAt: new Date().toISOString(),
          credits: 50
        });
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup blocked or closed. In this preview environment, Google Sign-In requires opening the app in a new tab.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Please add it in the Firebase Console.');
      } else {
        setError(err.message || 'An unexpected error occurred during Google sign-in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsLoading(true);
    console.log('Starting Guest Login...');
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      console.log('Guest Login success:', user.uid);
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: null,
        displayName: 'Guest Artist',
        photoURL: '',
        role: 'guest',
        createdAt: new Date().toISOString(),
        credits: 50
      });
    } catch (err: any) {
      console.error('Guest Login error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        setError('Guest login is disabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable the "Anonymous" provider.');
      } else {
        setError(err.message || 'An unexpected error occurred during guest login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isModal ? "relative flex items-center justify-center p-4 w-full" : "min-h-screen bg-[#1a1c4a] text-white overflow-x-hidden font-sans relative selection:bg-accent selection:text-white flex items-center justify-center p-4"}>
      {/* Immersive Atmospheric Background */}
      {!isModal && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-main/30 blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent/20 blur-[150px]"></div>
          <div className="absolute top-[40%] left-[60%] w-[40vw] h-[40vw] rounded-full bg-[#39FF14]/5 blur-[120px]"></div>
        </div>
      )}

      <div className="w-full max-w-md relative overflow-hidden rounded-2xl bg-[#111] p-8 md:p-10 border border-white/10 shadow-2xl z-10 mx-auto">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          {isModal ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        
        <div className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center mb-6">
            <img src="/Wordmark.png?v=1.1" alt="Songweaver Wordmark" className="h-12 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-400">
            {isSignUp ? 'Start writing your next hit.' : 'Pick up where you left off.'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            required
          />
          
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20 text-left">
              <p>{error}</p>
              {error.includes('opening the app in a new tab') && (
                <button 
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="mt-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 py-2 px-4 rounded-lg font-semibold transition-colors w-full text-sm"
                >
                  Open in New Tab
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3.5 bg-accent text-white rounded-xl font-bold shadow-[0_0_15px_rgba(219,39,119,0.3)] transition-all hover:bg-accent-light active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-accent"
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-4 bg-[#111] text-xs text-gray-500 font-medium uppercase tracking-wider">Or</span>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full p-3.5 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          <button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full p-3.5 bg-transparent border border-white/20 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:bg-white/5 active:scale-[0.98] disabled:opacity-50"
          >
            <UserIcon className="w-5 h-5" />
            Try as Guest
          </button>
        </div>

        <p className="mt-8 text-center text-gray-400 text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white font-bold hover:text-accent transition-colors underline decoration-white/30 underline-offset-4"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;

