import { AnimatePresence, m, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CropIcon } from '@/components/ui/CropIcon'
import type { CropId } from '@/core'
import { useT } from '@/i18n'
import { cx } from '@/lib'

interface RotationWheelProps {
  sequence: CropId[]
  /** Diameter in px at its largest; it shrinks with the container. */
  size?: number
  /** Seconds each year stays highlighted. */
  pace?: number
  className?: string
}

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * A crop rotation as a turning wheel: one crop per year around the ring.
 * The highlight walks from year to year, the arc between them fills in,
 * and the centre names the crop. Keyboard users can step with the year buttons.
 */
export function RotationWheel({ sequence, size = 340, pace = 2.2, className }: RotationWheelProps) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = sequence.length

  useEffect(() => {
    if (!inView || reduced || paused) return
    const id = setInterval(() => setActive((a) => (a + 1) % n), pace * 1000)
    return () => clearInterval(id)
  }, [inView, reduced, paused, n, pace])

  const R = 38 // ring radius, % of the box: leaves room for the (scaled-up) crop icons
  const seg = 100 / n
  const circ = 2 * Math.PI * R

  return (
    <div
      ref={ref}
      className={cx('relative mx-auto aspect-square w-full', className)}
      style={{ maxWidth: size }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={50} cy={50} r={R} fill="none" className="stroke-border" strokeWidth={0.8} strokeDasharray="1 1.6" />
        {/* The arc that has been "grown" so far this cycle. */}
        <m.circle
          cx={50}
          cy={50}
          r={R}
          fill="none"
          className="stroke-accent-text"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - ((active + 1) * seg) / 100) }}
          transition={{ duration: pace * 0.8, ease: EASE }}
        />
      </svg>
      {/* A slow-turning outer ring, like a field seen from above. */}
      {/* The ring turns inside its own box (the svg itself never rotates), so it can't widen the page. */}
      <svg viewBox="0 0 100 100" overflow="hidden" className="absolute inset-0 h-full w-full max-w-full overflow-hidden" aria-hidden="true">
        <m.g
          style={{ transformOrigin: '50px 50px' }}
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
        >
          <circle cx={50} cy={50} r={49} fill="none" className="stroke-wheat" strokeWidth={0.35} strokeDasharray="0.6 2.4" opacity={0.7} />
        </m.g>
      </svg>

      {sequence.map((crop, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2
        const x = 50 + Math.cos(angle) * R
        const y = 50 + Math.sin(angle) * R
        const on = i === active
        return (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={on}
            aria-label={`${t('plan.year', { n: String(i + 1) })}: ${t(`crop.${crop}`)}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-pill"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <m.span
              className={cx('block rounded-pill p-1 transition-colors duration-500', on ? 'bg-accent' : 'bg-bg')}
              animate={{ scale: on ? 1.25 : 0.95 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            >
              <CropIcon crop={crop} size="lg" showLabel={false} />
            </m.span>
          </button>
        )
      })}

      <div className="absolute inset-[24%] flex flex-col items-center justify-center text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          <m.div
            key={active}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <p className="font-display text-sm uppercase tracking-[0.16em] text-text-muted">{t('plan.year', { n: String(active + 1) })}</p>
            <p className="mt-1 font-display text-2xl font-semibold leading-tight text-heading sm:text-3xl">{t(`crop.short.${sequence[active]}`)}</p>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
