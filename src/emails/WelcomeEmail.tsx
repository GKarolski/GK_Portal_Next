import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Button,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
    recipientName: string;
    planName: string;
    storageLimitLabel: string;
    tokenLimitLabel: string;
    portalUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
    recipientName = 'Użytkownik',
    planName = 'Standard',
    storageLimitLabel = '5 GB',
    tokenLimitLabel = '500k',
    portalUrl = 'https://gk-digital.pl/dashboard',
}) => {
    const previewText = `Plan zaktualizowany — ${planName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={headerTitle}>Plan Zaktualizowany!</Heading>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Text style={paragraph}>
                            Cześć <strong>{recipientName}</strong>,
                        </Text>
                        <Text style={paragraph}>
                            Twój plan w systemie GK Portal SaaS został pomyślnie
                            zaktualizowany do subskrypcji:{' '}
                            <strong>{planName}</strong>.
                        </Text>

                        {/* Stats Box */}
                        <Section style={statsBox}>
                            <Text style={statsTitle}>
                                <strong>Twoje nowe limity:</strong>
                            </Text>
                            <Text style={statsItem}>
                                • Miejsce na dysku: <strong>{storageLimitLabel}</strong>
                            </Text>
                            <Text style={statsItem}>
                                • Miesięczny limit tokenów AI:{' '}
                                <strong>{tokenLimitLabel}</strong>
                            </Text>
                        </Section>

                        <Text style={paragraph}>
                            Wszystkie nowe funkcje i limity są już dostępne na Twoim
                            koncie.
                        </Text>

                        <Section style={btnContainer}>
                            <Button style={button} href={portalUrl}>
                                PRZEJDŹ DO PORTALU
                            </Button>
                        </Section>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            &copy; {new Date().getFullYear()} GK Digital SaaS. Ten e-mail
                            został wysłany automatycznie.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeEmail;

// --- Styles ---
const main: React.CSSProperties = {
    backgroundColor: '#f4f4f9',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
    lineHeight: '1.6',
};

const container: React.CSSProperties = {
    maxWidth: '600px',
    margin: '20px auto',
    border: '1px solid #eee',
    borderRadius: '10px',
    overflow: 'hidden',
};

const header: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '20px',
    textAlign: 'center' as const,
};

const headerTitle: React.CSSProperties = {
    color: 'white',
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
};

const content: React.CSSProperties = {
    padding: '30px',
};

const paragraph: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333',
    margin: '12px 0',
};

const statsBox: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    padding: '15px',
    borderRadius: '5px',
    margin: '20px 0',
};

const statsTitle: React.CSSProperties = {
    fontSize: '14px',
    margin: '0 0 8px',
};

const statsItem: React.CSSProperties = {
    fontSize: '14px',
    margin: '4px 0',
    color: '#333',
};

const btnContainer: React.CSSProperties = {
    textAlign: 'center' as const,
    marginTop: '30px',
};

const button: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 25px',
    backgroundColor: '#3b82f6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
};

const footer: React.CSSProperties = {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
    fontSize: '12px',
    color: '#777',
    margin: 0,
};
