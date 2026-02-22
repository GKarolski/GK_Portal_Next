import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(req: Request) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return new Response('Missing Stripe Secret', { status: 500 });
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`[STRIPE WEBHOOK] Handling event: ${event.type}`);

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleProvisioning(
                session.metadata?.userId || session.client_reference_id,
                session.metadata?.plan_id,
                session.metadata?.companyName,
                session.customer as string,
                session.subscription as string
            );
        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice;
            // Only handle first payment for subscription
            if (invoice.billing_reason === 'subscription_create') {
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                await handleProvisioning(
                    subscription.metadata?.userId,
                    subscription.metadata?.plan_id,
                    subscription.metadata?.companyName,
                    subscription.customer as string,
                    subscription.id
                );
            }
        }
    } catch (err: any) {
        console.error(`[STRIPE WEBHOOK ERROR]: ${err.message}`);
        return new Response(`Provisioning Error: ${err.message}`, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

async function handleProvisioning(
    userId: string | undefined,
    planId: string | undefined,
    companyName: string | undefined,
    stripeCustomerId: string,
    stripeSubscriptionId: string
) {
    if (!userId) {
        console.error('[STRIPE WEBHOOK] Missing userId in metadata');
        return;
    }

    console.log(`[STRIPE WEBHOOK] Provisioning for User: ${userId}, Plan: ${planId}, Company: ${companyName}`);

    // 1. Create Organization
    const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
            name: companyName || 'Moja Organizacja',
            vip_status: planId === 'AGENCY' ? 'VIP' : 'STANDARD',
        })
        .select()
        .single();

    if (orgError) throw orgError;

    // 2. Update Profile to active and link to Organization
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            organization_id: org.id,
            is_active: true,
            role: 'ADMIN' // Full owner of the instance
        })
        .eq('id', userId);

    if (profileError) throw profileError;

    // 3. Update Auth Metadata (for AuthContext/Frontend)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
            user_metadata: {
                organization_id: org.id,
                role: 'ADMIN'
            }
        }
    );

    if (authError) throw authError;

    console.log(`[STRIPE WEBHOOK] SUCCESS: Organization ${org.id} activated for User ${userId}`);
}
