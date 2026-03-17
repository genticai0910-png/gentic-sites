import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Analytics from "@/components/Analytics";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Gentic AI | AI Automation Systems for RE & Local Business",
  description:
    "AI systems that scale your business. Voice agents, lead scoring, and full automation pipelines. Book a free audit.",
  metadataBase: new URL("https://genticai.pro"),
  openGraph: {
    title: "Gentic AI | AI Automation Systems",
    description:
      "Voice agents, lead scoring, and automation pipelines that run while you sleep.",
    url: "https://genticai.pro",
    siteName: "Gentic AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gentic AI | AI Automation Systems",
    description:
      "Voice agents, lead scoring, and automation pipelines that run while you sleep.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${jakarta.variable} ${jetbrains.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
