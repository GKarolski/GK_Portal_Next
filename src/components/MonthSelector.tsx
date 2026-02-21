import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthName } from '@/utils/dateUtils';

interface MonthSelectorProps {
    currentMonth: string;
    onMonthChange: (month: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonth, onMonthChange }) => {
    const handlePrev = () => {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 2);
        onMonthChange(date.toISOString().slice(0, 7));
    };

    const handleNext = () => {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month);
        onMonthChange(date.toISOString().slice(0, 7));
    };

    const handleToday = () => {
        onMonthChange(new Date().toISOString().slice(0, 7));
    };

    return (
        <div className="flex items-center gap-1 bg-gk-900 rounded-xl p-1 border border-white/10 h-10">
            <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                title="Poprzedni miesiąc"
            >
                <ChevronLeft size={16} />
            </button>

            <button
                onClick={handleToday}
                className="px-2 py-1 flex items-center gap-2 hover:bg-white/5 rounded-lg transition-colors group min-w-[140px] justify-center"
                title="Bieżący miesiąc"
            >
                <Calendar size={14} className="text-accent-red group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap">
                    {formatMonthName(currentMonth)}
                </span>
            </button>

            <button
                onClick={handleNext}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                title="Następny miesiąc"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default MonthSelector;
