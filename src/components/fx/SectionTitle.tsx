import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { cx } from '@/lib'

interface SectionTitleProps {
  id?: string
  eyebrow?: string
  line1: string
  /** Second line, in the accent colour. */
  line2?: string
  children?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

const EASE = [0.16, 1, 0.3, 1] as const

/** Big two-line title. Each line rises out of a mask the first time it scrolls into view. */
export function SectionTitle({ id, eyebrow, line1, line2, children, align = 'left', className }: SectionTitleProps) {
  const lines = line2 ? [line1, line2] : [line1]
  return (
    <div className={cx(align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl', className)}>
      {eyebrow && (
        <m.p
          className={cx('mb-3 inline-flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text')}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <span className="live-dot" aria-hidden="true" />
          {eyebrow}
        </m.p>
      )}
      {/* The heading itself is watched: the masked lines inside are too clipped to trigger on their own. */}
      <m.h2 id={id} className="text-[2.25rem] leading-[1.05] sm:text-5xl lg:text-6xl" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[0.12em]">
            <m.span
              className={cx('block origin-bottom-left', i === 1 && 'text-accent-text')}
              variants={{ hidden: { y: '70%', rotate: 3 }, show: { y: 0, rotate: 0 } }}
              transition={{ duration: 1.1, delay: 0.1 + i * 0.14, ease: EASE }}
            >
              {line}
            </m.span>
          </span>
        ))}
      </m.h2>
      {children && (
        <m.p
          className={cx('mt-4 max-w-xl text-lg text-text-muted', align === 'center' && 'mx-auto')}
          initial={{ opacity: 0.4, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
        >
          {children}
        </m.p>
      )}
    </div>
  )
}
