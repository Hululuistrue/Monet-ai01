import ImageGenerator from '@/components/ImageGenerator'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Image Generator Tool | Monet-AI Text to Image",
  description: "Professional AI image generation tool. Create high-quality artwork from text prompts using advanced AI technology. Multiple sizes available.",
  keywords: "AI image generator tool, text to image converter, AI art creator, professional image generation, custom AI artwork, digital art creation",
  openGraph: {
    title: "AI Image Generator Tool | Monet-AI Text to Image",
    description: "Professional AI image generation tool. Create high-quality artwork from text prompts using advanced AI technology.",
    url: "https://www.monet-ai.top/generate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Image Generator Tool | Monet-AI Text to Image",
    description: "Professional AI image generation tool. Create high-quality artwork from text prompts using advanced AI technology.",
  },
  alternates: {
    canonical: "https://www.monet-ai.top/generate",
  },
};

export default function GeneratePage() {
  return <ImageGenerator />
}