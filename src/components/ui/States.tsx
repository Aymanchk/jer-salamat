import { CloudOff, Inbox, RefreshCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/lib'
import { Button } from './Button'

interface StateShellProps {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  tone: 'neutral' | 'danger'
  role?: 'alert' | 'status'
  compact?: boolean
  className?: string
}

function StateShell({ icon: Icon, title, children, action, tone, role, compact, className }: StateShellProps) {
  return (
    <div
      role={role}
      className={cx(
        'flex flex-col items-center rounded-card border border-dashed text-center',
        compact ? 'gap-2 p-5' : 'gap-3 p-8 sm:p-12',
        tone === 'danger' ? 'border-danger bg-danger-soft' : 'border-border-strong bg-surface',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex h-12 w-12 items-center justify-center rounded-pill',
          tone === 'danger' ? 'bg-surface text-danger' : 'bg-primary-soft text-heading',
        )}
      >
        <Icon size={24} />
      </span>
      <h3 className={cx('text-lg', tone === 'danger' && 'text-text')}>{title}</h3>
      {children && <p className="max-w-md text-text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  children?: ReactNode
  action?: ReactNode
  icon?: LucideIcon
  compact?: boolean
  className?: string
}

/** Nothing to show yet, and it is not an error. */
export function EmptyState({ icon = Inbox, ...rest }: EmptyStateProps) {
  return <StateShell icon={icon} tone="neutral" {...rest} />
}

interface ErrorStateProps {
  title?: string
  children?: ReactNode
  onRetry?: () => void
  compact?: boolean
  className?: string
}

/** Something failed. Says what happened and what the user can do. */
export function ErrorState({
  title = 'NASA data is temporarily unavailable',
  children = 'Check your connection and try again.',
  onRetry,
  ...rest
}: ErrorStateProps) {
  return (
    <StateShell
      icon={CloudOff}
      tone="danger"
      role="alert"
      title={title}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry} iconLeft={<RefreshCw size={18} />}>
            Try again
          </Button>
        )
      }
      {...rest}
    >
      {children}
    </StateShell>
  )
}
