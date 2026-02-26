import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, style?: React.CSSProperties }> = ({ children, className = '', onClick, style }) => (
    <div
        onClick={onClick}
        style={style}
        className={cn(
            "glass-card rounded-3xl p-5 md:p-6 transition-all duration-300",
            onClick && "cursor-pointer hover:border-accent-red/30 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]",
            className
        )}
    >
        {children}
    </div>
);
