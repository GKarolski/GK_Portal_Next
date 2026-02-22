const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const secretKeyMatch = envContent.match(/STRIPE_SECRET_KEY=([^\s]+)/);
const stripe = new Stripe(secretKeyMatch[1]);

async function exhaustiveFetch() {
    try {
        const prices = await stripe.prices.list({
            limit: 100,
            expand: ['data.product'],
        });

        let output = '--- ALL STRIPE PRICES (LIMIT 100) ---\n';
        prices.data.forEach(p => {
            output += `ID: ${p.id} | Amount: ${p.unit_amount / 100} ${p.currency.toUpperCase()} | Name: ${p.product.name} | Active: ${p.active} | ProdActive: ${p.product.active}\n`;
        });

        fs.writeFileSync(path.join(process.cwd(), 'scripts/all_stripe_prices.txt'), output);
        console.log('Saved to scripts/all_stripe_prices.txt');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

exhaustiveFetch();
