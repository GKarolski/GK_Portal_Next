"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = {
    STARTER: { name: 'Starter', price: '89 zł', features: ['1 Admin', '10 Klientów', '1 GB'] },
    STANDARD: { name: 'Standard', price: '149 zł', features: ['3 Adminów', '50 Klientów', '5 GB', 'White-Label'] },
    AGENCY: { name: 'Agency', price: '259 zł', features: ['∞ Adminów', '∞ Klientów', '100 GB', 'Support 24/7'] }
};

import { useAuth } from '@/contexts/AuthContext';
import { CheckoutForm } from '@/components/stripe/CheckoutForm';
import StripeContainer from '@/components/stripe/StripeContainer';
import { Loader2, Lock } from 'lucide-react';

function CheckoutContent() {
    const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const planKey = (searchParams.get('plan') || 'STARTER').toUpperCase() as keyof typeof plans;
    const plan = plans[planKey] || plans.STARTER;

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [publishableKey, setPublishableKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInitLoading, setIsInitLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const initCheckout = async () => {
            try {
                const response = await fetch('/api/stripe/create-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId: planKey,
                        email: user.email,
                        userId: user.id
                    }),
                });

                const data = await response.json();
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                    setPublishableKey(data.publishableKey);
                } else {
                    setError(data.error || 'Błąd inicjalizacji płatności.');
                }
            } catch (err) {
                console.error('Checkout init error:', err);
                setError('Wystąpił błąd podczas łączenia z bramką płatniczą.');
            } finally {
                setIsInitLoading(false);
            }
        };

        initCheckout();
    }, [user, planKey]);

    return (
        <div className="min-h-screen bg-gk-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-accent-red/5 blur-[120px] rounded-full pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start z-10"
            >
                {/* Order Summary */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Finalizacja Zamówienia</h1>
                        <p className="text-slate-400">Wybrałeś pakiet <span className="text-accent-red font-bold">{plan.name}</span>. Skonfigurujmy Twoje środowisko.</p>
                    </div>

                    <Card className="p-6 border-white/5 bg-white/5 backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-semibold uppercase tracking-widest text-slate-500">Plan</span>
                            <span className="px-3 py-1 rounded bg-accent-red text-white text-xs font-bold">{plan.name}</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                    <Check size={16} className="text-accent-red" /> {f}
                                </li>
                            ))}
                        </ul>
                        <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                            <span className="text-slate-500 text-sm">Do zapłaty:</span>
                            <div className="text-3xl font-bold tracking-tight">{plan.price} <span className="text-xs text-slate-500">/msc</span></div>
                        </div>
                    </Card>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-400 text-xs">
                        <ShieldCheck size={20} />
                        Bezpieczna płatność obsługiwana przez Stripe. Wszystkie dane są szyfrowane.
                    </div>
                </div>

                {/* Stripe Elements UI */}
                <Card className="p-8 border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl relative min-h-[400px] flex flex-col justify-center">
                    {/* Form Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-accent-red/5 blur-[80px] rounded-full pointer-events-none"></div>

                    {error ? (
                        <div className="text-center p-6 space-y-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                                <Lock size={24} />
                            </div>
                            <h3 className="font-bold text-lg">Błąd Płatności</h3>
                            <p className="text-sm text-red-400/80">{error}</p>
                            <Button variant="secondary" onClick={() => window.location.reload()} className="w-full">Spróbuj Ponownie</Button>
                        </div>
                    ) : (isInitLoading || !clientSecret || !publishableKey) ? (
                        <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                            <Loader2 className="animate-spin text-accent-red" size={40} />
                            <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase font-bold animate-pulse">Inicjowanie bezpiecznego połączenia...</p>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-1">Dane płatności</h3>
                                <p className="text-slate-500 text-sm">Wprowadź dane karty i aktywuj subskrypcję.</p>
                            </div>
                            <StripeContainer clientSecret={clientSecret} publishableKey={publishableKey}>
                                <CheckoutForm planId={planKey} />
                            </StripeContainer>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-gk-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-red"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
