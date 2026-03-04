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

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

    const isYearly = searchParams.get('interval') === 'year';
    const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    if (!user) {
        return <div className="w-full h-full flex justify-center items-center"><Loader2 className="animate-spin text-red-500" /></div>;
    }

    return (
        <div className="w-full h-full flex items-center justify-center overflow-auto px-4 py-4 md:py-8">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="w-full max-w-5xl grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-10 items-start my-auto"
            >
                {/* Order Summary (Right on Desktop) */}
                <div className="flex flex-col space-y-6 lg:pl-4 order-1 lg:order-2">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 text-white">Sfinalizuj Zamówienie</h1>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                            Gratulacje, wybrałeś pakiet <span className="text-red-400 font-bold">{plan.name}</span>.<br /> Wprowadź informacje bilingowe, aby natychmiast odblokować dostęp.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-5 sm:p-6 rounded-[1.5rem] border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-500/10 blur-[60px] rounded-full pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-50" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Wybrany Plan</span>
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-bold tracking-widest uppercase rounded flex items-center gap-1.5">
                                    <Sparkles className="w-2.5 h-2.5" /> Premium
                                </span>
                            </div>

                            <div className="flex items-end gap-2 mb-6">
                                <div className="text-4xl font-black tracking-tighter text-white">{displayPrice}</div>
                                <div className="text-lg text-slate-500 font-medium mb-1">zł <span className="text-xs font-normal">/{isYearly ? 'rok' : 'msc'}</span></div>
                            </div>

                            <ul className="space-y-3 mb-1">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 transition-colors">
                                        <div className="mt-0.5 rounded-full bg-white/5 p-0.5 border border-white/10">
                                            <Check size={10} className="text-red-400 shrink-0" />
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

                {/* Stripe Checkout UI (Left on Desktop) */}
                <div className="relative w-full order-2 lg:order-1">
                    {/* Glowing Aura Behind the Form */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

                    <div className="bg-[#0a0a0c] border border-white/10 backdrop-blur-2xl shadow-2xl relative min-h-[450px] flex flex-col rounded-[1.5rem] overflow-hidden p-5 sm:p-6">
                        <div className="relative z-10 flex flex-col h-full opacity-0 animate-[fade-in_0.5s_ease-out_forwards]">
                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-white mb-1">Dane rozliczeniowe</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">Wypełnij formularz certyfikowany przez operatora Stripe. Rachunek zostanie wygenerowany na podane dane.</p>
                            </div>
                            <div className="flex-1">
                                <StripeContainer
                                    publishableKey={publishableKey}
                                    mode="subscription"
                                    amount={displayPrice}
                                    currency="pln"
                                >
                                    <CheckoutForm planId={planKey} />
                                </StripeContainer>
                            </div>

                            {/* Bottom minimal trust badge inside Stripe block */}
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 opacity-50">
                                <Lock className="w-3 h-3 text-slate-500" />
                                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Zabezpieczone 256-BIT SSL</span>
                            </div>
                        </div>
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
