"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, PlayCircle, Bot, Building, Lock, Code2 } from "lucide-react";
import UpsellModal from "./UpsellModal";
import { useRouter } from "next/navigation";

export interface PlanSelectorProps {
    mode: "link" | "select";
}

const plans = [
    {
        id: "STARTER",
        name: "Starter",
        monthlyPrice: 129,
        yearlyPrice: 107,
        desc: "Na smak i wejście w uporządkowaną pracę z mniejszą bazą klientów.",
        features: [
            { icon: PlayCircle, text: "Webinar onboardingowy (migracja z excela)", highlight: true },
            { icon: Bot, text: "Podstawowy Asystent AI (mały limit zapytań)", purple: true },
            { icon: Check, text: "1 Użytkownik (Właściciel)" },
            { icon: Check, text: "15 Aktywnych Klientów" },
            { icon: Check, text: "5 GB Sejf Cyfrowy na pliki" },
        ],
        cta: "Zacznij od Startera",
        href: "/register?plan=STARTER",
        featured: false,
    },
    {
        id: "PROFESSIONAL",
        name: "Professional",
        monthlyPrice: 249,
        yearlyPrice: 207,
        desc: "Pełen pakiet produktywności dla skalujących się solistów i teamów.",
        features: [
            { icon: PlayCircle, text: "Webinar onboardingowy (szybka migracja)", highlight: true },
            { icon: Bot, text: "Nielimitowany AI Asystent czytający duże załączniki do zgłoszeń.", purple: true },
            { icon: Check, text: "6 Użytkowników z uprawnieniami" },
            { icon: Check, text: "Nielimitowani Klienci na platformie" },
            { icon: Check, text: "25 GB Sejf Cyfrowy" },
            { icon: Check, text: "Role dla pracowników" },
        ],
        cta: "Wybieram Professional",
        href: "/register?plan=PROFESSIONAL",
        featured: true,
        badge: "Najczęściej Wybierany",
    },
    {
        id: "EXPERT",
        name: "Expert",
        monthlyPrice: 599,
        yearlyPrice: 499,
        desc: "Dla pracowni z dużym przepływem potężnych plików.",
        features: [
            { icon: PlayCircle, text: "Webinar + 1h Custom Konsultacji IT z inżynierem", highlight: true },
            { icon: Bot, text: "Customowe modele AI trenowane na Twoich starych zleceniach.", purple: true },
            { icon: Check, text: "Nielimitowani Pracownicy" },
            { icon: Check, text: "100 GB Super Szybkiego Dysku" },
            { icon: Check, text: "Priorytetowy Support 24/7 na WhatsApp" },
        ],
        cta: "Wybierz Expert",
        href: "/register?plan=EXPERT",
        featured: false,
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.4, 0.25, 1] as const },
    }),
};

