import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { SubscriptionStatus } from '@/lib/types'
import { useAuth } from './useAuth'

export function useSubscription() {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(() => {
    if (!isAuthenticated) return
    setIsLoading(true)
    api.subscription.get()
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const plan = data?.subscription?.plan ?? 'free'
  const isFree = plan === 'free'
  const isBasico = plan === 'basico'
  const isPro = plan === 'pro'

  const used = data?.daily_usage?.template_count ?? 0
  const freeLimit = data?.free_limit ?? 2
  const remaining = isFree ? Math.max(0, freeLimit - used) : Infinity
  const isAtLimit = isFree && remaining === 0

  const allowedProgram = data?.subscription?.program_code ?? 'digsilent'

  return { data, isLoading, plan, isFree, isBasico, isPro, used, remaining, isAtLimit, allowedProgram, refresh }
}
