"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { backend } from '@/services/api';
import { User } from '@/types';

interface TimerContextType {
    activeTicketId: string | null;
    activeTicketTitle: string | null;
    elapsedSeconds: number;
    startTimer: (ticketId: string) => Promise<void>;
    stopTimer: () => Promise<void>;
    pauseTimer: () => Promise<void>;
    resumeTimer: () => Promise<void>;
    pausedTicket: { id: string, title: string, time: number } | null;
    isActive: boolean;
    isMinimized: boolean;
    setIsMinimized: (val: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: ReactNode, user: User | null }> = ({ children, user }) => {
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [activeTicketTitle, setActiveTicketTitle] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [pausedTicket, setPausedTicket] = useState<{ id: string, title: string, time: number } | null>(null);
    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('gk_timer_minimized') === 'true';
        }
        return false;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('gk_timer_minimized', isMinimized.toString());
        }
    }, [isMinimized]);

    // Sync with Backend on Mount
    useEffect(() => {
        if (!user) return;

        const syncTimer = async () => {
            try {
                const res = await backend.getActiveTimer(user.id);
                if (res.active && res.session) {
                    setActiveTicketId(res.session.ticket_id);
                    setActiveTicketTitle(res.session.ticket_subject || "Zadanie");
                    const start = new Date(res.session.start_time);
                    setStartTime(start);
                    setPausedTicket(null);

                    const now = new Date();
                    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
                    setElapsedSeconds(diff > 0 ? diff : 0);
                } else if (typeof window !== 'undefined') {
                    const storedPause = localStorage.getItem('gk_paused_timer');
                    if (storedPause) {
                        setPausedTicket(JSON.parse(storedPause));
                    }
                }
            } catch (e) {
                console.error("Timer Sync Error", e);
            }
        };

        syncTimer();
    }, [user]);

    // Local Tik-Tok
    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            setElapsedSeconds(diff > 0 ? diff : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const startTimer = async (ticketId: string) => {
        if (!user) return;
        setIsMinimized(false);
        try {
            const res = await backend.startTimer(user.id, ticketId);
            if (res.success) {
                setActiveTicketId(ticketId);

                const activeRes = await backend.getActiveTimer(user.id);
                if (activeRes.session) setActiveTicketTitle(activeRes.session.ticket_subject || "Zadanie");

                const start = new Date(res.start_time);
                setStartTime(start);
                setElapsedSeconds(0);

                setPausedTicket(null);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('gk_paused_timer');
                }
            }
        } catch (e) {
            console.error("Start Timer Fail", e);
        }
    };

    const stopTimer = async () => {
        if (!user) return;
        try {
            await backend.stopTimer(user.id);
            setIsMinimized(false);
            setActiveTicketId(null);
            setActiveTicketTitle(null);
            setStartTime(null);
            setElapsedSeconds(0);
            setPausedTicket(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('gk_paused_timer');
            }
        } catch (e) {
            console.error("Stop Timer Fail", e);
        }
    };

    const pauseTimer = async () => {
        if (!activeTicketId || !user) return;
        try {
            await backend.stopTimer(user.id);
            const pauseState = {
                id: activeTicketId,
                title: activeTicketTitle || 'Zadanie',
                time: elapsedSeconds
            };
            setPausedTicket(pauseState);
            if (typeof window !== 'undefined') {
                localStorage.setItem('gk_paused_timer', JSON.stringify(pauseState));
            }

            setActiveTicketId(null);
            setActiveTicketTitle(null);
            setStartTime(null);
        } catch (e) {
            console.error(e);
        }
    };

    const resumeTimer = async () => {
        if (pausedTicket) {
            await startTimer(pausedTicket.id);
        }
    };

    return (
        <TimerContext.Provider value={{
            activeTicketId,
            activeTicketTitle,
            elapsedSeconds,
            startTimer,
            stopTimer,
            pauseTimer,
            resumeTimer,
            pausedTicket,
            isActive: !!activeTicketId,
            isMinimized,
            setIsMinimized
        }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) throw new Error("useTimer must be used within TimerProvider");
    return context;
};
