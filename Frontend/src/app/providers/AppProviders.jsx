import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { MotionConfig } from 'framer-motion'
import AuthProvider from '../../features/auth/context/AuthContext.jsx'
import LanguageProvider from '../../shared/i18n/LanguageProvider.jsx'
import AppToaster from '../../shared/components/feedback/AppToaster.jsx'

export default function AppProviders({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <MotionConfig reducedMotion="user">
            {children}
            <AppToaster />
          </MotionConfig>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
