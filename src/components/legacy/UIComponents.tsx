import React, { useEffect, useState } from 'react';
import { X, ChevronDown, Check, AlertTriangle, AlertCircle, Clock, CheckCircle2, Maximize2 } from 'lucide-react';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types';

// --- BUTTON ---
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; isLoading?: boolean }> = ({
    children, className = '', variant = 'primary', isLoading, ...props
}) => {
    const base = "h-11 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95";
    const variants = {
        primary: "bg-gradient-to-tr from-accent-red to-red-600 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5",
        secondary: "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white",
        ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
        </button>
    );
};

// --- INPUT & TEXTAREA ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
    <div className="space-y-2 w-full">
        {label && <label className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-500 ml-1">{label}</label>}
        <input
            className={`w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-red/50 focus:bg-white/10 transition-all ${className}`}
            {...props}
        />
    </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
    <div className="space-y-2 w-full">
        {label && <label className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-500 ml-1">{label}</label>}
        <textarea
            className={`w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-red/50 focus:bg-white/10 transition-all resize-none ${className}`}
            {...props}
        />
    </div>
);

// --- SELECT ---
export const Select: React.FC<{ label?: string, value: string, onChange: (e: any) => void, options: { value: string, label: string }[], className?: string }> = ({ label, value, onChange, options, className = '' }) => (
    <div className="space-y-2 w-full">
        {label && <label className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-500 ml-1">{label}</label>}
        <div className="relative group">
            <select
                value={value}
                onChange={onChange}
                className={`w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-accent-red/50 focus:bg-white/10 transition-all cursor-pointer ${className}`}
            >
                {options.map(opt => <option key={opt.value} value={opt.value} className="bg-gk-900 text-white">{opt.label}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-accent-red group-hover:text-slate-300 transition-colors" size={16} />
        </div>
    </div>
);

// --- CARD ---
export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white/5 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-white/10 hover:border-white/10 hover:-translate-y-1 active:scale-[0.98]' : ''} ${className}`}
    >
        {children}
    </div>
);

// --- BADGES ---
export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
    const config = {
        [TicketStatus.REVIEW]: { label: 'Weryfikacja', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
        [TicketStatus.PENDING]: { label: 'Oczekujące', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
        [TicketStatus.IN_PROGRESS]: { label: 'W realizacji', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: Clock },
        [TicketStatus.DONE]: { label: 'Zakończone', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 }
    };
    const { label, color, icon: Icon } = config[status] || config[TicketStatus.PENDING];
    return (
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${color}`}>
            <Icon size={10} strokeWidth={3} />
            {label}
        </div>
    );
};

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
    const config = {
        [TicketPriority.LOW]: { label: 'Niski', color: 'text-slate-500' },
        [TicketPriority.NORMAL]: { label: 'Normalny', color: 'text-blue-400' },
        [TicketPriority.HIGH]: { label: 'Wysoki', color: 'text-amber-500' },
        [TicketPriority.URGENT]: { label: 'PILNY', color: 'text-red-500 animate-pulse' }
    };
    const { label, color } = config[priority] || config[TicketPriority.NORMAL];
    return <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>;
};

export const CategoryBadge: React.FC<{ category: TicketCategory }> = ({ category }) => {
    const colors = {
        [TicketCategory.BUG]: "text-red-400 bg-red-400/10 border-red-400/20",
        [TicketCategory.MARKETING]: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
        [TicketCategory.FEATURE]: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        [TicketCategory.OTHER]: "text-slate-400 bg-slate-400/10 border-slate-400/20"
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${colors[category] || colors[TicketCategory.OTHER]}`}>
            {category}
        </span>
    );
};

// --- MODAL ---
export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gk-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
            <div className="bg-[#0c0c0c] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 flex flex-col animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8 border-b border-white/5 flex items-center justify-between flex-none bg-[#0c0c0c]/50 backdrop-blur-md">
                    <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all transform hover:rotate-90">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- IMAGE VIEWER ---
export const ImageViewer: React.FC<{ src: string, onClose: () => void }> = ({ src, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all transform hover:rotate-90 z-20">
            <X size={24} />
        </button>
        <img src={src} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-90 duration-300" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white/50 text-sm font-medium">
            Widok pełnoekranowy
        </div>
    </div>
);
