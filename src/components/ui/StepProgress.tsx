import { cx } from '@/lib'

interface StepProgressProps {
  /** 1-based current step. */
  current: number
  total: number
  /** Noun for one step, for example "Question". */
  label?: string
  className?: string
}

export function StepProgress({ current, total, label = 'Step', className }: StepProgressProps) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-bold text-text-muted" aria-hidden="true">
        {label} {current} of {total}
      </p>
      <div
        role="progressbar"
        aria-label={`${label} ${current} of ${total}`}
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
