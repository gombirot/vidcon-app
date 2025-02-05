import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS, CREDITS } from '../lib/stripe';
import { supabase } from '../lib/supabase';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async (planId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId: user.id,
        isAnnual
      }),
    });

    const { sessionId } = await response.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  };

  const handleBuyCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const response = await fetch('/api/create-credit-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        amount: CREDITS.PRICE_PER_20,
        credits: 20
      }),
    });

    const { sessionId } = await response.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Start your 14-day free trial today
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Cancel anytime. No questions asked.
          </p>
        </div>

        {/* Credits Info */}
        <div className="mt-8 max-w-2xl mx-auto bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900">Video Generation Credits</h3>
          <p className="mt-2 text-blue-700">
            Starter plan users can purchase additional credits for more video generations.
            Each credit pack costs ${CREDITS.PRICE_PER_20} and allows for 20 video generations.
          </p>
          <button
            onClick={handleBuyCredits}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Buy Credits
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="relative flex items-center">
            <span className="mr-3 text-sm font-medium">Monthly</span>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAnnual ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isAnnual ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
            <span className="ml-3 text-sm font-medium">
              {isAnnual ? 'Annual (Save up to 4 months)' : 'Monthly'}
            </span>
          </div>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:grid sm:grid-cols-4 sm:gap-6 sm:space-y-0">
          {Object.values(PLANS).map((plan) => {
            const price = plan.isOneTime 
              ? plan.price 
              : isAnnual
                ? plan.price * 12 * (plan.annualDiscount || 1)
                : plan.price;

            return (
              <div key={plan.id} className="bg-white rounded-lg shadow-lg divide-y divide-gray-200">
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${price.toFixed(2)}
                    </span>
                    {!plan.isOneTime && (
                      <span className="text-base font-medium text-gray-500">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </p>
                  {plan.isOneTime && (
                    <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      One-time payment
                    </span>
                  )}
                  {plan.name === 'Starter' && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Base: {plan.limits.baseVideos} videos/month</p>
                      <p>Max additional: {plan.limits.maxAdditionalVideos} videos</p>
                    </div>
                  )}
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex">
                        <svg
                          className="flex-shrink-0 w-6 h-6 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="ml-3 text-base text-gray-500">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className="mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md text-center"
                  >
                    {plan.isOneTime ? 'Get Lifetime Access' : `Start ${plan.name} Plan`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            All subscription plans include a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}