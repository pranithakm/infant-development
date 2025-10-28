'use client'

import React, { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { I18nextProvider } from 'react-i18next'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [i18nInstance, setI18nInstance] = useState<any>(null)

  useEffect(() => {
    // Dynamically import and initialize i18n on the client side
    const initI18n = async () => {
      const i18nModule = await import('@/lib/i18n')
      // The module exports the i18n instance directly, not a function
      setI18nInstance(i18nModule.default)
    }

    initI18n()
  }, [])

  if (!i18nInstance) {
    // Render children without i18n provider until it's initialized
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    )
  }

  return (
    <I18nextProvider i18n={i18nInstance}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </I18nextProvider>
  )
}