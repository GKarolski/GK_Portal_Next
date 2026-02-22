import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { planId, email, userId } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Brak danych użytkownika' }, { status: 400 });
        }

        // 1. Resolve Price ID
        const priceMap: Record<string, string> = {
            'STARTER': 'price_1T2uHHJQcFY2PeiPuSLNImIK',
            'STANDARD': 'price_1T2uJKJQcFY2PeiPqdpnw4tg',
            'AGENCY': 'price_1T2uMFJQcFY2PeiPEcCqha2w'
        };

        const priceId = priceMap[planId.toUpperCase()] || priceMap.STANDARD;

        // 2. Create/Retrieve Stripe Customer
        // First check if profile already has a customer_id (assuming we add this column or use metadata)
        // For now, let's just search by email or create new as in legacy
        let customer;
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
            customer = customers.data[0];
        } else {
            customer = await stripe.customers.create({
                email,
                metadata: { userId }
            });
        }

        // 3. Create Subscription
        console.log('Creating subscription for customer:', customer.id, 'with price:', priceId);
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId,
                planId
            }
        });

        let invoice = subscription.latest_invoice as any;

        // Fallback: If not expanded, fetch manually
        if (typeof invoice === 'string') {
            console.log('Invoice not expanded, fetching manually:', invoice);
            invoice = await stripe.invoices.retrieve(invoice, {
                expand: ['payment_intent']
            });
        }

        const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

        if (!paymentIntent) {
            console.error('Subscription created but no PaymentIntent found. Status:', subscription.status, 'Invoice:', invoice?.id);
            throw new Error('Nie udało się wygenerować PaymentIntent. Sprawdź konfigurację Stripe (np. waluty lub nieaktywne ceny).');
        }

        console.log('Subscription created successfully:', subscription.id);
        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        });

    } catch (error: any) {
        console.error('Stripe Subscription Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
