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

interface InvitationEmailProps {
    recipientName: string;
    companyName: string;
    inviteUrl: string;
    isNewOrg?: boolean;
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
    recipientName = 'Użytkownik',
    companyName = 'Twoja Firma',
    inviteUrl = 'https://gk-digital.pl/login',
    isNewOrg = true,
}) => {
    const previewText = `Zaproszenie do GK Portal — ${companyName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>
                            GK_<span style={logoAccent}>Portal</span>
                        </Text>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Text style={paragraph}>
                            Cześć <strong>{recipientName}</strong>,
                        </Text>

                        {isNewOrg ? (
                            <Text style={paragraph}>
                                Zostałeś zaproszony do współpracy w ramach organizacji{' '}
                                <strong>{companyName}</strong> na platformie GK Portal.
                                Kliknij poniższy przycisk, aby aktywować swoje konto i
                                rozpocząć pracę.
                            </Text>
                        ) : (
                            <Text style={paragraph}>
                                Zostałeś dodany jako pracownik do organizacji{' '}
                                <strong>{companyName}</strong> na platformie GK Portal.
                                Kliknij poniższy przycisk, aby ustawić hasło i uzyskać
                                dostęp do panelu.
                            </Text>
                        )}

                        <Section style={btnContainer}>
                            <Button style={button} href={inviteUrl}>
                                AKTYWUJ KONTO
                            </Button>
                        </Section>

                        <Text style={smallText}>
                            Jeśli przycisk nie działa, skopiuj ten link:{' '}
                            <Link href={inviteUrl} style={link}>
                                {inviteUrl}
                            </Link>
                        </Text>
                    </Section>

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            &copy; {new Date().getFullYear()} GK Digital. Wszystkie prawa
                            zastrzeżone.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default InvitationEmail;

// --- Styles ---
const main: React.CSSProperties = {
    backgroundColor: '#f4f4f9',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    margin: 0,
    padding: '20px',
};

const container: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const header: React.CSSProperties = {
    textAlign: 'center' as const,
    borderBottom: '2px solid #ef4444',
    paddingBottom: '20px',
    marginBottom: '20px',
};

const logo: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
};

const logoAccent: React.CSSProperties = {
    color: '#ef4444',
};

const content: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '1.6',
};

const paragraph: React.CSSProperties = {
    color: '#333333',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '16px 0',
};

const btnContainer: React.CSSProperties = {
    textAlign: 'center' as const,
    margin: '24px 0',
};

const button: React.CSSProperties = {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '12px 24px',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    display: 'inline-block',
};

const smallText: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
};

const link: React.CSSProperties = {
    color: '#ef4444',
    wordBreak: 'break-all' as const,
};

const hr: React.CSSProperties = {
    borderColor: '#e2e8f0',
    margin: '24px 0 16px',
};

const footer: React.CSSProperties = {
    textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
};
