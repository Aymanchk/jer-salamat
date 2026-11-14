import { useReducedMotion } from 'motion/react'
import { useCallback, type PointerEvent } from 'react'

const MAX_DEG = 4

/** Subtle 3D tilt that follows the mouse. Off for touch screens and reduced motion. */
export function useTilt() {
  const reduced = useReducedMotion()
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (reduced || e.pointerType !== 'mouse') return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(900px) rotateX(${(-y * MAX_DEG).toFixed(2)}deg) rotateY(${(x * MAX_DEG).toFixed(2)}deg) translateY(-3px)`
    },
    [reduced],
  )
  const onPointerLeave = useCallback((e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = ''
  }, [])
  return { onPointerMove, onPointerLeave }
}
