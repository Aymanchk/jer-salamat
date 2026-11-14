import { cx } from '@/lib'

interface LoadingSkeletonProps {
  variant?: 'text' | 'chart' | 'card' | 'page'
  /** Number of text lines for the "text" variant. */
  lines?: number
  /** Spoken to screen readers while loading. */
  label?: string
  className?: string
}

export function LoadingSkeleton({ variant = 'text', lines = 3, label = 'Loading', className }: LoadingSkeletonProps) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}…</span>
      {variant === 'text' && (
        <div className="space-y-2.5">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className={cx('skeleton h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
          ))}
        </div>
      )}
      {variant === 'chart' && (
        <div className="space-y-3">
          <div className="skeleton h-44 w-full sm:h-52" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      )}
      {variant === 'card' && (
        <div className="space-y-4 rounded-card border border-border bg-surface p-5">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      )}
      {variant === 'page' && (
        <div className="mx-auto max-w-content space-y-6 px-gutter py-10">
          <div className="skeleton h-9 w-2/3 max-w-md" />
          <div className="skeleton h-4 w-full max-w-xl" />
          <div className="skeleton h-56 w-full" />
        </div>
      )}
    </div>
  )
}
