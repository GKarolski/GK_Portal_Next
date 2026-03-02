"use client";
import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import PlanSelector from "@/components/PlanSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function ChoosePlanPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace("/login");
            } else if (user.isActive) {
                // If they're already active, they shouldn't be picking a plan
                router.replace("/dashboard");
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-[#f5f5f5] flex flex-col items-center">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)]" />
            </div>

            {/* Navigation Strip */}
            <div className="w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md relative z-20">
                <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1a1a2e] to-black border border-white/10 flex items-center justify-center text-red-500 font-bold text-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">GK</div>
                        <span className="font-bold text-lg tracking-tight text-white">GK_<span className="text-red-500">Digital</span></span>
                    </div>
                    <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 flex items-center gap-2">
                        Krok 2 z 3 <ArrowRight className="w-3 h-3" /> Aktywacja
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12 md:py-24 relative z-10 flex flex-col items-center">

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

                {/* Shared Plan Selector */}
                <PlanSelector mode="select" />

            </div>
        </div>
    );
}
