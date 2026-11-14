import { useCallback, useEffect, useState } from 'react'
import { loadClimate, type ClimateData, type FieldLocation } from '@/core'
import DEMO_POINTS from '@/data/demoPoints.json'

export type ClimateStatus = 'loading' | 'ready' | 'cached' | 'error'

/** Loads NASA POWER climate for the field; falls back to cached demo data. */
export function useClimate(field: FieldLocation | null) {
  const [data, setData] = useState<ClimateData | null>(null)
  const [status, setStatus] = useState<ClimateStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!field) return
    let cancelled = false
    setStatus('loading')
    loadClimate(field, DEMO_POINTS)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setStatus(result.cached ? 'cached' : 'ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [field?.lat, field?.lon, attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { data, status, retry }
}
