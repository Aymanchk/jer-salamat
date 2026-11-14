import { m } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Seconds. Use small steps (0.05–0.1) to stagger a row of cards. */
  delay?: number
  className?: string
}

/** Lifts content into place the first time it scrolls into view. It is never transparent. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <m.div
      className={className}
      // Movement only, never hidden: content is fully readable before, during and after.
      initial={{ y: 12 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </m.div>
  )
}
