import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { planId, email } = await req.json();

        const priceMap: Record<string, string> = {
            'STARTER': 'price_1T0KsDJQcFY2PeiP4hMVVXYa',
            'STANDARD': 'price_1T0KsvJQcFY2PeiPZ6qPTWyO',
            'AGENCY': 'price_1T0KtIJQcFY2PeiPZzKgAamL'
        };

        const priceId = priceMap[planId.toUpperCase()] || priceMap.STARTER;

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
