import { Menu, Moon, Sprout, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { LANGS, useT } from '@/i18n'
import { cx } from '@/lib'
import { useTheme } from '@/state/theme'

const NAV = [
  { to: '/', key: 'nav.home' },
  { to: '/field', key: 'nav.field' },
  { to: '/results', key: 'nav.plan' },
  { to: '/about', key: 'nav.about' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'inline-flex min-h-tap items-center rounded-control px-3 font-bold no-underline transition-colors duration-fast',
    isActive ? 'bg-primary-soft text-heading' : 'text-text-muted hover:text-text',
  )

/** EN / RU switch. English is the default (the NASA submission is in English). */
function LangSwitch() {
  const { lang, setLang, t } = useT()
  return (
    <div role="group" aria-label={t('lang.label')} className="inline-flex rounded-pill border border-border p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          aria-pressed={lang === l.id}
          aria-label={l.name}
          onClick={() => setLang(l.id)}
          className={cx(
            'inline-flex h-10 min-w-10 items-center justify-center rounded-pill px-2 text-sm font-bold transition-colors duration-fast',
            lang === l.id ? 'bg-primary-soft text-heading' : 'text-text-muted hover:text-text',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function Header() {
  const { theme, toggle } = useTheme()
  const { t } = useT()
  const [open, setOpen] = useState(false)
  // The landing opens on a night scene, so its header stays dark in both themes.
  const onLanding = useLocation().pathname === '/'

  return (
    <header data-theme={onLanding ? 'dark' : undefined} className="glass sticky top-0 z-header border-b border-glass text-text print:hidden">
      <div className="mx-auto flex h-header max-w-content items-center gap-1.5 px-gutter sm:gap-2">
        <Link to="/" className="mr-auto inline-flex min-h-tap min-w-0 items-center gap-2 text-lg font-extrabold text-heading no-underline">
          <span aria-hidden="true" className="neon-chip inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-on-accent">
            <Sprout size={18} strokeWidth={2.5} />
          </span>
          <span className="truncate">Jer Salamat</span>
        </Link>

        <nav aria-label={t('nav.main')} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className={linkClass}>
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <LangSwitch />

        {/* The landing is always a night scene, so the switch only shows where it changes something. */}
        <button
          type="button"
          hidden={onLanding}
          onClick={toggle}
          aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
          className="inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-pill text-text-muted hover:bg-primary-soft hover:text-text max-lg:hidden"
        >
          {theme === 'dark' ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          className="-mr-2 inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-pill text-text lg:hidden"
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={t('nav.main')} className="border-t border-glass px-gutter pb-3 lg:hidden">
          <ul className="flex flex-col gap-1 pt-2">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} onClick={() => setOpen(false)} className={(s) => cx(linkClass(s), 'w-full')}>
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
            {!onLanding && (
              <li>
                <button
                  type="button"
                  onClick={toggle}
                  className="inline-flex min-h-tap w-full items-center gap-2 rounded-control px-3 font-bold text-text-muted hover:text-text"
                >
                  {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
                  {theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
