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

    const fetchUserProfile = async (session: Session) => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('[AUTH] Error fetching profile:', error);
            // Fallback to metadata if profile fetch fails
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
            console.log('[AUTH] Profile fetched successfully:', profile.role);
            setUser({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                isActive: profile.is_active,
                companyName: profile.company_name,
                organizationId: profile.organization_id,
                roleInOrg: profile.role_in_org,
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchUserProfile(session);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('[AUTH] State change:', _event);
            setSession(session);
            if (session?.user) {
                fetchUserProfile(session);
            } else {
                setUser(null);
                setIsLoading(false);
            }
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
