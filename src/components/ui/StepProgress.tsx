import { cx } from '@/lib'

interface StepProgressProps {
  /** 1-based current step. */
  current: number
  total: number
  /** Visible and spoken text, for example "Question 2 of 5". */
  text: string
  className?: string
}

export function StepProgress({ current, total, text, className }: StepProgressProps) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-bold text-text-muted" aria-hidden="true">
        {text}
      </p>
      <div
        role="progressbar"
        aria-label={text}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        className="flex gap-1.5"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cx(
              'h-2 flex-1 rounded-pill transition-colors duration-base ease-token',
              i < current ? 'bg-selected' : 'bg-border',
            )}
          />
        ))}
      </div>
    </div>
  )
}
