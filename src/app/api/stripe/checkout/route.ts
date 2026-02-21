import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-11' as any,
});

const PRICE_MAP: Record<string, string> = {
    'STARTER': 'price_1T0KsDJQcFY2PeiP4hMVVXYa',
    'STANDARD': 'price_1T0KsvJQcFY2PeiPZ6qPTWyO',
    'AGENCY': 'price_1T0KtIJQcFY2PeiPZzKgAamL',
};

export async function POST(req: Request) {
    try {
        const { planId, organizationId, userEmail } = await req.json();

        const priceId = PRICE_MAP[planId];
        if (!priceId) {
            return NextResponse.json({ error: 'Nieprawidłowy plan' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${req.headers.get('origin')}/dashboard?status=success`,
            cancel_url: `${req.headers.get('origin')}/select-plan?status=cancel`,
            customer_email: userEmail,
            metadata: {
                organization_id: organizationId,
                plan_id: planId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout error:', error);
        return NextResponse.json({ error: 'Błąd płatności' }, { status: 500 });
    }
}
