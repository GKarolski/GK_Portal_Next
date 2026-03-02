"use client";
import React, { useEffect, useState, Suspense } from "react";
import { motion, Variants } from "framer-motion";
import PlanSelector from "@/components/PlanSelector";
import UpsellModal from "@/components/UpsellModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

function ChoosePlanContent() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedPlan = searchParams.get('plan') as string | null;

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace("/login");
            } else if (user.isActive) {
                // If they're already active, they shouldn't be picking a plan
                router.replace("/dashboard");
            } else if (preselectedPlan === "EXPERT") {
                // Expert has no upsell, go straight to checkout
                router.replace(`/checkout?plan=EXPERT&interval=month`);
            }
        }
    }, [user, isLoading, router, preselectedPlan]);

    if (isLoading || !user || preselectedPlan === "EXPERT") {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)] pointer-events-none" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                </motion.div>
            </div>
        );
    }

    const hasUpsell = preselectedPlan === "STARTER" || preselectedPlan === "PROFESSIONAL";

    return (
        <div className="min-h-screen bg-[#050505] text-[#f5f5f5] flex flex-col items-center">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)]" />
            </div>

            {/* Navigation Strip */}
            <div className="w-full relative z-20 mt-6 lg:mt-8">
                <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1a1a2e] to-black border border-white/10 flex items-center justify-center text-red-500 font-bold text-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">GK</div>
                        <span className="font-bold text-lg tracking-tight text-white">GK_<span className="text-red-500">Digital</span></span>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12 md:py-20 relative z-10 flex flex-col items-center">

                {!hasUpsell && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="text-center mb-16 max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500 mb-6">
                            KONTO ZAREJESTROWANE
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Gotowy na skok jakościowy?</h1>
                        <p className="text-slate-400 text-lg">
                            Cześć <span className="text-white font-medium">{user.name.split(' ')[0]}</span>! Twoje konto jest już w systemie. Wybierz pakiet, który najlepiej odpowiada Twoim potrzebom, aby w pełni aktywować przestrzeń roboczą dla Ciebie i Twoich klientów.
                        </p>
                    </motion.div>
                )}

                {hasUpsell ? (
                    <UpsellModal
                        basePlan={preselectedPlan as string}
                        isYearly={false} // Assume monthly as default from landing, user can change later or we read it from params if implemented
                        inline
                        onClose={() => { }}
                    />
                ) : (
                    <PlanSelector mode="select" />
                )}

                {/* Steps Indicator Bottom */}
                <div className="flex justify-center gap-2 mt-16 relative z-10">
                    <div className="w-2 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-12 h-1 bg-accent-red rounded-full"></div>
                    <div className="w-2 h-1 bg-white/30 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}

export default function ChoosePlanPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)] pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                </div>
            </div>
        }>
            <ChoosePlanContent />
        </Suspense>
    );
}
