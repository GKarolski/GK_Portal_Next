import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-[#0d0d0d] border border-white/10 w-full md:max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] h-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/10 sticky top-0 bg-[#0d0d0d] z-10 rounded-t-3xl">
                    <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2 truncate pr-4">
                        <span className="w-1.5 h-6 bg-accent-red rounded-full flex-shrink-0"></span>
                        <span className="truncate">{title}</span>
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full flex-shrink-0 active:scale-95">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar relative">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const ImageViewer: React.FC<{ src: string, alt?: string, onClose: () => void }> = ({ src, alt, onClose }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <button className="absolute top-4 right-4 p-3 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full" onClick={onClose}>
                <X size={24} />
            </button>
            <img
                src={src}
                alt={alt || 'Podgląd'}
                className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200 select-none"
                onClick={e => e.stopPropagation()}
            />
        </div>
    );
};
