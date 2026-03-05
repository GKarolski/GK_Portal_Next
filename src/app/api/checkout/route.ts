import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { planId, email, interval = 'month', upsell = 'false' } = await req.json();

        // Map containing Stripe price IDs for different plans, intervals, and promos
        const priceMap: Record<string, any> = {
            'STARTER': {
                'month': 'price_1T2uHHJQcFY2PeiPuSLNImIK', // default monthly
                'year': 'price_1T2uHyJQcFY2PeiPwwGZXuwy', // provided by user
            },
            'PROFESSIONAL': {
                'month': 'price_1T2uJKJQcFY2PeiPqdpnw4tg', // default monthly
                'year': 'price_1T2uLiJQcFY2PeiPgm1TBJeX', // provided by user
            },
            'EXPERT': {
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.get('origin')}/provisioning?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/checkout?plan=${planId}`,
            customer_email: email,
            metadata: {
                plan_id: planId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
