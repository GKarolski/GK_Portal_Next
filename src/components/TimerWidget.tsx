"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Clock, Square, GripHorizontal, X } from 'lucide-react';
import { backend } from '@/services/api';

const TimerWidget: React.FC = () => {
    const { activeTicketId, elapsedSeconds, stopTimer } = useTimer();
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const [ticketSubject, setTicketSubject] = useState('');

    // Format Seconds to HH:MM:SS
    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.preventDefault();
    };

    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 280, e.clientX - dragOffset.current.x)),
                y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y))
            });
        };
        const up = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        }
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
    }, [isDragging]);

    // Fetch ticket subject
    useEffect(() => {
        if (activeTicketId) {
            backend.getTicket(activeTicketId).then(t => {
                setTicketSubject(t?.subject || `#${activeTicketId.slice(0, 8)}`);
            }).catch(() => {
                setTicketSubject(`#${activeTicketId.slice(0, 8)}`);
            });
        }
    }, [activeTicketId]);

    const handleTitleClick = () => {
        // Dispatch event to open ticket detail
        window.dispatchEvent(new CustomEvent('open-ticket', { detail: { ticketId: activeTicketId } }));
    };

    if (!activeTicketId) return null;

    return (
        <div
            className="fixed z-[9999] select-none"
            style={{ left: position.x, top: position.y }}
        >
            <div className={`flex items-center gap-3 bg-gk-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl px-4 py-3 shadow-2xl shadow-red-500/20 ${isDragging ? '' : 'animate-pulse'}`}>
                {/* Drag Handle */}
                <button
                    onMouseDown={handleMouseDown}
                    className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors"
                    title="Przeciągnij"
                >
                    <GripHorizontal size={16} />
                </button>

                {/* Timer Display */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-mono font-bold text-white text-lg tracking-wider">
                        {formatTime(elapsedSeconds)}
                    </span>
                </div>

                {/* Ticket Subject */}
                <button
                    onClick={handleTitleClick}
                    className="text-xs text-slate-400 hover:text-white truncate max-w-[120px] transition-colors"
                    title={ticketSubject}
                >
                    {ticketSubject}
                </button>

                {/* Stop Button */}
                <button
                    onClick={() => stopTimer()}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white rounded-lg transition-all"
                    title="Zatrzymaj stoper"
                >
                    <Square size={14} />
                </button>
            </div>
        </div>
    );
};

export default TimerWidget;
