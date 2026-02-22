"use client";

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CheckoutFormProps {
    planId: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ planId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);
        setMessage(null);

        const returnUrl = `${window.location.origin}/provisioning?plan=${planId}`;

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl,
            },
        });

        if (error) {
            setMessage(error.message ?? "Wystąpił błąd płatności.");
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </div>

            {message && (
                <div className="p-4 bg-red-500/10 text-red-500 text-sm font-medium rounded-xl border border-red-500/20 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {message}
                </div>
            )}

            <Button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                isLoading={isLoading}
                className="w-full h-14 text-base shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] bg-accent-red hover:bg-red-500 text-white border-none rounded-xl font-bold tracking-wide transition-all"
            >
                {isLoading ? 'Przetwarzanie...' : 'Zapłać i Aktywuj'}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest mt-6 opacity-60">
                <Lock size={10} />
                <span>256-bit SSL Secure Payment</span>
            </div>
        </form>
    );
};
