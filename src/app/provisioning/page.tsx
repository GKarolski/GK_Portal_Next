"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Server, Globe, Shield, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { provisionInstance } from '@/actions/provisioning';

const steps = [
    { id: 'db', label: 'Konfiguracja bazy danych PostgreSQL...', icon: Database },
    { id: 'auth', label: 'Inicjalizacja Supabase RLS policies...', icon: Shield },
    { id: 'storage', label: 'Tworzenie kontenerów na pliki (Storage)...', icon: Server },
    { id: 'domain', label: 'Aliasing domeny i certyfikatów SSL...', icon: Globe },
    { id: 'done', label: 'Finalizacja konfiguracji...', icon: Sparkles }
];

function ProvisioningContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isProvisioned, setIsProvisioned] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // ACTUAL PROVISIONING LOGIC
        const startProvisioning = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("Nie znaleziono zalogowanego użytkownika.");
                return;
            }

            const company = user.user_metadata?.company_name || 'Nowa Organizacja';
            const plan = searchParams.get('plan') || 'STARTER';

            const result = await provisionInstance(user.id, company, plan);
            if (result.success) {
                setIsProvisioned(true);
            } else {
                setError("Błąd podczas konfiguracji instancji. Proszę skontaktować się z supportem.");
                console.error("Provisioning action failed", result.error);
            }
        };

        startProvisioning();
    }, [searchParams]);

    useEffect(() => {
        if (error) return; // Stop animation if error occurs

        if (currentStep < steps.length) {
            const timer = setTimeout(() => {
                // If we are at the last step but not provisioned yet, wait
                if (currentStep === steps.length - 1 && !isProvisioned) return;

                setCompletedSteps(prev => [...prev, currentStep]);
                setCurrentStep(prev => prev + 1);
            }, 1000 + Math.random() * 1000);
            return () => clearTimeout(timer);
        } else if (isProvisioned) {
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        }
    }, [currentStep, isProvisioned, error, router]);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Animation Elements */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full"
                />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-red/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="w-full max-w-lg z-10 flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#171717] to-black border border-white/10 flex items-center justify-center text-accent-red font-bold text-2xl mb-6 mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                    >
                        GK
                    </motion.div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2 uppercase">Wydzielanie Instancji</h1>
                    <p className="text-slate-500 text-sm font-medium">To potrwa tylko chwilę. Budujemy Twoje centrum dowodzenia...</p>
                </div>

                {/* Progress Card */}
                <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                    {/* Animated Scanning Line */}
                    <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-px bg-accent-red/20 z-0 pointer-events-none"
                    />

                    <div className="space-y-6 relative z-10">
                        {steps.map((step, index) => {
                            const isCompleted = completedSteps.includes(index);
                            const isActive = currentStep === index;
                            const Icon = step.icon;

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: isActive || isCompleted ? 1 : 0.2 }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : isActive ? 'bg-accent-red/10 text-accent-red' : 'bg-white/5 text-slate-600'}`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className={`text-sm font-medium ${isCompleted ? 'text-slate-100' : isActive ? 'text-white' : 'text-slate-600'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {isCompleted ? (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : isActive ? (
                                        <Loader2 size={16} className="text-accent-red animate-spin" />
                                    ) : null}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="mt-10 pt-6 border-t border-white/5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                            <span>Status Systemu</span>
                            <span>{Math.min(Math.round((completedSteps.length / steps.length) * 100), 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                                className="h-full bg-accent-red shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                transition={{ ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center max-w-sm"
                    >
                        {error}
                        <Button
                            variant="secondary"
                            onClick={() => window.location.reload()}
                            className="mt-4 w-full h-10 text-xs"
                        >
                            Spróbuj Ponownie
                        </Button>
                    </motion.div>
                )}

                {/* Footer Quote */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 text-[11px] text-slate-600 italic text-center font-serif"
                >
                    "Dobre systemy powstają w ciszy. Twoja agencja zaraz zyska nowy silnik."
                </motion.p>
            </div>
        </div>
    );
}

export default function ProvisioningPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-red"></div>
            </div>
        }>
            <ProvisioningContent />
        </Suspense>
    );
}
