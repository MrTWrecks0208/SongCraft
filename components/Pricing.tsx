import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckIcon } from 'lucide-react';
import { auth } from '../firebase';

const aiFeatureMapping: Record<string, string[]> = {
  'Basic AI Suggestions': ['Suggest Next Lines', 'Find Rhymes', 'Review Lyrics'],
  'Advanced AI Suggestions': ['Improve Lyrics', 'Suggest Structure', 'Suggest Chords', 'Suggest Beat', 'Export Projects'],
  'Professional AI Suggestions': ['Change Style', 'Suggest Melody', 'Check Originality', 'Version History'],
  'Premium AI Models': ['Generate Song', 'Generate Hook for TikTok', 'Radio-Ready Polish', 'Studio Mode', 'Export Recordings to DAW-Compatible Formats']
};

interface PricingProps {
  onBack: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const tiers = [
    {
      name: 'Open Mic',
      price: { monthly: 0, annually: 0 },
      description: 'Perfect for getting started.',
      features: ['Basic AI Suggestions', 'Up to 3 Projects', 'Limited Daily Generations', 'Standard Support'],
      buttonText: 'Current Plan',
      isCurrent: true,
    },
        {
      name: 'Rising Artist',
      price: { monthly: 12, annually: 120 },
      description: 'For serious songwriters.',
      features: ['Advanced AI Suggestions', 'Unlimited Projects', 'Choice of Companion', 'Priority Support'],
      buttonText: 'Upgrade',
      priceId: { monthly: 'price_tier1_monthly', annually: 'price_tier1_annually' },
      isPopular: false,
    },
    {
      name: 'Headliner',
      price: { monthly: 24, annually: 240 },
      description: 'For serious songwriters.',
      features: ['Professional AI Suggestions', 'Version History', 'Export Projects', 'Priority Support' ],
      buttonText: 'Upgrade',
      priceId: { monthly: 'price_tier2_monthly', annually: 'price_tier2_annually' },
      isPopular: true,
    },
    {
      name: 'Legend',
      price: { monthly: 48, annually: 480 },
      description: 'The ultimate creative suite.',
      features: ['Premium AI Models', 'Studio Mode', 'AI Demos', 'Early Access to Features', 'Collaborative Tools', 'Personalized Feedback'],
      buttonText: 'Upgrade',
      priceId: { monthly: 'price_tier3_monthly', annually: 'price_tier3_annually' },
    },
  ];

  const handleSubscribe = async (tierName: string, priceId?: string) => {
    if (!priceId) return;
    if (!auth.currentUser) {
      alert('Please sign in to subscribe.');
      return;
    }

    try {
      const res = await fetch('/create-checkout-session', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId: auth.currentUser.uid,
          priceId: priceId,
          tierName: tierName
        })
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-main text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button onClick={onBack} className="text-gray-300 hover:text-white transition-colors">
            &larr; Back to Projects
          </button>
          <div className="text-center flex-grow flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-4">
                <img src="/logo.png" alt="GhostWriter Logo" className="w-12 h-12 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                <h1 className="text-4xl font-bold">Pricing Plans</h1>
            </div>
            <p className="text-gray-300">Choose the plan that fits your creative journey.</p>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly' ? 'bg-gradient-to-br from-accent to-accent-light text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'annually' ? 'bg-gradient-to-br from-accent to-accent-light text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto mt-8 md:mt-16 pb-12 px-4">
          {tiers.map((tier, idx) => {
            const popularIndex = tiers.findIndex((t) => t.isPopular);
            const isPopular = tier.isPopular;
            const distance = Math.abs(idx - popularIndex);
            
            let zIndexClass = 'z-10';
            if (isPopular) zIndexClass = 'z-30';
            else if (distance === 1) zIndexClass = 'z-20';
            
            let scaleClass = isPopular ? 'scale-100 md:scale-105' : 'scale-100 md:scale-95';
            let opacityClass = isPopular ? 'opacity-100' : 'opacity-100 md:opacity-90';
            if (!isPopular && distance > 1) {
                scaleClass = 'scale-100 md:scale-90';
                opacityClass = 'opacity-100 md:opacity-80';
            }

            const marginClass = idx !== 0 ? 'mt-8 md:mt-0 md:-ml-2 lg:-ml-3' : '';

            return (
              <motion.div
                key={tier.name}
                whileHover={{ y: -10, zIndex: 40, opacity: 1, scale: 1.05 }}
                className={`relative p-6 lg:p-7 rounded-3xl border border-white/10 flex flex-col w-full md:w-[240px] lg:w-[280px] shrink-0 transition-all duration-500 ease-in-out ${zIndexClass} ${scaleClass} ${opacityClass} ${marginClass} ${
                  tier.isPopular ? 'bg-[#1f2937] ring-2 ring-accent shadow-2xl shadow-accent/20' : 'bg-[#111827] hover:bg-[#1f2937]'
                }`}
              >
                {tier.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white text-[10px] md:text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl md:text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-gray-400 text-xs md:text-sm mb-6 h-10">{tier.description}</p>
                <div className="mb-6 md:mb-8 relative flex items-center">
                  <div className="flex items-baseline">
                    <span className="text-3xl lg:text-4xl font-bold">${tier.price[billingCycle]}</span>
                    <span className="text-gray-400 text-xs md:text-sm ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {billingCycle === 'annually' && tier.price.monthly * 12 - tier.price.annually > 0 && (
                    <span className="text-[11px] font-semibold text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-2 py-0.5 rounded-full ml-2 shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                      Save ${tier.price.monthly * 12 - tier.price.annually}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 md:space-y-4 mb-8 flex-grow">
                  {tier.features.map((feature) => {
                    const subFeatures = aiFeatureMapping[feature];
                    return (
                      <li key={feature} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 group relative">
                        <CheckIcon className="w-4 h-4 text-accent shrink-0" />
                        {subFeatures ? (
                          <div className="relative flex items-center cursor-help border-b border-dashed border-gray-500 hover:border-white transition-colors">
                            <span>{feature}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none isolate">
                              <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2 pb-2 border-b border-gray-700">AI Features Included</p>
                              <ul className="space-y-1.5">
                                {subFeatures.map(sub => (
                                  <li key={sub} className="text-xs text-gray-300 flex items-start gap-1.5 leading-snug">
                                    <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                                    {sub}
                                  </li>
                                ))}
                              </ul>
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 transform rotate-45" />
                            </div>
                          </div>
                        ) : (
                          <span>{feature}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <button
                  onClick={() => handleSubscribe(tier.name, billingCycle === 'monthly' ? tier.priceId?.monthly : tier.priceId?.annually)}
                  disabled={tier.isCurrent}
                  className={`w-full py-2.5 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${
                    tier.isCurrent
                      ? 'bg-white/10 text-gray-400 cursor-default'
                      : 'bg-gradient-to-br from-accent to-accent-light hover:from-accent-light hover:to-accent text-white shadow-lg shadow-accent/20'
                  }`}
                >
                  {tier.buttonText}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
