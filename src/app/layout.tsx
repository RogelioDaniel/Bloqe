import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BLOQE — Constructora | Construimos tu obra bloque a bloque",
  description:
    "BLOQE es una constructora: casas, locales, remodelaciones y obra comercial. Cada proyecto se presenta como una maqueta de bloques antes de construirse — ves tu obra pieza por pieza, con presupuesto cerrado y garantía de 10 años.",
  keywords: [
    "constructora",
    "construcción",
    "obra nueva",
    "remodelación",
    "diseño arquitectónico",
    "arquitectura",
    "BLOQE",
    "obra",
    "CDMX",
  ],
  authors: [{ name: "BLOQE Constructora" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "BLOQE — Constructora",
    description:
      "Construimos tu obra bloque a bloque: diseño, presupuesto cerrado y garantía de 10 años.",
    siteName: "BLOQE",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "BLOQE — Constructora" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BLOQE — Constructora",
    description:
      "Construimos tu obra bloque a bloque: diseño, presupuesto cerrado y garantía de 10 años.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
