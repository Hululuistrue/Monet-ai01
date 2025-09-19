import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | Monet-AI",
  description: "Processing authentication for Monet-AI. Please wait while we securely log you in to your AI art studio.",
  robots: "noindex, nofollow", // 回调页面不需要被搜索引擎索引
};

export default function CallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}