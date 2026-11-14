import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  decimals?: number
  /** Shown before the number, for example "+". */
  prefix?: string
  suffix?: string
  className?: string
}

/** Counts up to a number when it scrolls into view. Shows the final value at once for reduced motion. */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setShown(value)
      return
    }
    const controls = animate(0, value, { duration: 0.9, ease: [0.2, 0.7, 0.2, 1], onUpdate: setShown })
    return () => controls.stop()
  }, [inView, value, reduced])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}
