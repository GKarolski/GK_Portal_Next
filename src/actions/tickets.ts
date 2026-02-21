"use server";

import { supabaseAdmin } from '@/lib/supabaseServer';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, DeviceType, MarketingPlatform } from '@/types';
import { revalidatePath } from 'next/cache';

interface CreateTicketParams {
    userId: string;
    organizationId: string;
    clientName: string;
    subject: string;
    category: TicketCategory;
    description: string;
    priority?: TicketPriority;
    url?: string;
    deviceType?: DeviceType;
    platform?: MarketingPlatform;
    budget?: string;
    attachments?: any[];
}

export async function createTicket(params: CreateTicketParams) {
    const {
        userId,
        organizationId,
        clientName,
        subject,
        category,
        description,
        priority = TicketPriority.NORMAL,
        url = '',
        deviceType = DeviceType.ALL,
        platform = MarketingPlatform.OTHER,
        budget = '',
        attachments = []
    } = params;

    try {
        // 1. Smart Folder Automation Logic
        let folderId: string | null = null;

        // Fetch organization folders and their rules
        const { data: folders } = await supabaseAdmin
            .from('folders')
            .select('*')
            .eq('organization_id', organizationId);

        if (folders) {
            for (const folder of folders) {
                const rules = folder.automation_rules || [];
                for (const rule of rules) {
                    let match = false;
                    switch (rule.type) {
                        case 'FROM_USER':
                            if (userId === rule.value) match = true;
                            break;
                        case 'KEYWORD':
                            if (subject.toLowerCase().includes(rule.value.toLowerCase()) ||
                                description.toLowerCase().includes(rule.value.toLowerCase())) {
                                match = true;
                            }
                            break;
                        case 'CATEGORY':
                            if (category === rule.value) match = true;
                            break;
                    }
                    if (match) {
                        folderId = folder.id;
                        break;
                    }
                }
                if (folderId) break;
            }
        }

        // 2. Insert Ticket
        const { data, error } = await supabaseAdmin
            .from('tickets')
            .insert({
                client_id: userId,
                client_name: clientName,
                organization_id: organizationId,
                created_by_user_id: userId,
                subject,
                category,
                description,
                status: TicketStatus.PENDING,
                priority,
                url,
                device_type: deviceType,
                platform,
                budget,
                folder_id: folderId,
                attachments_json: attachments,
                billing_month: new Date().toISOString().slice(0, 7),
                admin_start_date: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Revalidate dashboard path
        revalidatePath('/dashboard');

        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating ticket:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
    try {
        const { error } = await supabaseAdmin
            .from('tickets')
            .update({ status })
            .eq('id', ticketId);

        if (error) throw error;

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating ticket status:', error);
        return { success: false, error: error.message };
    }
}
