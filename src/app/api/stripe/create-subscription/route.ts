import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseServer';

// Set Stripe API version to match legacy if possible, or at least be explicit
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const { planId, userId, interval = 'month', upsell = 'false', formData } = json;
        const email = json.email || formData?.email;
        const companyName = json.companyName || formData?.company;

        console.log('[STRIPE DEBUG] Received:', { planId, email, userId, companyName, interval, upsell, hasFormData: !!formData });

        if (!userId || !email) {
            return NextResponse.json({ error: 'Brak danych użytkownika w żądaniu.' }, { status: 400 });
        }

        // 1. Resolve Price ID
        const priceMap: Record<string, any> = {
            'STARTER': {
                'month': 'price_1T2uHHJQcFY2PeiPuSLNImIK', // default monthly
                'year': 'price_1T2uHyJQcFY2PeiPwwGZXuwy', // provided by user
            },
            'PROFESSIONAL': { // Formerly STANDARD
                'month': 'price_1T2uJKJQcFY2PeiPqdpnw4tg', // default monthly
                'year': 'price_1T2uLiJQcFY2PeiPgm1TBJeX', // provided by user
            },
            'EXPERT': { // Formerly AGENCY
                'month': 'price_1T2uMFJQcFY2PeiPEcCqha2w', // default monthly
                'year': 'price_1T2uQbJQcFY2PeiPUzsizjpF', // provided by user
            },
            // Discounted Upsell Prices
            'UPSELL_PROFESSIONAL': {
                'month': 'price_1T2uJKJQcFY2PeiPqdpnw4tg_discount', // replace with actual discounted price ID
                'year': 'price_1T2uJKJQcFY2PeiPqdpnw4tg_discount', // replace with actual discounted price ID
            },
            'UPSELL_EXPERT': {
                'month': 'price_1T2uMFJQcFY2PeiPEcCqha2w_discount', // replace with actual discounted price ID
                'year': 'price_1T2uMFJQcFY2PeiPEcCqha2w_discount', // replace with actual discounted price ID
            }
        };

        const planKey = upsell === 'true' ? `UPSELL_${planId.toUpperCase()}` : planId.toUpperCase();

        let priceId = priceMap['STARTER']['month'];
        if (priceMap[planKey] && priceMap[planKey][interval]) {
            priceId = priceMap[planKey][interval];
        }

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

        // 2b. Update Customer with Billing Details (name, address, tax_id) from form
        if (formData) {
            console.log('[STRIPE DEBUG] Updating Customer with billing details from formData...');
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const displayName = formData.company ? formData.company : fullName;

            const addressParams = {
                line1: formData.address,
                city: formData.city,
                postal_code: formData.zip,
                country: 'PL' // Hardcoded to PL based on UI
            };

            await stripe.customers.update(customer.id, {
                name: displayName,
                address: addressParams,
                invoice_settings: {
                    custom_fields: formData.nip ? [{ name: 'NIP', value: formData.nip }] : []
                }
            });

            if (formData.nip) {
                // Wipe any existing eu_vat tax IDs to avoid duplicates for the same customer
                try {
                    const existingTaxIds = await stripe.customers.listTaxIds(customer.id);
                    for (const t of existingTaxIds.data) {
                        if (t.type === 'eu_vat') {
                            await stripe.customers.deleteTaxId(customer.id, t.id);
                        }
                    }

                    // Add the new NIP. Format must be Country Code + Number (e.g. PL1234567890)
                    const cleanNip = formData.nip.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    const nipValue = cleanNip.startsWith('PL') ? cleanNip : `PL${cleanNip}`;

                    await stripe.customers.createTaxId(customer.id, {
                        type: 'eu_vat',
                        value: nipValue,
                    });
                    console.log('[STRIPE DEBUG] Successfully added Tax ID (NIP):', nipValue);
                } catch (taxErr: any) {
                    console.error('[STRIPE WARNING] Could not set Tax ID from NIP. Ignoring:', taxErr.message);
                }
            }
        }

        // 3. Find existing incomplete subscription
        console.log('[STRIPE DEBUG] Checking for existing incomplete subscriptions...');
        const existingSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'incomplete',
            expand: ['data.latest_invoice.payment_intent']
        });

        let subscription;

        // Look for an exact match on Price ID
        const matchingSub = existingSubscriptions.data.find(sub =>
            sub.items.data.some(item => item.price.id === priceId)
        );

        if (matchingSub && matchingSub.latest_invoice) {
            console.log('[STRIPE DEBUG] Found existing incomplete subscription:', matchingSub.id);
            // Check if the invoice is still open and payment intent is active
            const invoice = matchingSub.latest_invoice as any;
            if (invoice.status === 'open' && invoice.payment_intent && invoice.payment_intent.status !== 'canceled') {
                subscription = matchingSub;
            } else {
                console.log('[STRIPE DEBUG] Existing subscription invoice/payment_intent is invalid or canceled. Canceling old sub and creating new one.');
                await stripe.subscriptions.cancel(matchingSub.id);
            }
        }

        if (!subscription) {
            console.log('[STRIPE DEBUG] Creating new subscription...');
            subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: { userId, planId, companyName: companyName || '' }
            });
        }

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
