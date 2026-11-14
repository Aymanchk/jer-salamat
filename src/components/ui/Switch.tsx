import { cx } from '@/lib'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

/** On/off toggle with a visible text label. */
export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx('inline-flex min-h-tap items-center gap-3 rounded-control text-left font-bold text-text', className)}
    >
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border-2 transition-colors duration-fast ease-token',
          checked ? 'border-selected bg-primary' : 'border-border-strong bg-surface-muted',
        )}
      >
        <span
          className={cx(
            'absolute left-0.5 h-5 w-5 rounded-pill transition-transform duration-fast ease-token',
            checked ? 'translate-x-5 bg-accent' : 'bg-border-strong',
          )}
        />
      </span>
      {label}
    </button>
  )
}
