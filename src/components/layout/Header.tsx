import { Menu, Moon, Sprout, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { cx } from '@/lib'
import { useTheme } from '@/state/theme'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/field', label: 'Check my field' },
  { to: '/results', label: 'My plan' },
  { to: '/about', label: 'About & glossary' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'inline-flex min-h-tap items-center rounded-control px-3 font-bold no-underline transition-colors duration-fast',
    isActive ? 'bg-primary-soft text-heading' : 'text-text-muted hover:text-text',
  )

export function Header() {
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  // The landing opens on a night scene, so its header stays dark in both themes.
  const onLanding = useLocation().pathname === '/'

  return (
    <header data-theme={onLanding ? 'dark' : undefined} className="glass sticky top-0 z-header border-b border-glass text-text print:hidden">
      <div className="mx-auto flex h-header max-w-content items-center gap-2 px-gutter">
        <Link to="/" className="mr-auto inline-flex min-h-tap items-center gap-2 text-lg font-extrabold text-heading no-underline">
          <span aria-hidden="true" className="neon-chip inline-flex h-8 w-8 items-center justify-center rounded-pill text-on-accent">
            <Sprout size={18} strokeWidth={2.5} />
          </span>
          Jer Salamat
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className={linkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* The landing is always a night scene, so the switch only shows where it changes something. */}
        <button
          type="button"
          hidden={onLanding}
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="inline-flex h-tap w-tap items-center justify-center rounded-pill text-text-muted hover:bg-primary-soft hover:text-text"
        >
          {theme === 'dark' ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 inline-flex h-tap w-tap items-center justify-center rounded-pill text-text md:hidden"
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-glass px-gutter pb-3 md:hidden">
          <ul className="flex flex-col gap-1 pt-2">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={(s) => cx(linkClass(s), 'w-full')}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
