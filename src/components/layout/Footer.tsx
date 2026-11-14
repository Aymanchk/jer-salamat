import { Link, useLocation } from 'react-router'
import { useT } from '@/i18n'

export function Footer() {
  const { t } = useT()
  const onLanding = useLocation().pathname === '/'
  return (
    <footer
      data-theme={onLanding ? 'dark' : undefined}
      className={onLanding ? 'border-t border-border bg-surface-muted text-text' : 'mt-section border-t border-border bg-surface-muted text-text'}
    >
      <div className="mx-auto flex max-w-content flex-col gap-3 px-gutter py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong className="text-text">Jer Salamat</strong> · {t('footer.event')}
        </p>
        <p>
          {t('footer.data')} ·{' '}
          <Link to="/about" className="inline-flex min-h-11 items-center font-bold text-heading underline underline-offset-4">
            {t('footer.sources')}
          </Link>
        </p>
      </div>
    </footer>
  )
}
