import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const CREDITS = {
  PRICE_PER_20: 0.67,
  VIDEOS_PER_CREDIT: 20
};

export const PLANS = {
  STARTER: {
    id: 'price_starter',
    name: 'Starter',
    price: 9.99,
    features: [
      '10 video generations included',
      'Purchase additional credits',
      'Basic AI effects',
      '720p video export',
      'Email support',
      `Additional videos for ${CREDITS.PRICE_PER_20.toFixed(2)}/credit (20 videos)`
    ],
    limits: {
      baseVideos: 10,
      maxAdditionalVideos: 10
    },
    annualDiscount: 0.833 // 2 months free
  },
  PRO: {
    id: 'price_pro',
    name: 'Pro',
    price: 29.99,
    features: [
      'Up to 50 video projects',
      'Advanced AI effects',
      '1080p video export',
      'Priority email support',
      'Custom backgrounds',
      'Priority rendering'
    ],
    annualDiscount: 0.75 // 3 months free
  },
  PREMIUM: {
    id: 'price_premium',
    name: 'Premium',
    price: 49.99,
    features: [
      'Unlimited video projects',
      'All AI effects',
      '4K video export',
      '24/7 priority support',
      'Custom effects',
      'API access',
      'White-label exports'
    ],
    annualDiscount: 0.667 // 4 months free
  },
  LIFETIME: {
    id: 'price_lifetime',
    name: 'Lifetime',
    price: 497,
    isOneTime: true,
    features: [
      'Everything in Premium plan',
      'Lifetime access',
      'Early access to new features',
      'Personal onboarding call',
      'Custom AI model training',
      'Dedicated support manager',
      'Enterprise API access',
      'Unlimited team members'
    ]
  }
};