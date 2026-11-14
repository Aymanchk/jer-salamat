import { m } from 'motion/react'
import { Sprout } from 'lucide-react'

interface StepProgressProps {
  /** 1-based current step. */
  current: number
  total: number
  /** Visible and spoken text, for example "Question 2 of 5". */
  text: string
  className?: string
}

/** A row that fills step by step, with a sprout riding the front edge. */
export function StepProgress({ current, total, text, className }: StepProgressProps) {
  const pct = (current / total) * 100
  return (
    <div className={className}>
      <p className="mb-4 text-sm font-bold text-text-muted" aria-hidden="true">
        {text}
      </p>
      <div
        role="progressbar"
        aria-label={text}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        className="relative h-2 rounded-pill bg-border"
      >
        <m.div
          className="absolute inset-y-0 left-0 rounded-pill bg-selected"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
        <m.span
          aria-hidden="true"
          className="absolute -top-2.5 -ml-3.5 inline-flex h-7 w-7 items-center justify-center rounded-pill bg-accent text-on-accent shadow-raised"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        >
          <Sprout size={16} />
        </m.span>
      </div>
    </div>
  )
}
