import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { SparkleIcon } from './icons/SparkleIcon';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'user'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onStart();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'user'
        });
      }
      onStart();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completion. Please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#1d2951] relative overflow-hidden">
        {/* Atmospheric background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center w-full mt-12">
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-2 tracking-tighter">
                SongCraft
            </h1>
            <p className="text-xl text-purple-300/60 mb-12 font-medium">
                Your AI Songwriting Partner
            </p>

            <div className="w-full max-w-md relative overflow-hidden rounded-xl bg-white/30 shadow-md p-10 border border-white/20 backdrop-blur-md hover:bg-white/40">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      {isSignUp ? 'Create an Account' : 'Welcome Back'}
                    </h2>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        required
                      />
                      
                      {error && (
                        <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full p-4 bg-[#1d2951] text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                      </button>
                    </form>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#1d2951]/40 backdrop-blur-md text-gray-200 rounded-full border border-white/5">OR</span>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full p-4 bg-white text-[#1d2951] rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                      Continue with Google
                    </button>

                    <p className="mt-8 text-gray-200 text-sm">
                      {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-[#1d2951] font-bold hover:underline"
                      >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                      </button>
                    </p>
                </div>
            </div>

            <p className="text-grey-400/40 mt-12 max-w-sm text-sm leading-relaxed">
                Collaborate with AI to write lyrics, find rhymes, and capture your next big hit.
            </p>
        </div>
    </div>
  );
};

export default Landing;
