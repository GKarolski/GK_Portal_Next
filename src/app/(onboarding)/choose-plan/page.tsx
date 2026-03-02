"use client";
import React, { useEffect, useState, Suspense } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
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
                router.replace(`/ checkout ? plan = EXPERT & interval=month`);
            }
        }
    }, [user, isLoading, router, preselectedPlan]);

    return (
        <div className="w-full flex-col items-center flex">
            {isLoading || !user || preselectedPlan === "EXPERT" ? (
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                </div>
            ) : (
                <>
                    {!(preselectedPlan === "STARTER" || preselectedPlan === "PROFESSIONAL") && (
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="text-center mb-16 max-w-2xl"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500 mb-6 transition-all">
                                KONTO ZAREJESTROWANE
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-extrabold mb-6 tracking-tight">Gotowy na skok jakościowy?</h1>
                            <p className="text-slate-400 text-lg">
                                Cześć <span className="text-white font-medium">{user.name.split(' ')[0]}</span>! Twoje konto jest już w systemie. Wybierz pakiet, który najlepiej odpowiada Twoim potrzebom, aby w pełni aktywować przestrzeń roboczą dla Ciebie i Twoich klientów.
                            </p>
                        </motion.div>
                    )}

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="w-full relative z-10"
                    >
                        {(preselectedPlan === "STARTER" || preselectedPlan === "PROFESSIONAL") ? (
                            <UpsellModal
                                basePlan={preselectedPlan as string}
                                isYearly={false} // Assume monthly as default from landing, user can change later or we read it from params if implemented
                                inline
                                onClose={() => { }}
                            />
                        ) : (
                            <PlanSelector mode="select" />
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}

export default function ChoosePlanPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
        }>
            <ChoosePlanContent />
        </Suspense>
    );
}
