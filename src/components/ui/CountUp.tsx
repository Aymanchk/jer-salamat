import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n'

interface CountUpProps {
  value: number
  decimals?: number
  /** Shown before the number, for example "+". */
  prefix?: string
  suffix?: string
  className?: string
}

/**
 * Shows the final number by default. When it first scrolls into view it counts
 * up as an enhancement; if the animation cannot run (background tab, reduced
 * motion) the final value stays, and a timer restores it after 1.5 s.
 */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(value)
  const { num } = useT()

  useEffect(() => {
    setShown(value)
    if (!inView || reduced || document.visibilityState !== 'visible') return
    const controls = animate(0, value, { duration: 0.9, ease: [0.2, 0.7, 0.2, 1], onUpdate: setShown })
    const fallback = setTimeout(() => {
      controls.stop()
      setShown(value)
    }, 1500)
    return () => {
      controls.stop()
      clearTimeout(fallback)
      setShown(value)
    }
  }, [inView, value, reduced])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {num(shown, decimals)}
      {suffix}
    </span>
  )
}
