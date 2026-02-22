"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthName } from '@/utils/dateUtils';

interface MonthSelectorProps {
    currentMonth: string; // YYYY-MM
    onMonthChange: (month: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonth, onMonthChange }) => {

    const handleStep = (step: number) => {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1 + step, 1);
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        onMonthChange(newMonth);
    };

    return (
        <div className="flex items-center bg-gk-900 rounded-xl p-1 border border-white/10 h-10 shadow-sm transition-all hover:border-white/20">
            <button
                onClick={() => handleStep(-1)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Poprzedni miesiąc"
            >
                <ChevronLeft size={18} />
            </button>

            <div className="px-3 flex items-center gap-2 min-w-[140px] justify-center h-full group">
                <Calendar size={14} className="text-gk-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm font-bold capitalize select-none pt-0.5">
                    {formatMonthName(currentMonth)}
                </span>
            </div>

            <button
                onClick={() => handleStep(1)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Następny miesiąc"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default MonthSelector;
