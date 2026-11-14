import { m } from 'motion/react'
import { cx } from '@/lib'

/** Deterministic pseudo-random numbers, so the row looks the same on every visit. */
const rand = (i: number) => {
  const s = Math.sin(i * 91.7 + 13.1) * 43758.5453
  return s - Math.floor(s)
}

interface SproutRowProps {
  count?: number
  className?: string
}

/**
 * A furrow of sprouts that grow up (stem, then leaves, then a wheat head on some)
 * the first time the row scrolls into view, then sway in the wind. Decorative.
 */
export function SproutRow({ count = 28, className }: SproutRowProps) {
  const W = 1200
  const H = 140
  const step = W / count
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" overflow="hidden" className={cx('block w-full overflow-hidden [contain:paint]', className)}>
      {/* The furrow. */}
      <m.path
        d={`M0 ${H - 6} Q ${W / 2} ${H - 14} ${W} ${H - 6}`}
        className="stroke-border-strong"
        strokeWidth={2}
        fill="none"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
      />
      {Array.from({ length: count }, (_, i) => {
        const x = step * (i + 0.5) + (rand(i) - 0.5) * step * 0.4
        const h = 40 + rand(i + 7) * 70
        const base = H - 8
        const top = base - h
        const bend = (rand(i + 3) - 0.5) * 18
        const head = rand(i + 11) > 0.55
        const delay = 0.4 + i * 0.06 + rand(i + 5) * 0.2
        return (
          <g key={i} className="sway" style={{ animationDelay: `${-rand(i) * 4}s` }}>
            <m.path
              d={`M${x} ${base} Q ${x + bend} ${base - h / 2} ${x + bend * 0.6} ${top}`}
              className="stroke-accent-text"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
            />
            {[0.45, 0.65].map((f, k) => {
              const ly = base - h * f
              const lx = x + bend * f
              const dir = k % 2 ? 1 : -1
              return (
                <m.path
                  key={k}
                  d={`M${lx} ${ly} q ${dir * 14} -4 ${dir * 20} -16 q ${dir * -12} 2 ${dir * -20} 16`}
                  className="fill-accent-text"
                  style={{ transformBox: 'fill-box', transformOrigin: dir > 0 ? '0% 100%' : '100% 100%' }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, delay: delay + 0.5 + k * 0.15, type: 'spring', stiffness: 160, damping: 12 }}
                />
              )
            })}
            {head && (
              <m.ellipse
                cx={x + bend * 0.6}
                cy={top - 8}
                rx={4.5}
                ry={11}
                className="fill-wheat"
                style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: delay + 0.9, type: 'spring', stiffness: 140, damping: 10 }}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
