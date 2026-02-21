import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GK Portal | Modern SaaS Platform",
  description: "Elite enterprise management platform rebuild.",
};

import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark">
      <body className={cn(inter.className, "bg-gk-950 text-slate-100 min-h-screen selection:bg-accent-red/30")}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
