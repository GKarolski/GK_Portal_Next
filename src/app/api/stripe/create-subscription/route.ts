import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseServer';

// Set Stripe API version to match legacy if possible, or at least be explicit
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
    try {
        const { planId, email, userId, companyName } = await req.json();
        console.log('[STRIPE DEBUG] Received:', { planId, email, userId, companyName });

        if (!userId || !email) {
            return NextResponse.json({ error: 'Brak danych użytkownika w żądaniu.' }, { status: 400 });
        }

        // 1. Resolve Price ID
        const priceMap: Record<string, string> = {
            'STARTER': 'price_1T2uHHJQcFY2PeiPuSLNImIK',
            'STANDARD': 'price_1T2uJKJQcFY2PeiPqdpnw4tg',
            'AGENCY': 'price_1T2uMFJQcFY2PeiPEcCqha2w'
        };

        const priceId = priceMap[planId.toUpperCase()] || priceMap.STANDARD;
        console.log('[STRIPE DEBUG] Using priceId:', priceId);

        // 2. Create/Retrieve Stripe Customer
        let customer;
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
            customer = customers.data[0];
            console.log('[STRIPE DEBUG] Found existing customer:', customer.id);
        } else {
            console.log('[STRIPE DEBUG] Creating new customer for:', email);
            customer = await stripe.customers.create({
                email,
                metadata: { userId }
            });
        }

        // 3. Create Subscription
        console.log('[STRIPE DEBUG] Creating subscription...');
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: { userId, planId, companyName: companyName || '' }
        });

        console.log('[STRIPE DEBUG] Subscription status:', subscription.status);

        let invoice = subscription.latest_invoice as any;

        // Detailed check for PaymentIntent
        let paymentIntent: Stripe.PaymentIntent | null = null;

        if (invoice && typeof invoice === 'object') {
            console.log('[STRIPE DEBUG] Invoice amount_due:', invoice.amount_due);
            if (typeof invoice.payment_intent === 'object') {
                paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
            } else if (typeof invoice.payment_intent === 'string') {
                console.log('[STRIPE DEBUG] PaymentIntent is string ID, fetching object:', invoice.payment_intent);
                paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
            }
        }

        // If still nothing, try fetching the invoice manually as a last resort
        if (!paymentIntent && invoice) {
            const invoiceId = typeof invoice === 'string' ? invoice : invoice.id;
            console.log('[STRIPE DEBUG] Refetching invoice manually:', invoiceId);
            const refetchedInvoice = await stripe.invoices.retrieve(invoiceId, {
                expand: ['payment_intent']
            }) as any;
            if (typeof refetchedInvoice.payment_intent === 'object') {
                paymentIntent = refetchedInvoice.payment_intent as Stripe.PaymentIntent;
            }
        }

        if (!paymentIntent) {
            const debugInfo = {
                subStatus: subscription.status,
                invoiceId: typeof invoice === 'string' ? invoice : invoice?.id,
                amountDue: typeof invoice === 'object' ? invoice?.amount_due : 'unknown',
            };
            console.error('[STRIPE ERROR] Could not find PaymentIntent. Debug Info:', debugInfo);
            throw new Error(`Błąd konfiguracji Stripe: Subskrypcja utworzona, ale nie wygenerowano PaymentIntent (Kwota do zapłaty: ${debugInfo.amountDue}). Możliwe przyczyny: darmowy okres próbny, saldo klienta lub nieaktywna cena.`);
        }

        console.log('[STRIPE SUCCESS] PaymentIntent generated:', paymentIntent.id);
        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        });

    } catch (error: any) {
        console.error('[STRIPE CRITICAL ERROR]:', error);
        return NextResponse.json({
            error: error.message,
            code: error.code,
            decline_code: error.decline_code,
            debug: true,
            full_error: error // Include full error for debug
        }, { status: 500 });
    }
}
