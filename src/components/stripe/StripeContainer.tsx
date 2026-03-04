"use client";

import React, { ReactNode, useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface StripeContainerProps {
    clientSecret?: string;
    publishableKey: string;
    mode?: 'payment' | 'setup' | 'subscription';
    amount?: number;
    currency?: string;
    children: ReactNode;
}

let stripePromise: Promise<any | null>;

const getStripe = (publishableKey: string) => {
    if (!stripePromise && publishableKey) {
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
};

// Eagerly initialize as soon as the module loads for maximum speed
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    getStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

const StripeContainer: React.FC<StripeContainerProps> = ({ clientSecret, publishableKey, mode, amount, currency, children }) => {
    const activeStripePromise = getStripe(publishableKey);

    const options: any = {
        locale: 'pl',
        appearance: {
            theme: 'night' as const,
            variables: {
                colorPrimary: '#ef4444',
                colorBackground: '#0a0a0a',
                colorText: '#ffffff',
                colorDanger: '#ef4444',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '12px',
            },
            rules: {
                '.Input': {
                    border: '1px solid #334155',
                    backgroundColor: '#171717',
                    boxShadow: 'none',
                },
                '.Input:focus': {
                    border: '1px solid #ef4444',
                    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
                },
                '.Label': {
                    color: '#94a3b8',
                    fontWeight: '600',
                    textTransform: 'uppercase' as const,
                    fontSize: '11px',
                    letterSpacing: '0.05em'
                }
            }
        },
    };

    if (clientSecret) {
        options.clientSecret = clientSecret;
    } else if (mode) {
        options.mode = mode;
        if (amount) options.amount = amount * 100; // Stripe expects cents
        if (currency) options.currency = currency;
    }

    if (!activeStripePromise) return null;

    return (
        <Elements stripe={activeStripePromise} options={options}>
            {children}
        </Elements>
    );
};

export default StripeContainer;
