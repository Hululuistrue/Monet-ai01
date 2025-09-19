import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Recover Your Account - Monet-AI",
  description: "Reset your Monet-AI account password securely. Recover access to your AI art studio and continue creating amazing artwork.",
  keywords: "reset password Monet-AI, recover account, password recovery, secure login, account access",
  openGraph: {
    title: "Reset Password | Recover Your Account - Monet-AI",
    description: "Reset your Monet-AI account password securely. Recover access to your AI art studio.",
    url: "https://www.monet-ai.top/auth/reset-password",
    type: "website",
  },
  alternates: {
    canonical: "https://www.monet-ai.top/auth/reset-password",
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}