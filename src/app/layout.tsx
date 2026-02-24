import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/contexts/AuthContext';
import { CombinedProviders } from '@/components/providers/CombinedProviders';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GK Portal | Modern SaaS Platform",
  description: "Elite enterprise management platform rebuild.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={cn(inter.className, "bg-[#050505] text-[#f5f5f5] min-h-screen antialiased")}>
        <AuthProvider>
          <CombinedProviders>
            {children}
          </CombinedProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
