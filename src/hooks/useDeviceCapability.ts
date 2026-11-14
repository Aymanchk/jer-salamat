import { useReducedMotion } from 'motion/react'
import { useMemo } from 'react'

interface NetworkInformation {
  saveData?: boolean
  effectiveType?: string
}

/**
 * Decides whether the device should get the 3D hero.
 * Weak phones, slow or metered connections and reduced-motion users
 * get the static image instead.
 */
export function useCanRender3D(): boolean {
  const reducedMotion = useReducedMotion()

  return useMemo(() => {
    if (reducedMotion) return false
    const nav = navigator as Navigator & { connection?: NetworkInformation; deviceMemory?: number }

    if (nav.connection?.saveData) return false
    if (nav.connection?.effectiveType && nav.connection.effectiveType !== '4g') return false
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false

    try {
      const canvas = document.createElement('canvas')
      if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) return false
    } catch {
      return false
    }
    return true
  }, [reducedMotion])
}
