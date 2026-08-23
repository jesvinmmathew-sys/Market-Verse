import React, { useState } from 'react';
import { Check, Sparkles, GraduationCap, Zap, Shield, Building2, X } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  priceMonthly: number;
  priceAnnualMonthly: number; // per month when billed annually
  description: string;
  features: string[];
  ctaText: string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free Pilot',
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    description: 'Perfect for first-time market entrants learning the basics with zero capital risk.',
    features: [
      '₹10,00,000 Virtual Simulated Wallet',
      'Real-Time NSE/BSE Tick Execution',
      'Interactive TradingView Candlestick Charts',
      'Standard RSI & MACD Overlays',
      '5 Daily Nova AI Basic Trade Queries',
      'Community Leaderboard Access'
    ],
    ctaText: 'Start Free Simulation',
    ctaVariant: 'outline'
  },
  {
    id: 'pro',
    name: 'MarketVerse Pro',
    badge: 'MOST POPULAR',
    popular: true,
    priceMonthly: 499,
    priceAnnualMonthly: 399,
    description: 'For disciplined traders demanding institutional risk controls and AI copilot intelligence.',
    features: [
      'Everything in Free Pilot',
      'Unlimited Nova AI Market Scenarios & Thesis',
      'Real-Time HHI Concentration Risk Engine',
      'Structured 1:2.4 R:R Setup Generation & Pivots',
      'Live Macro News NLP Catalyst & Sentiment Scoring',
      'Multi-Factor Stock Screener & Sector Heatmaps',
      'Priority Sub-100ms Execution Simulation'
    ],
    ctaText: 'Upgrade to Pro',
    ctaVariant: 'primary'
  },
  {
    id: 'campus',
    name: 'Campus / Institutional Lab',
    badge: 'FOR E-CELLS & UNIVERSITIES',
    priceMonthly: 3999,
    priceAnnualMonthly: 2916, // ₹35,000 / year
    description: 'Turnkey simulated trading lab tailored for college trading clubs and finance departments.',
    features: [
      'Everything in Pro for up to 50 Student Seats',
      'Host Private College Trading Hackathons & Competitions',
      'Admin Master Dashboard & Student Risk Scoring',
      'Downloadable CSV Performance & Audit Reports',
      'Direct API Sandboxing for Quantitative Backtesting',
      'Dedicated Campus Success Manager'
    ],
    ctaText: 'Request Institutional Access',
    ctaVariant: 'secondary'
  }
];

interface PricingSectionProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onClose, isModal = false }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className={`min-h-screen bg-[#070b12] text-slate-100 py-16 px-4 sm:px-6 lg:px-8 relative ${isModal ? 'h-[90vh] overflow-y-auto rounded-2xl border border-white/10' : ''}`}>
      {/* Close Button for Modal */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-full transition-all border border-white/5 cursor-pointer z-50 animate-fade-in"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5"/> Institutional Intelligence for Everyone
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pricing</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400">
          93% of retail traders lose money. Equip yourself with flight-simulator risk controls before risking real capital.
        </p>

        {/* Student Special Banner */}
        <div className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-500/30 rounded-xl p-3 text-sm text-purple-200">
          <GraduationCap className="w-5 h-5 text-purple-400 shrink-0"/>
          <span><b>Student / First-Timer Discount:</b> Active college students get an extra <b>50% OFF Pro</b> with college ID verification.</span>
        </div>

        {/* Billing Toggle */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly Billing</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-800 border border-slate-700 transition-colors focus:outline-none cursor-pointer"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-cyan-400 transition-transform ${
                isAnnual ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
            Annual Billing
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* 3-Tier Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {pricingTiers.map((tier) => {
          const effectivePrice = isAnnual ? tier.priceAnnualMonthly : tier.priceMonthly;
          return (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300 ${
                tier.popular
                  ? 'bg-gradient-to-b from-[#0e172a] to-[#0a1120] border-2 border-cyan-500 shadow-xl shadow-cyan-500/10'
                  : 'bg-[#0d1424] border border-slate-800 hover:border-slate-700'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md">
                  {tier.badge}
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                </div>
                <p className="text-sm text-slate-400 min-h-[40px] mb-6">{tier.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">₹{effectivePrice}</span>
                    <span className="text-sm text-slate-400">/ month</span>
                  </div>
                  {isAnnual && tier.priceMonthly > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">Billed annually (₹{effectivePrice * 12}/yr)</p>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-6 mb-8">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">What's included:</p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5"/>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  tier.ctaVariant === 'primary'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                    : tier.ctaVariant === 'secondary'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {tier.ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantees */}
      <div className="max-w-4xl mx-auto mt-16 text-center border-t border-slate-800/80 pt-8 flex flex-wrap justify-center gap-8 text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400"/> 100% Zero-Risk Simulation
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400"/> Cancel or Switch Anytime
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400"/> Official E-Cell Partner Supported
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
