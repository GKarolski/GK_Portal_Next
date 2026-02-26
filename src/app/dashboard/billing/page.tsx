"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HardDrive, Zap, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { backend } from '@/services/api';
import { useRouter, useSearchParams } from 'next/navigation';

function BillingContent() {
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const isSuccess = searchParams.get('status') === 'success';

    useEffect(() => {
        fetchUsage();
    }, []);

    const fetchUsage = async () => {
        try {
            const res = await backend.getUsageStats();
            if (res.success) {
                setUsage(res.data);
            } else {
                throw new Error('Błąd pobierania danych');
            }
        } catch (e: any) {
            setError(e.message || 'Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        setIsUpgrading(planId);
        try {
            // Check if backend has this method, otherwise we mock it or use what's available
            if (typeof backend.createCheckoutSession === 'function') {
                const res = await backend.createCheckoutSession(planId);
                if (res.url) {
                    window.location.href = res.url;
                } else {
                    alert(res.error || 'Błąd tworzenia sesji');
                }
            } else {
                // Fallback mock logic for UI parity
                setTimeout(() => {
                    alert(`Symulacja przejścia do płatności Stripe dla planu: ${planId}`);
                    setIsUpgrading(null);
                }, 1500);
            }
        } catch (e) {
            alert('Błąd połączenia z modułem płatności');
            setIsUpgrading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-red mr-3"></div>
            Ładowanie danych subskrypcji...
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-400">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p>{error}</p>
            <Button onClick={fetchUsage} className="mt-4">Spróbuj ponownie</Button>
        </div>
    );

    const storagePercent = usage?.storage ? Math.min((usage.storage.used_mb / usage.storage.limit_mb) * 100, 100) : 0;
    const tokensPercent = usage?.ai ? Math.min((usage.ai.used_tokens / usage.ai.limit_tokens) * 100, 100) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* SUCCESS BANNER */}
            {isSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Sukces! Twój plan został zaktualizowany.</h3>
                        <p className="text-emerald-400/80 text-sm">Dziękujemy za zaufanie. Nowe limity są już aktywne.</p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic">Subskrypcja <span className="text-accent-red">&</span> Limity</h1>
                    <p className="text-slate-500 mt-1">Zarządzaj swoim planem i monitoruj zużycie zasobów AI.</p>
                </div>
                <Button variant="secondary" onClick={() => router.back()} className="hidden sm:flex gap-2">
                    <ArrowLeft size={16} /> Powrót
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CURRENT USAGE */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white/5 border-white/5 p-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-accent-red uppercase tracking-[0.2em]">Twój Obecny Plan</span>
                            <h2 className="text-4xl font-black text-white mt-1 mb-6">{usage?.plan || 'STARTER'}</h2>

                            <div className="space-y-6">
                                {/* Storage Stats */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                        <span className="text-slate-400 flex items-center gap-1"><HardDrive size={12} /> Dysk</span>
                                        <span className="text-white">{usage?.storage?.used_mb?.toFixed(1) || 0} MB / {(usage?.storage?.limit_mb || 1024) / 1024} GB</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                                            style={{ width: `${storagePercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Token Stats */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                        <span className="text-slate-400 flex items-center gap-1"><Zap size={12} /> AI Tokeny</span>
                                        <span className="text-white">{(usage?.ai?.used_tokens || 0).toLocaleString()} / {((usage?.ai?.limit_tokens || 100000) / 1000).toLocaleString()}k</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-accent-red to-orange-500 transition-all duration-1000"
                                            style={{ width: `${tokensPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-red/5 rounded-full blur-3xl -z-0" />
                    </Card>

                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-sm text-slate-400 flex gap-3">
                        <AlertCircle className="shrink-0 text-accent-red" size={20} />
                        <p>Limity odnawiają się automatycznie pierwszego dnia każdego miesiąca o godzinie 00:00.</p>
                    </div>
                </div>

                {/* PRICING CARDS */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PricingCard
                        name="STARTER"
                        price="89"
                        current={usage?.plan === 'STARTER'}
                        features={['1 GB Pojemności', '100k Tokenów AI', 'Podstawowe Modele', 'Wsparcie Email']}
                        onUpgrade={() => handleUpgrade('STARTER')}
                        isUpgrading={isUpgrading === 'STARTER'}
                    />
                    <PricingCard
                        name="STANDARD"
                        price="149"
                        current={usage?.plan === 'STANDARD'}
                        recommended
                        features={['5 GB Pojemności', '500k Tokenów AI', 'Smart Context', 'Wsparcie Priorytetowe']}
                        onUpgrade={() => handleUpgrade('STANDARD')}
                        isUpgrading={isUpgrading === 'STANDARD'}
                    />
                    <PricingCard
                        name="AGENCY"
                        price="259"
                        current={usage?.plan === 'AGENCY'}
                        features={['100 GB Pojemności', '2 MLN Tokenów AI', 'Wszystkie Funkcje', 'Dedykowany Opiekun']}
                        onUpgrade={() => handleUpgrade('AGENCY')}
                        isUpgrading={isUpgrading === 'AGENCY'}
                    />
                </div>
            </div>
        </div>
    );
}

const PricingCard: React.FC<{
    name: string;
    price: string;
    current?: boolean;
    recommended?: boolean;
    features: string[];
    onUpgrade: () => void;
    isUpgrading?: boolean;
}> = ({ name, price, current, recommended, features, onUpgrade, isUpgrading }) => (
    <div className={`relative p-8 rounded-3xl flex flex-col transition-all duration-300 ${recommended ? 'bg-gradient-to-b from-gk-800 to-gk-900 border-accent-red/30 shadow-2xl shadow-accent-red/10 scale-105 z-10' : 'bg-white/5 border border-white/5'}`}>
        {recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-red text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Najczęściej Wybierany
            </div>
        )}

        <div className="mb-8 mt-2">
            <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{price} zł</span>
                <span className="text-slate-500 text-sm italic">/ msc</span>
            </div>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
            {features.map((f, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-accent-red shrink-0" />
                    {f}
                </li>
            ))}
        </ul>

        {current ? (
            <div className="w-full py-3 rounded-2xl bg-white/10 border border-white/10 text-center text-slate-400 font-bold text-sm uppercase tracking-widest">
                Twój Plan
            </div>
        ) : (
            <Button
                variant={recommended ? 'primary' : 'secondary'}
                className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs"
                onClick={onUpgrade}
                isLoading={isUpgrading}
            >
                Zmień Plan
            </Button>
        )}
    </div>
);

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-400">Trwa ładowanie...</div>}>
            <BillingContent />
        </Suspense>
    );
}
