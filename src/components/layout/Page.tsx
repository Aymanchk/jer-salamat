import type { ReactNode } from 'react'
import { cx } from '@/lib'

interface SectionProps {
  children: ReactNode
  className?: string
  /** id of the heading that labels this section. */
  labelledBy?: string
}

/** Centred content column with the standard side gutter. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-content px-gutter', className)}>{children}</div>
}

export function Section({ children, className, labelledBy }: SectionProps) {
  return (
    <section aria-labelledby={labelledBy} className={cx('pt-section', className)}>
      <Container>{children}</Container>
    </section>
  )
}

interface SectionHeadingProps {
  id?: string
  eyebrow?: string
  title: string
  children?: ReactNode
}

export function SectionHeading({ id, eyebrow, title, children }: SectionHeadingProps) {
  return (
    <div className="mb-6 max-w-2xl sm:mb-8">
      {eyebrow && <p className="mb-1 text-sm font-bold uppercase tracking-wider text-accent-text">{eyebrow}</p>}
      <h2 id={id} className="text-2xl sm:text-3xl">
        {title}
      </h2>
      {children && <p className="mt-2 text-lg text-text-muted">{children}</p>}
    </div>
  )
}
