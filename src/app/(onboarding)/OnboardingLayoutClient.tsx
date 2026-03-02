"use client";

import { usePathname } from 'next/navigation';

export function OnboardingLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '';

    // Determine active step based on pathname
    let step = 1;
    if (pathname.includes('/choose-plan')) step = 2;
    if (pathname.includes('/checkout')) step = 3;

    return (
        <div className="min-h-screen bg-[#050505] text-[#f5f5f5] flex flex-col items-center overflow-hidden">
            {/* Ambient Background - Constant globally for onboarding flow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)]" />
            </div>

            {/* Navigation Strip - Constant globally for onboarding flow */}
            <div className="w-full relative z-20 mt-6 lg:mt-8">
                <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1a1a2e] to-black border border-white/10 flex items-center justify-center text-red-500 font-bold text-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">GK</div>
                        <span className="font-bold text-lg tracking-tight text-white">GK_<span className="text-red-500">Digital</span></span>
                    </div>
                </div>
            </div>

            {/* Content Container (Child pages handle their own enter animations) */}
            <div className="flex-1 w-full max-w-[1200px] mx-auto relative z-10 flex flex-col h-full justify-center">
                {children}
            </div>

            {/* Steps Indicator Bottom - Smoothly transitions its w- width properties */}
            <div className="flex justify-center gap-2 pb-12 pt-6 relative z-10 w-full shrink-0">
                <div className={`h-1.5 rounded-full transition-all duration-700 ease-in-out ${step === 1 ? 'w-12 bg-accent-red shadow-[0_0_10px_rgba(239,68,68,0.4)]' : step > 1 ? 'w-2 bg-accent-red opacity-50' : 'w-2 bg-white/30'}`}></div>
                <div className={`h-1.5 rounded-full transition-all duration-700 ease-in-out ${step === 2 ? 'w-12 bg-accent-red shadow-[0_0_10px_rgba(239,68,68,0.4)]' : step > 2 ? 'w-2 bg-accent-red opacity-50' : 'w-2 bg-white/30'}`}></div>
                <div className={`h-1.5 rounded-full transition-all duration-700 ease-in-out ${step === 3 ? 'w-12 bg-accent-red shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'w-2 bg-white/30'}`}></div>
            </div>
        </div>
    );
}
