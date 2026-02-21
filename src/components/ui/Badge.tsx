import React from 'react';
import { cn } from '@/lib/utils';
import { TicketStatus, TicketCategory, TicketPriority } from '@/types';
import { Bug, Megaphone, Zap, AlertCircle } from 'lucide-react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: string;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'GENERAL', className = '' }) => {
    const styles: Record<string, string> = {
        [TicketStatus.PENDING]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        [TicketStatus.IN_PROGRESS]: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        [TicketStatus.REVIEW]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        [TicketStatus.DONE]: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        [TicketCategory.BUG]: "bg-red-500/10 text-red-400 border-red-500/20",
        [TicketCategory.MARKETING]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        [TicketCategory.FEATURE]: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        'GENERAL': "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    };

    const style = styles[variant] || styles['GENERAL'];

    return (
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", style, className)}>
            {children}
        </span>
    );
};

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
    const styles = {
        [TicketStatus.PENDING]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        [TicketStatus.IN_PROGRESS]: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
        [TicketStatus.REVIEW]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        [TicketStatus.DONE]: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };

    const labels = {
        [TicketStatus.PENDING]: "DO ZROBIENIA",
        [TicketStatus.IN_PROGRESS]: "W TRAKCIE",
        [TicketStatus.REVIEW]: "WERYFIKACJA",
        [TicketStatus.DONE]: "GOTOWE",
    };

    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", styles[status])}>
            {labels[status]}
        </span>
    );
};

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
    const styles = {
        [TicketPriority.LOW]: "text-slate-500",
        [TicketPriority.NORMAL]: "text-blue-400",
        [TicketPriority.HIGH]: "text-accent-warning",
        [TicketPriority.URGENT]: "text-accent-red animate-pulse",
    };

    const labels = {
        [TicketPriority.LOW]: "Niski",
        [TicketPriority.NORMAL]: "Normalny",
        [TicketPriority.HIGH]: "Wysoki",
        [TicketPriority.URGENT]: "PILNY",
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-white/5",
            styles[priority].replace('text-', 'border-').replace('animate-pulse', ''),
            styles[priority]
        )}>
            {labels[priority]}
        </span>
    );
};

export const CategoryBadge: React.FC<{ category: TicketCategory }> = ({ category }) => {
    const config = {
        [TicketCategory.BUG]: { icon: Bug, color: "text-red-400", label: "Błąd" },
        [TicketCategory.MARKETING]: { icon: Megaphone, color: "text-blue-400", label: "Marketing" },
        [TicketCategory.FEATURE]: { icon: Zap, color: "text-yellow-400", label: "Modyfikacja" },
        [TicketCategory.OTHER]: { icon: AlertCircle, color: "text-slate-500", label: "Inne" },
    };

    const badgeConfig = config[category] || config[TicketCategory.OTHER];
    const { icon: Icon, color, label } = badgeConfig;

    return (
        <span className={cn("flex items-center gap-1.5", color, "text-xs font-medium bg-white/5 px-2 py-1 rounded border border-white/5")}>
            {Icon && <Icon size={12} />} {label}
        </span>
    );
};
