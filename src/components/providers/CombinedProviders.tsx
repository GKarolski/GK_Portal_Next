"use client";

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerProvider } from '@/contexts/TimerContext';

interface CombinedProvidersProps {
    children: ReactNode;
}

export const CombinedProviders: React.FC<CombinedProvidersProps> = ({ children }) => {
    const { user } = useAuth();

    return (
        <TimerProvider user={user}>
            {children}
        </TimerProvider>
    );
};
