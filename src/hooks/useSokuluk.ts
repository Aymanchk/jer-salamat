import { useEffect, useState } from 'react'
import { parsePower, type ClimateData, type PowerResponse } from '@/core'

let request: Promise<ClimateData> | null = null

/** Cached NASA POWER data for the Sokuluk demo point, fetched once per visit. */
export function useSokuluk(): { data: ClimateData | null; failed: boolean } {
  const [data, setData] = useState<ClimateData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    request ??= fetch('/data/sokuluk.json')
      .then((r) => (r.ok ? (r.json() as Promise<PowerResponse>) : Promise.reject(new Error(String(r.status)))))
      .then((json) => parsePower(json, false))
    request
      .then((d) => alive && setData(d))
      .catch(() => {
        request = null
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  return { data, failed }
}
