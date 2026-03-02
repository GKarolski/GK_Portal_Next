"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

import { pricingPlans } from '@/config/pricing';
import { useAuth } from '@/contexts/AuthContext';
import { CheckoutForm } from '@/components/stripe/CheckoutForm';
import StripeContainer from '@/components/stripe/StripeContainer';
import { Loader2, Lock, Sparkles } from 'lucide-react';

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

    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="w-full flex-col items-center flex py-8 md:py-16">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="w-full max-w-5xl grid lg:grid-cols-[1fr_450px] gap-8 lg:gap-12 items-start"
            >
                {/* Left Side: Order Summary */}
                <div className="flex flex-col space-y-8 lg:pr-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 mb-6">
                            KROK 3 Z 3: FINALIZACJA
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">Aktywacja Konta</h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Gratulacje, wybrałeś pakiet <span className="text-red-400 font-bold">{plan.name}</span>.<br /> Skonfiguruj bezpieczną płatność, aby natychmiast odblokować dostęp do swojego nowego środowiska pracy.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/10 blur-[80px] rounded-full pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-50" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Wybrany Plan</span>
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold tracking-widest uppercase rounded flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" /> Vip Access
                                </span>
                            </div>

                            <div className="flex items-end gap-2 mb-8">
                                <div className="text-5xl font-black tracking-tighter text-white">{displayPrice}</div>
                                <div className="text-xl text-slate-500 font-medium mb-1.5">zł <span className="text-sm font-normal">/{isYearly ? 'rok' : 'msc'}</span></div>
                            </div>

                            <ul className="space-y-4 mb-2">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300 transition-colors">
                                        <div className="mt-0.5 rounded-full bg-white/5 p-1 border border-white/10">
                                            <Check size={12} className="text-red-400 shrink-0" />
                                        </div>
                                        <span className="leading-snug">{f.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 text-sm">
                        <ShieldCheck size={24} className="shrink-0 text-slate-500" />
                        <p className="leading-relaxed">Płatność jest bezpiecznie obsługiwana przez Stripe. Karta z autoryzacją TLS na profesjonalnym szyfrowaniu punktowym.</p>
                    </div>
                </div>

                {/* Right Side: Stripe Checkout UI */}
                <div className="relative w-full">
                    {/* Glowing Aura Behind the Form */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

                    <div className="bg-[#0a0a0c] border border-white/10 backdrop-blur-2xl shadow-2xl relative min-h-[500px] flex flex-col rounded-[2rem] overflow-hidden p-6 sm:p-8">
                        {error ? (
                            <div className="text-center p-6 space-y-4 relative z-10 m-auto">
                                <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                    <Lock size={24} />
                                </div>
                                <h3 className="font-bold text-xl text-white">Błąd Inicjalizacji</h3>
                                <p className="text-sm text-red-400/80 leading-relaxed">{error}</p>
                                <Button onClick={() => window.location.reload()} className="w-full mt-4 h-12 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10">Spróbuj Ponownie</Button>
                            </div>
                        ) : (isInitLoading || !clientSecret || !publishableKey) ? (
                            <div className="flex flex-col items-center justify-center gap-6 relative z-10 h-full m-auto">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                                    <Loader2 className="animate-spin text-red-500 relative z-10" size={32} />
                                </div>
                                <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase font-bold text-center">Nawiązywanie bezpiecznego<br />połączenia ze Stripe</p>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2">Dane płatności</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">System zaktualizuje parametry Twojego konta bezpośrednio po autoryzacji karty.</p>
                                </div>
                                <div className="p-1 flex-1">
                                    <StripeContainer clientSecret={clientSecret} publishableKey={publishableKey}>
                                        <CheckoutForm planId={planKey} />
                                    </StripeContainer>
                                </div>

                                {/* Bottom minimal trust badge inside Stripe block */}
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 opacity-50">
                                    <Lock className="w-3 h-3 text-slate-500" />
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">256-BIT ENCRYPTION</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[400px] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-red"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
