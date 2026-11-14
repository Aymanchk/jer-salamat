import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Link } from 'react-router'
import { cx } from '@/lib'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-pill font-bold text-base no-underline ' +
  'transition-[background-color,border-color,transform,box-shadow] duration-fast ease-token ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:scale-100'

const VARIANTS: Record<Variant, string> = {
  // Gold: the single most important action on a screen.
  primary: 'neon-btn bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-primary-strong text-on-primary hover:bg-primary-soft border border-border',
  outline: 'border-2 border-border-strong bg-surface text-text hover:border-selected hover:bg-primary-soft',
  ghost: 'text-heading hover:bg-primary-soft',
}

const SIZES: Record<Size, string> = {
  md: 'min-h-tap px-5',
  lg: 'min-h-tap-lg px-7 text-lg',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  /** Stretch to the full width of the parent. */
  block?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  className?: string
  children: ReactNode
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    /** When set, renders a router link that looks like a button. */
    to?: string
    ref?: Ref<HTMLButtonElement>
  }

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  iconLeft,
  iconRight,
  className,
  children,
  to,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  const classes = cx(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)
  const content = (
    <>
      {iconLeft && <span aria-hidden="true" className="shrink-0">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span aria-hidden="true" className="shrink-0">{iconRight}</span>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {content}
    </button>
  )
}
