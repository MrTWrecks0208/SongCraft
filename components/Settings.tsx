import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, CreditCard, ArrowLeft, Save } from 'lucide-react';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';

interface SettingsProps {
  onBack: () => void;
  onGoToPricing: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onGoToPricing }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile');
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateProfile(auth.currentUser, { displayName });
      setSaveMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1d2951] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Projects
        </button>

        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-500">
          Settings
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'profile' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <User className="w-5 h-5" />
              User Profile
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'billing' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Subscription & Billing
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-grow bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">User Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={auth.currentUser?.email || ''}
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500 italic">Email cannot be changed.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {saveMessage && (
                    <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                      {saveMessage}
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Subscription & Billing</h2>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-wider font-bold">Current Plan</p>
                      <p className="text-xl font-bold">Free Tier</p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full uppercase">Active</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">You are currently on the free plan. Upgrade to unlock premium features.</p>
                  <button
                    onClick={onGoToPricing}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
                  >
                    View Pricing & Upgrade
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Billing History</h3>
                  <p className="text-sm text-gray-500 italic">No billing history found.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
