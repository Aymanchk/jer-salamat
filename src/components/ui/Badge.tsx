import { BookOpen, Calculator, ClipboardList, Construction, FlaskConical, Satellite, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DataProvenance } from '@/core'
import { cx } from '@/lib'

/**
 * Data-type label. Tells the reader where a number or statement comes from.
 * Each type has its own icon and border style, so it never depends on colour alone.
 */
const TYPES: Record<DataProvenance, { label: string; icon: LucideIcon; className: string }> = {
  historical: {
    label: 'Historical NASA data',
    icon: Satellite,
    className: 'bg-primary-soft text-heading border-transparent',
  },
  answers: {
    label: 'Your answers',
    icon: ClipboardList,
    className: 'bg-surface-muted text-text border-transparent',
  },
  estimate: {
    label: 'Estimate',
    icon: Calculator,
    className: 'bg-accent-soft text-accent-text border-transparent',
  },
  guidance: {
    label: 'General guidance',
    icon: BookOpen,
    className: 'bg-surface-muted text-text border-border-strong',
  },
  hypothetical: {
    label: 'Hypothetical scenario',
    icon: FlaskConical,
    className: 'bg-surface text-text border-border-strong border-dashed',
  },
  placeholder: {
    label: 'Placeholder',
    icon: Construction,
    className: 'placeholder-stripes text-text border-border-strong uppercase tracking-wide',
  },
}

interface BadgeProps {
  type: DataProvenance
  /** Overrides the default label, for example "Hypothetical". */
  children?: ReactNode
  className?: string
}

export function Badge({ type, children, className }: BadgeProps) {
  const { label, icon: Icon, className: typeClass } = TYPES[type]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-sm font-bold leading-none whitespace-nowrap',
        typeClass,
        className,
      )}
    >
      <Icon size={14} aria-hidden="true" strokeWidth={2.25} />
      {children ?? label}
    </span>
  )
}
