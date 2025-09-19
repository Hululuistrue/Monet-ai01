import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Access Your AI Art Studio - Monet-AI",
  description: "Sign in to access premium AI image generation features, save your artwork, and unlock advanced tools. Secure authentication for artists.",
  keywords: "sign in AI generator, login Monet-AI, access AI art tools, secure authentication, AI artist login, premium features access",
  openGraph: {
    title: "Sign In | Access Your AI Art Studio - Monet-AI",
    description: "Sign in to access premium AI image generation features, save your artwork, and unlock advanced tools.",
    url: "https://www.monet-ai.top/auth/login",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | Access Your AI Art Studio - Monet-AI",
    description: "Sign in to access premium AI image generation features, save your artwork, and unlock advanced tools.",
  },
  alternates: {
    canonical: "https://www.monet-ai.top/auth/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}