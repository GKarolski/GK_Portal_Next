const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const secretKeyMatch = envContent.match(/STRIPE_SECRET_KEY=([^\s]+)/);

if (!secretKeyMatch) {
    console.error('STRIPE_SECRET_KEY not found in .env.local');
    process.exit(1);
}

const stripe = new Stripe(secretKeyMatch[1]);

async function fetchPriceDetails() {
    try {
        const prices = await stripe.prices.list({
            active: true,
            expand: ['data.product'],
        });

        let output = '--- DETAILED STRIPE PRICES ---\n';
        prices.data.forEach(p => {
            output += `Plan: ${p.product.name} | Price ID: ${p.id} | Amount: ${p.unit_amount / 100} ${p.currency.toUpperCase()}\n`;
            output += `  Interval: ${p.recurring?.interval} | Trial Days: ${p.recurring?.trial_period_days || 0}\n`;
            output += `  Product ID: ${p.product.id} | Active: ${p.active}\n`;
            output += `---------------------------\n`;
        });

        fs.writeFileSync(path.join(process.cwd(), 'scripts/stripe_price_details.txt'), output);
        console.log('Saved to scripts/stripe_price_details.txt');
    } catch (error) {
        console.error('Error fetching prices:', error.message);
    }
}

fetchPriceDetails();
