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

const StripeContainer: React.FC<StripeContainerProps> = ({ clientSecret, publishableKey, mode, amount, currency, children }) => {
    const stripePromise = useMemo(() => {
        if (!publishableKey) return null;
        return loadStripe(publishableKey);
    }, [publishableKey]);

    const options: any = {
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

    if (!stripePromise) return null;

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
};

export default StripeContainer;
