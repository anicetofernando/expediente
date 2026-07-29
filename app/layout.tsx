import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sistema de Gestão de Expediente | CFM",
    template: "%s | Sistema de Gestão de Expediente",
  },
  description: "Sistema Digital de Gestão de Expediente da CFM — Portos e Caminhos de Ferro de Moçambique.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-MZ" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
