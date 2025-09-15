import AuthPage from '@/components/AuthPage'

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <AuthPage />
}