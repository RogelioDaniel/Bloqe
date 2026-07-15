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
  title: "BLOQE — Constructora Modular | Construimos con bloques",
  description:
    "BLOQE es una constructora premium que transforma imágenes de obras en modelos 3D de bloques modulares. Diseñamos, modelamos y construimos con precisión de ingeniería y estética de ensamblaje.",
  keywords: [
    "constructora",
    "construcción modular",
    "bloques 3D",
    "modelado 3D",
    "arquitectura",
    "BLOQE",
    "obra",
    "ingeniería",
  ],
  authors: [{ name: "BLOQE Constructora Modular" }],
  openGraph: {
    title: "BLOQE — Constructora Modular",
    description:
      "Transformamos imágenes de obras en modelos 3D de bloques modulares y los construimos.",
    siteName: "BLOQE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BLOQE — Constructora Modular",
    description:
      "Transformamos imágenes de obras en modelos 3D de bloques modulares y los construimos.",
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
