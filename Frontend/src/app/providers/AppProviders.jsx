import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import AuthProvider from '../../features/auth/context/AuthContext.jsx'
import AppToaster from '../../shared/components/feedback/AppToaster.jsx'

export default function AppProviders({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <AppToaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}
