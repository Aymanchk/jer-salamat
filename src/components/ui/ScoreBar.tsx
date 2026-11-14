import type { LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import { cx } from '@/lib'

interface ScoreBarProps {
  label: string
  icon: LucideIcon
  /** 0–1. Leave undefined while the score is a placeholder. */
  value?: number
}

const LEVELS = ['Low', 'Medium', 'High'] as const

/** Simple horizontal bar with a word, not a precise number. */
export function ScoreBar({ label, icon: Icon, value }: ScoreBarProps) {
  const isPlaceholder = value === undefined
  const level = isPlaceholder ? 'Not calculated yet' : LEVELS[Math.min(2, Math.floor(value * 3))]

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1">
      <Icon size={20} aria-hidden="true" className="row-span-2 text-heading" />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold text-text">{label}</span>
        <span className={cx('text-sm', isPlaceholder ? 'text-text-muted' : 'font-bold text-accent-text')}>{level}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isPlaceholder ? undefined : Math.round(value * 100)}
        aria-valuetext={level}
        className={cx('h-2.5 overflow-hidden rounded-pill', isPlaceholder ? 'placeholder-stripes' : 'bg-surface-muted')}
      >
        {!isPlaceholder && (
          <m.div
            className="h-full rounded-pill bg-selected"
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.round(value * 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          />
        )}
      </div>
    </div>
  )
}
