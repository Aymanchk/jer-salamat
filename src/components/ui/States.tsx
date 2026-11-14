import { CloudOff, Inbox, RefreshCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'
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
  /** Use "h1" when the state is the whole page (for example 404). */
  headingLevel?: 'h1' | 'h3'
}

function StateShell({ icon: Icon, title, children, action, tone, role, compact, className, headingLevel = 'h3' }: StateShellProps) {
  const Heading = headingLevel
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
      <Heading className={cx('text-lg', tone === 'danger' && 'text-text')}>{title}</Heading>
      {children && <p className="max-w-md text-text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

interface EmptyStateProps {
  headingLevel?: 'h1' | 'h3'
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
export function ErrorState({ title, children, onRetry, ...rest }: ErrorStateProps) {
  const { t } = useT()
  return (
    <StateShell
      icon={CloudOff}
      tone="danger"
      role="alert"
      title={title ?? t('state.errorTitle')}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry} iconLeft={<RefreshCw size={18} />}>
            {t('state.retry')}
          </Button>
        )
      }
      {...rest}
    >
      {children ?? t('state.errorBody')}
    </StateShell>
  )
}
