import { m } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Seconds. Use small steps (0.05–0.1) to stagger a row of cards. */
  delay?: number
  className?: string
}

/** Fades and lifts content into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0.3, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.3, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </m.div>
  )
}
