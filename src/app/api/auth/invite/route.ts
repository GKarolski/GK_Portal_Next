import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authorization
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        // Use a temporary client to verify the user token
        const authClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: authError } = await authClient.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Nieprawidłowa sesja' }, { status: 401 });
        }

        // 2. Check Admin Role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
        }

        // 3. Process Invitation
        const body = await req.json();
        const { name, email, company, orgId, details } = body;

        if (!email || !company || !name) {
            return NextResponse.json({ error: 'Brak wymaganych danych (email, firma, nazwa)' }, { status: 400 });
        }

        let targetOrgId = orgId;

        // Create new organization if none provided
        if (!targetOrgId) {
            const { data: newOrg, error: orgError } = await supabaseAdmin
                .from('organizations')
                .insert({ name: company })
                .select()
                .single();

            if (orgError) {
                console.error('Org Creation Error:', orgError);
                return NextResponse.json({ error: 'Błąd podczas tworzenia organizacji' }, { status: 500 });
            }
            targetOrgId = newOrg.id;
        }

        // 4. Invite User with Metadata
        // The handle_new_user trigger in supabase_setup.sql will pick up this metadata
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                name: name,
                company_name: company,
                organization_id: targetOrgId,
                role: 'CLIENT',
                phone: details?.phone,
                nip: details?.nip,
                website: details?.website,
                admin_notes: details?.adminNotes,
                avatar_url: details?.avatar,
                role_in_org: orgId ? 'MEMBER' : 'OWNER'
            },
            // Redirect back to the portal
            redirectTo: `${new URL(req.url).origin}/login`
        });

        if (inviteError) {
            console.error('Invite Error:', inviteError);
            return NextResponse.json({ error: inviteError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            orgId: targetOrgId,
            userId: inviteData.user.id
        });

    } catch (error: any) {
        console.error('Server Internal Error:', error);
        return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
    }
}
