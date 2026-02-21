export const MONTH_NAMES_PL = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export const getStartOfMonth = (date: Date = new Date()): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date = new Date()): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const formatFullDate = (dateString: string | Date): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
};

export const getCurrentMonthISO = (): string => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
};

export const formatMonthName = (monthISO: string): string => {
    const [year, month] = monthISO.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return `${MONTH_NAMES_PL[monthIndex]} ${year}`;
};