export default function PlanSelector({ mode }: PlanSelectorProps) {
    const [isYearly, setIsYearly] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const router = useRouter();

    const handleSelectPlan = (planId: string) => {
        if (mode === "link") {
            const plan = plans.find((p) => p.id === planId);
            if (plan) {
                router.push(plan.href);
            }
        } else {
            // Mode "select" - trigger upsell modal if applicable
            setSelectedPlan(planId);

            // If Expert is selected, no upsell, go straight to checkout
            if (planId === "EXPERT") {
                window.location.href = `/api/checkout?plan=EXPERT&interval=${isYearly ? 'year' : 'month'}`;
            }
        }
    };

    return (
        <div className="w-full relative z-10">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-16">
                <span className={"font-semibold transition-colors" + (isYearly ? " text-slate-500" : " text-white")}>
                    Miesięcznie
                </span>
                <button
                    className={"w-14 h-7 rounded-full relative transition-all duration-300 cursor-pointer" + (isYearly ? " bg-emerald-500" : " bg-[#3f3f46] border border-[#52525b]")}
                    onClick={() => setIsYearly(!isYearly)}
                >
                    <div className={"absolute top-[3px] left-[3px] w-[20px] h-[20px] bg-white rounded-full transition-all duration-300 shadow-md" + (isYearly ? " translate-x-[28px]" : "")}></div>
                </button>
                <span className={"font-semibold flex items-center gap-2 transition-colors" + (isYearly ? " text-white" : " text-slate-500")}>
                    Rocznie <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">2 M-CE GRATIS</span>
                </span>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10 w-full">
                {plans.map((plan, idx) => {
                    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                    const oldPrice = isYearly ? plan.monthlyPrice : null;

                    if (plan.featured) {
                        return (
                            <motion.div key={idx} variants={fadeUp} custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} className="animated-border-box transform lg:-translate-y-4 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.4)]">
                                <div className="bg-[#0a0a0a]/90 h-full w-full rounded-[calc(1.5rem-2px)] p-6 lg:p-8 flex flex-col relative z-20 backdrop-blur-xl">
                                    {plan.badge && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-4 py-1.5 rounded-b-xl uppercase tracking-widest w-max shadow-lg shadow-red-500/50">{plan.badge}</div>}
                                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 mb-2 mt-4">{plan.name}</h3>
                                    <div className="flex items-end gap-2 mb-1">
                                        <div className="text-4xl lg:text-5xl font-black text-white tracking-tight">{price}<span className="text-xl"> zł</span></div>
                                        {oldPrice && <div className="text-base text-slate-500 line-through font-bold mb-1.5">{oldPrice} zł</div>}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mb-4 font-medium uppercase tracking-wider">/msc</div>
                                    <p className="text-xs text-slate-300 mb-6 pb-4 border-b border-white/10">{plan.desc}</p>
                                    <ul className="space-y-3 mb-6 flex-1">
                                        {plan.features.map((f, fi) => (
                                            <li key={fi} className="flex items-start gap-3 text-white">
                                                <f.icon className={`w-4 h-4 shrink-0 mt-0.5 ${f.purple ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : f.highlight ? "text-red-500" : "text-emerald-500"}`} />
                                                <span className="text-[11px]">{f.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleSelectPlan(plan.id)} className="btn btn-premium btn-md w-full text-base mt-auto cursor-pointer">{plan.cta}</button>
                                </div>
                            </motion.div>
                        );
                    }
                    return (
                        <motion.div key={idx} variants={fadeUp} custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} className="glass-panel-light p-6 lg:p-8 rounded-3xl border border-white/5 flex flex-col relative transition-all hover:bg-white/[0.04] hover:-translate-y-1">
                            <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-end gap-2 mb-1">
                                <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">{price}<span className="text-lg"> zł</span></div>
                                {oldPrice && <div className="text-sm text-slate-500 line-through font-bold mb-1">{oldPrice} zł</div>}
                            </div>
                            <div className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-wider">/msc</div>
                            <p className="text-xs text-slate-400 mb-6 pb-4 border-b border-white/5">{plan.desc}</p>
                            <ul className="space-y-3 mb-6 flex-1">
                                {plan.features.map((f, fi) => (
                                    <li key={fi} className="flex items-start gap-3 text-[11px] text-slate-300">
                                        <f.icon className={`w-4 h-4 shrink-0 mt-0.5 ${f.purple ? "text-purple-400" : f.highlight ? "text-red-500" : "text-emerald-500"}`} />
                                        <span>{f.text}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => handleSelectPlan(plan.id)} className="btn btn-secondary btn-sm w-full cursor-pointer">{plan.cta}</button>
                        </motion.div>
                    );
                })}

                {/* Enterprise */}
                <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} className="glass-panel-light p-6 lg:p-8 rounded-3xl border border-transparent bg-gradient-to-b from-white/[0.05] to-transparent flex flex-col relative transition-all">
                    <h3 className="text-lg font-bold text-slate-400 mb-2">Enterprise</h3>
                    <div className="text-2xl lg:text-3xl font-black text-white mb-1 mt-1 tracking-tight">Kontakt</div>
                    <div className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-wider">&nbsp;</div>
                    <p className="text-xs text-slate-400 mb-6 pb-4 border-b border-white/5">Serwery dedykowane i szycie aplikacji pod Twój proces na zamówienie.</p>
                    <ul className="space-y-3 mb-6 flex-1 opacity-70">
                        <li className="flex items-start gap-3 text-[11px] text-slate-300"><Building className="w-4 h-4 text-slate-500 shrink-0" /> Instancja Dedykowana / On-Premise</li>
                        <li className="flex items-start gap-3 text-[11px] text-slate-300"><Lock className="w-4 h-4 text-slate-500 shrink-0" /> Umowa SLA 99.9%</li>
                        <li className="flex items-start gap-3 text-[11px] text-slate-300"><Code2 className="w-4 h-4 text-slate-500 shrink-0" /> Custom Integracje z bankami lub fakturowaniem (API)</li>
                    </ul>
                    <a href="/kontakt" className="btn btn-secondary btn-sm w-full border-slate-700 text-slate-400 hover:text-white mt-auto block text-center">Napisz do nas</a>
                </motion.div>
            </div>

            {/* Upsell Modal */}
            <AnimatePresence>
                {selectedPlan && (selectedPlan === "STARTER" || selectedPlan === "PROFESSIONAL") && mode === "select" && (
                    <UpsellModal
                        basePlan={selectedPlan}
                        isYearly={isYearly}
                        onClose={() => setSelectedPlan(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
