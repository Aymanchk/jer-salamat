import { ChevronDown, type LucideIcon } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useId, useState, type ReactNode } from 'react'
import { cx } from '@/lib'

interface AccordionItemProps {
  title: string
  icon?: LucideIcon
  defaultOpen?: boolean
  children: ReactNode
}

/** One expandable row. Stack several inside a bordered list. */
export function AccordionItem({ title, icon: Icon, defaultOpen = false, children }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className="border-t border-border first:border-t-0">
      <h4 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-tap w-full items-center gap-3 py-2 text-left text-base font-bold text-text hover:text-heading"
        >
          {Icon && <Icon size={20} aria-hidden="true" className="shrink-0 text-heading" />}
          <span className="flex-1">{title}</span>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={cx('shrink-0 text-text-muted transition-transform duration-base ease-token', open && 'rotate-180')}
          />
        </button>
      </h4>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={id}
            role="region"
            aria-label={title}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-8 text-text-muted">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
