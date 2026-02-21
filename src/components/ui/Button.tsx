import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    isLoading,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center px-4 h-10 rounded-xl transition-all duration-300 font-semibold text-sm focus:outline-none tracking-wide disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
        primary: "bg-accent-red hover:bg-accent-red-hover text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-transparent hover:scale-[1.02]",
        secondary: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md",
        danger: "bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800",
        ghost: "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Wczytuję...
                </span>
            ) : children}
        </button>
    );
};
