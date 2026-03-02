import { PlayCircle, Bot, Check, LucideIcon } from "lucide-react";

export interface PlanFeature {
    icon: LucideIcon;
    text: string;
    highlight?: boolean;
    purple?: boolean;
}

export interface PricingPlan {
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    desc: string;
    features: PlanFeature[];
    cta: string;
    href: string;
    featured: boolean;
    badge?: string;
}

export const pricingPlans: Record<string, PricingPlan> = {
    STARTER: {
        id: "STARTER",
        name: "Starter",
        monthlyPrice: 149,
        yearlyPrice: 107,
        desc: "Na smak i wejście w uporządkowaną pracę z mniejszą bazą klientów.",
        features: [
            { icon: PlayCircle, text: "Webinar onboardingowy (migracja z excela)", highlight: true },
            { icon: Bot, text: "Podstawowy Asystent AI (mały limit zapytań)", purple: true },
            { icon: Check, text: "1 Użytkownik (Właściciel)" },
            { icon: Check, text: "15 Aktywnych Klientów" },
            { icon: Check, text: "5 GB Sejf Cyfrowy na pliki" },
        ],
        cta: "Zacznij od Startera",
        href: "/register?plan=STARTER",
        featured: false,
    },
    PROFESSIONAL: {
        id: "PROFESSIONAL",
        name: "Professional",
        monthlyPrice: 249,
        yearlyPrice: 207,
        desc: "Pełen pakiet produktywności dla skalujących się solistów i teamów.",
        features: [
            { icon: PlayCircle, text: "Webinar onboardingowy (szybka migracja)", highlight: true },
            { icon: Bot, text: "Nielimitowany AI Asystent czytający duże załączniki do zgłoszeń.", purple: true },
            { icon: Check, text: "6 Użytkowników z uprawnieniami" },
            { icon: Check, text: "Nielimitowani Klienci na platformie" },
            { icon: Check, text: "25 GB Sejf Cyfrowy" },
            { icon: Check, text: "Role dla pracowników" },
        ],
        cta: "Wybieram Professional",
        href: "/register?plan=PROFESSIONAL",
        featured: true,
        badge: "Najczęściej Wybierany",
    },
    EXPERT: {
        id: "EXPERT",
        name: "Expert",
        monthlyPrice: 599,
        yearlyPrice: 499,
        desc: "Dla pracowni z dużym przepływem potężnych plików.",
        features: [
            { icon: PlayCircle, text: "Webinar + 1h Custom Konsultacji IT z inżynierem", highlight: true },
            { icon: Bot, text: "Customowe modele AI trenowane na Twoich starych zleceniach.", purple: true },
            { icon: Check, text: "Nielimitowani Pracownicy" },
            { icon: Check, text: "100 GB Super Szybkiego Dysku" },
            { icon: Check, text: "Priorytetowy Support 24/7 na WhatsApp" },
        ],
        cta: "Wybierz Expert",
        href: "/register?plan=EXPERT",
        featured: false,
    },
};
