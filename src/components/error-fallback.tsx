'use client'

import { FallbackProps } from 'react-error-boundary'

export function ErrorFallback({ error }: FallbackProps) {
  return (
    <div className="text-center">
      <h2 className="text-lg font-semibold">Oops! Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  )
}

