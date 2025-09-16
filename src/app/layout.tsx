import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monet-AI Image Generator - Professional AI Art Creation",
  description: "Create stunning, high-quality images with AI using advanced Gemini technology. Professional AI image generator for artists, designers, and creators. Transform text to art instantly.",
  keywords: "AI image generator, text to image, artificial intelligence, digital art, image creation, Gemini AI, professional art tools",
  authors: [{ name: "Monet-AI Team" }],
  creator: "Monet-AI",
  publisher: "Monet-AI",
  robots: "index, follow",
  openGraph: {
    title: "Monet-AI Image Generator - Professional AI Art Creation",
    description: "Create stunning, high-quality images with AI using advanced Gemini technology. Professional AI image generator for artists, designers, and creators.",
    url: "https://www.monet-ai.top",
    siteName: "Monet-AI Image Generator",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monet-AI Image Generator - Professional AI Art Creation",
    description: "Create stunning, high-quality images with AI using advanced Gemini technology. Professional AI image generator for artists, designers, and creators.",
    creator: "@MonetAI",
  },
  alternates: {
    canonical: "https://www.monet-ai.top",
  },
  verification: {
    google: "google-site-verification-placeholder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://*.supabase.co https://js.stripe.com" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
