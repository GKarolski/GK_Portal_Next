"use server";

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function provisionInstance(userId: string, companyName: string, plan: string) {
    try {
        // 1. Create Organization
        const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: companyName,
                vip_status: plan === 'AGENCY' ? 'VIP' : 'STANDARD'
            })
            .select()
            .single();

        if (orgError) throw orgError;

        // 2. Update Profile (Connect to Org and ensure ADMIN role)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                organization_id: org.id,
                role: 'ADMIN',
                role_in_org: 'OWNER',
                is_active: true
            })
            .eq('id', userId);

        if (profileError) throw profileError;

        // 3. Create Default Folders
        const defaultFolders = [
            { name: 'Główne', organization_id: org.id, icon: 'Layout' },
            { name: 'Archiwum', organization_id: org.id, icon: 'Archive' },
            { name: 'Krytyczne', organization_id: org.id, icon: 'AlertTriangle', color: '#ef4444' }
        ];

        const { error: folderError } = await supabaseAdmin
            .from('folders')
            .insert(defaultFolders);

        if (folderError) throw folderError;

        return { success: true, orgId: org.id };
    } catch (error) {
        console.error('Provisioning failed:', error);
        return { success: false, error };
    }
}
