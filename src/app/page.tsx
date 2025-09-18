import LandingPage from '@/components/LandingPage'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Image Generator | Create Art with Monet-AI",
  description: "Generate stunning AI images for free. Transform text to art with advanced AI technology. No signup required for basic features.",
  keywords: "free AI image generator, text to image AI, create AI art, artificial intelligence art, digital art generator, AI artwork, free image creation",
  openGraph: {
    title: "Free AI Image Generator | Create Art with Monet-AI",
    description: "Generate stunning AI images for free. Transform text to art with advanced AI technology.",
    url: "https://www.monet-ai.top",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Image Generator | Create Art with Monet-AI",
    description: "Generate stunning AI images for free. Transform text to art with advanced AI technology.",
  },
  alternates: {
    canonical: "https://www.monet-ai.top",
  },
};

export default function Home() {
  return <LandingPage />
}