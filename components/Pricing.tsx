import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckIcon } from 'lucide-react';
import { auth } from '../firebase';

interface PricingProps {
  onBack: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const tiers = [
    {
      name: 'Free',
      price: { monthly: 0, annually: 0 },
      description: 'Perfect for getting started.',
      features: ['Basic AI suggestions', '3 projects', 'Standard support'],
      buttonText: 'Current Plan',
      isCurrent: true,
    },
    {
      name: 'Paid Tier 1',
      price: { monthly: 9.99, annually: 99.99 },
      description: 'For serious songwriters.',
      features: ['Advanced AI suggestions', 'Unlimited projects', 'Priority support', 'Custom companions'],
      buttonText: 'Upgrade to Tier 1',
      priceId: { monthly: 'price_tier1_monthly', annually: 'price_tier1_annually' },
      isPopular: true,
    },
    {
      name: 'Paid Tier 2',
      price: { monthly: 19.99, annually: 199.99 },
      description: 'The ultimate creative suite.',
      features: ['Premium AI models', 'Early access to features', 'Collaborative tools', 'Personalized feedback'],
      buttonText: 'Upgrade to Tier 2',
      priceId: { monthly: 'price_tier2_monthly', annually: 'price_tier2_annually' },
    },
  ];

  const handleSubscribe = async (priceId?: string) => {
    if (!priceId) return;
    if (!auth.currentUser) {
      alert('Please sign in to subscribe.');
      return;
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerEmail: auth.currentUser.email,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Failed to start checkout. Please check your Stripe configuration.');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1d2951] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button onClick={onBack} className="text-gray-300 hover:text-white transition-colors">
            &larr; Back to Projects
          </button>
          <div className="text-center flex-grow">
            <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
            <p className="text-gray-300">Choose the plan that fits your creative journey.</p>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly' ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'annually' ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              whileHover={{ y: -10 }}
              className={`relative p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col ${
                tier.isPopular ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {tier.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{tier.description}</p>
              <div className="mb-8">
                <span className="text-4xl font-bold">${tier.price[billingCycle]}</span>
                <span className="text-gray-400 text-sm">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckIcon className="w-4 h-4 text-purple-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(billingCycle === 'monthly' ? tier.priceId?.monthly : tier.priceId?.annually)}
                disabled={tier.isCurrent}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  tier.isCurrent
                    ? 'bg-white/10 text-gray-400 cursor-default'
                    : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
                }`}
              >
                {tier.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
