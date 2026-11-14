import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'li'
  padding?: 'none' | 'md' | 'lg'
  children: ReactNode
}

const PADDING = { none: '', md: 'p-4 sm:p-5', lg: 'p-5 sm:p-7' }

export function Card({ as: Tag = 'div', padding = 'md', className, children, ...rest }: CardProps) {
  return (
    <Tag
      className={cx('rounded-card border border-border bg-surface shadow-card', PADDING[padding], className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
