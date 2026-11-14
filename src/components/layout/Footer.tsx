import { Link, useLocation } from 'react-router'

export function Footer() {
  const onLanding = useLocation().pathname === '/'
  return (
    <footer data-theme={onLanding ? 'dark' : undefined} className={onLanding ? 'border-t border-border bg-surface-muted text-text' : 'mt-section border-t border-border bg-surface-muted text-text'}>
      <div className="mx-auto flex max-w-content flex-col gap-3 px-gutter py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong className="text-text">Jer Salamat</strong> · NASA Space Apps Challenge 2026 · Field Shift
        </p>
        <p>
          Data: NASA POWER ·{' '}
          <Link to="/about" className="font-bold text-heading underline underline-offset-4">
            Sources and limits
          </Link>
        </p>
      </div>
    </footer>
  )
}
