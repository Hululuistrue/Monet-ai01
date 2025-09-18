import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Plans | Unlimited AI Image Generation - Monet-AI",
  description: "Upgrade to premium for unlimited AI image generation, high-resolution downloads, priority processing, and exclusive features. Affordable pricing plans.",
  keywords: "AI generator premium plans, unlimited AI images, subscription pricing, high-resolution AI art, premium AI features, professional AI tools",
  openGraph: {
    title: "Premium Plans | Unlimited AI Image Generation - Monet-AI",
    description: "Upgrade to premium for unlimited AI image generation, high-resolution downloads, priority processing, and exclusive features.",
    url: "https://www.monet-ai.top/subscription",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Plans | Unlimited AI Image Generation - Monet-AI",
    description: "Upgrade to premium for unlimited AI image generation, high-resolution downloads, priority processing, and exclusive features.",
  },
  alternates: {
    canonical: "https://www.monet-ai.top/subscription",
  },
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}