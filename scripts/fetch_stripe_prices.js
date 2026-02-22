const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const secretKeyMatch = envContent.match(/STRIPE_SECRET_KEY=([^\s]+)/);

if (!secretKeyMatch) {
    console.error('STRIPE_SECRET_KEY not found in .env.local');
    process.exit(1);
}

const stripe = new Stripe(secretKeyMatch[1]);

async function fetchPrices() {
    try {
        const prices = await stripe.prices.list({
            active: true,
            expand: ['data.product'],
        });

        let output = '--- ACTIVE STRIPE PRICES ---\n';
        prices.data.forEach(p => {
            output += `Plan: ${p.product.name} | Price ID: ${p.id} | Amount: ${p.unit_amount / 100} ${p.currency.toUpperCase()}\n`;
        });
        output += '---------------------------';
        fs.writeFileSync(path.join(process.cwd(), 'scripts/stripe_prices.txt'), output);
        console.log('Saved to scripts/stripe_prices.txt');
    } catch (error) {
        console.error('Error fetching prices:', error.message);
    }
}

fetchPrices();
