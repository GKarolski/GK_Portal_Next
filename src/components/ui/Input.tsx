import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
    <div className="flex flex-col gap-2 w-full">
        {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>}
        <input
            className={cn(
                "bg-gk-900/50 border border-white/10 rounded-xl px-4 h-10 text-sm text-slate-100 placeholder-slate-700 focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all hover:border-white/20",
                className
            )}
            {...props}
        />
    </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => (
    <div className="flex flex-col gap-2 w-full">
        {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>}
        <textarea
            className={cn(
                "bg-gk-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-700 focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all hover:border-white/20 resize-none",
                className
            )}
            {...props}
        />
    </div>
);
