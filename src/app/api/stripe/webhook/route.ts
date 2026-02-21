import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-02-11' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(req: Request) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return new Response('Missing Stripe Secret', { status: 500 });
    }

    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const orgId = session.metadata?.organization_id;
    const planId = session.metadata?.plan_id;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (!orgId) return;

    // Update Organization and Limits in Supabase
    const { error } = await supabaseAdmin
        .from('organizations')
        .update({
            vip_status: planId === 'AGENCY' ? 'VIP' : 'STANDARD',
        })
        .eq('id', orgId);

    // Update Profile to active
    await supabaseAdmin
        .from('profiles')
        .update({ is_active: true })
        .eq('organization_id', orgId);

    console.log(`Organization ${orgId} activated on plan ${planId}`);
}
