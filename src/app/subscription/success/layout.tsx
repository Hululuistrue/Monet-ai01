import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Success | Welcome to Premium - Monet-AI",
  description: "Congratulations! Your premium subscription is now active. Enjoy unlimited AI image generation and exclusive features at Monet-AI.",
  robots: "noindex, nofollow", // 成功页面不需要被搜索引擎索引
};

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}