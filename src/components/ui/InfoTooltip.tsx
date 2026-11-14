import { Info } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cx } from '@/lib'

interface InfoTooltipProps {
  /** Accessible name of the button, for example "About this chart". */
  label: string
  children: string
  align?: 'left' | 'right'
}

/** Small "i" button. Opens on tap, hover or keyboard focus; Escape closes it. */
export function InfoTooltip({ label, children, align = 'right' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="-m-2 inline-flex h-11 w-11 items-center justify-center rounded-pill text-text-muted hover:text-heading"
      >
        <Info size={20} aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cx(
            'absolute top-full z-popover mt-1 w-60 max-w-[70vw] rounded-control border border-border bg-surface p-3',
            'text-sm font-normal text-text shadow-raised',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </span>
      )}
    </span>
  )
}
