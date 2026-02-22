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

function CheckoutContent() {
    const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const planKey = (searchParams.get('plan') || 'STARTER').toUpperCase() as keyof typeof plans;
    const plan = plans[planKey] || plans.STARTER;

    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: planKey,
                    email: user?.email
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Błąd podczas inicjowania płatności.');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Wystąpił nieoczekiwany błąd płatności.');
            setIsLoading(false);
        }
    };

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

                {/* Simulated Payment UI */}
                <Card className="p-8 border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-accent-red" /> Formy Płatności
                    </h2>

                    <div className="space-y-4 mb-8">
                        <div className="p-4 rounded-xl border border-accent-red bg-accent-red/5 flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-[10px] text-white">VISA</div>
                                <span className="text-sm font-medium">Karta Płatnicza</span>
                            </div>
                            <div className="w-4 h-4 rounded-full border-2 border-accent-red flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-accent-red"></div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-white/5 hover:bg-white/5 flex items-center justify-between cursor-pointer group transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-[8px] text-white italic">PayPal</div>
                                <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">PayPal</span>
                            </div>
                            <div className="w-4 h-4 rounded-full border-2 border-white/10"></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 font-mono text-[10px] uppercase text-slate-500">Kwit płatności: <span className="text-white">Nowa Instancja</span></div>
                            <div className="space-y-1.5 font-mono text-[10px] uppercase text-slate-500 text-right">Waluta: <span className="text-white">PLN</span></div>
                        </div>

                        <Button
                            onClick={handlePayment}
                            isLoading={isLoading}
                            className="w-full h-14 bg-accent-red hover:bg-accent-redHover text-lg font-bold shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                        >
                            Aktywuj System & Setup <Zap className="w-5 h-5 ml-2 fill-white" />
                        </Button>
                    </div>

                    <p className="mt-6 text-[10px] text-slate-600 text-center leading-relaxed">
                        Klikając "Aktywuj System", zgadzasz się na regulamin świadczenia usług drogą elektroniczną. Subskrypcja może być anulowana w dowolnym momencie.
                    </p>
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
