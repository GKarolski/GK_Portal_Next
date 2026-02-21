"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Ticket, TicketStatus } from '@/types';

export function useTickets(organizationId?: string) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTickets = async () => {
        if (!organizationId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedTickets = (data || []).map((t: any) => ({
                ...t,
                clientId: t.client_id,
                clientName: t.client_name,
                // Add other mappings if necessary, or use a helper
            })) as Ticket[];

            setTickets(mappedTickets);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [organizationId]);

    const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status })
                .eq('id', ticketId);

            if (error) throw error;
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
        } catch (err) {
            console.error('Failed to update ticket status', err);
        }
    };

    return { tickets, isLoading, error, fetchTickets, updateTicketStatus };
}
