"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { pricingPlans } from '@/config/pricing';
import { useAuth } from '@/contexts/AuthContext';
import { CheckoutForm } from '@/components/stripe/CheckoutForm';
import StripeContainer from '@/components/stripe/StripeContainer';
import { Loader2, Lock } from 'lucide-react';

function CheckoutContent() {
    const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const planKey = (searchParams.get('plan') || 'STARTER').toUpperCase() as keyof typeof pricingPlans;
    const plan = pricingPlans[planKey] || pricingPlans.STARTER;

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
                        userId: user.id,
                        companyName: user.companyName,
                        interval: searchParams.get('interval') || 'month',
                        upsell: searchParams.get('upsell') || 'false'
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

    const isYearly = searchParams.get('interval') === 'year';
    const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

    return (
        <div className="min-h-screen bg-gk-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-accent-red/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Top Navigation Step Indicator */}
            <div className="absolute top-0 left-0 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-20">
                <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1a1a2e] to-black border border-white/10 flex items-center justify-center text-red-500 font-bold text-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">GK</div>
                        <span className="font-bold text-lg tracking-tight text-white">GK_<span className="text-red-500">Digital</span></span>
                    </div>
                    <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 flex items-center gap-2">
                        Krok 3 z 3 <ArrowRight className="w-3 h-3" /> Finalizacja
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start z-10 mt-16"
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
                                    <Check size={16} className="text-accent-red" /> {f.text}
                                </li>
                            ))}
                        </ul>
                        <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                            <span className="text-slate-500 text-sm">Do zapłaty:</span>
                            <div className="text-3xl font-bold tracking-tight">{displayPrice} zł <span className="text-xs text-slate-500">/msc</span></div>
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

            {/* Steps Indicator Bottom */}
            <div className="flex justify-center gap-2 mt-12 relative z-10">
                <div className="w-2 h-1 bg-white/30 rounded-full"></div>
                <div className="w-2 h-1 bg-white/30 rounded-full"></div>
                <div className="w-12 h-1 bg-accent-red rounded-full"></div>
            </div>
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
