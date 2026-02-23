import { Resend } from 'resend';

/**
 * Lazy-initialized Resend client.
 * Doesn't throw during build/SSR when RESEND_API_KEY is absent.
 */
let _resend: Resend | null = null;

export function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

/** @deprecated Use getResend() for safe lazy initialization */
export const resend = {
    emails: {
        send: async (...args: Parameters<Resend['emails']['send']>) => {
            const client = getResend();
            if (!client) {
                console.warn('[EMAIL] RESEND_API_KEY not set. Email sending skipped.');
                return { data: null, error: { message: 'RESEND_API_KEY not configured', name: 'missing_api_key' } };
            }
            return client.emails.send(...args);
        }
    }
};

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'GK Portal <noreply@gk-digital.pl>';
