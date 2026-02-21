import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export const WizardSelectionCard: React.FC<{
    icon: LucideIcon,
    title: string,
    desc: string,
    active: boolean,
    onClick: () => void
}> = ({ icon: Icon, title, desc, active, onClick }) => (
    <div
        onClick={onClick}
        className={cn(
            "cursor-pointer p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center text-center gap-4 group",
            active
                ? "bg-accent-red/10 border-accent-red shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
        )}
    >
        <div className={cn(
            "p-4 rounded-full transition-colors",
            active ? "bg-accent-red text-white" : "bg-white/5 text-slate-400 group-hover:text-white"
        )}>
            <Icon size={32} />
        </div>
        <div>
            <h3 className={cn(
                "font-bold text-lg transition-colors",
                active ? "text-white" : "text-slate-300 group-hover:text-white"
            )}>{title}</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{desc}</p>
        </div>
    </div>
);
