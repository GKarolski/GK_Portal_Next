"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                // Map Supabase user to our App User type
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Użytkownik',
                    email: session.user.email || '',
                    role: session.user.user_metadata.role || 'CLIENT',
                    isActive: true,
                    companyName: session.user.user_metadata.company_name,
                    organizationId: session.user.user_metadata.organization_id,
                });
            }
            setIsLoading(false);
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Użytkownik',
                    email: session.user.email || '',
                    role: session.user.user_metadata.role || 'CLIENT',
                    isActive: true,
                    companyName: session.user.user_metadata.company_name,
                    organizationId: session.user.user_metadata.organization_id,
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
