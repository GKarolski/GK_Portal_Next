import { OnboardingLayoutClient } from './OnboardingLayoutClient';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <OnboardingLayoutClient>
            {children}
        </OnboardingLayoutClient>
    );
}
