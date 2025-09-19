import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Cancelled | Monet-AI",
  description: "Your subscription process was cancelled. You can try again anytime or continue with free features at Monet-AI.",
  robots: "noindex, nofollow", // 取消页面不需要被搜索引擎索引
};

export default function CancelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}