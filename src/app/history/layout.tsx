import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Generated Images | AI Art Gallery - Monet-AI",
  description: "View, download and manage your AI-generated artwork. Personal gallery of your creative AI images with favorites and history.",
  keywords: "AI art gallery, generated images history, AI artwork collection, download AI images, manage AI creations, personal art gallery",
  openGraph: {
    title: "My Generated Images | AI Art Gallery - Monet-AI",
    description: "View, download and manage your AI-generated artwork. Personal gallery of your creative AI images.",
    url: "https://www.monet-ai.top/history",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Generated Images | AI Art Gallery - Monet-AI",
    description: "View, download and manage your AI-generated artwork. Personal gallery of your creative AI images.",
  },
  alternates: {
    canonical: "https://www.monet-ai.top/history",
  },
  robots: "noindex, nofollow", // 用户私人页面不需要被搜索引擎索引
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}