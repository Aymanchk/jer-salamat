import { ArrowRight, Hand, Move, Search } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useT } from '@/i18n'

const STORAGE_KEY = 'js-coach-field'

const TIPS = [
  { icon: Search, n: 1 },
  { icon: Move, n: 2 },
  { icon: ArrowRight, n: 3 },
]

function seen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Storage can be blocked; the tips just show again next time.
  }
}

/** First-visit tips for the field page: 3 short steps with "Got it" and "Skip". */
export function CoachMarks() {
  const { t } = useT()
  const [open, setOpen] = useState(() => !seen())
  const [step, setStep] = useState(0)
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) primaryRef.current?.focus()
  }, [open, step])

  if (!open) return null

  const close = () => {
    remember()
    setOpen(false)
  }
  const tip = TIPS[step]
  const last = step === TIPS.length - 1

  return (
    <div className="absolute inset-0 z-[1001] flex items-end justify-center bg-bg/60 p-4 sm:items-center" onKeyDown={(e) => e.key === 'Escape' && close()}>
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-title"
        key={step}
        initial={{ opacity: 0.6, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="gradient-border w-full max-w-sm rounded-card bg-surface p-5 shadow-raised"
      >
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="neon-chip inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-on-accent">
            <tip.icon size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-text-muted">
              {t('coach.tip', { n: String(step + 1), total: String(TIPS.length) })}
            </p>
            <h2 id="coach-title" className="text-xl">
              {t(`coach.${tip.n}.title`)}
            </h2>
          </div>
        </div>
        <p className="mt-3 text-lg text-text">{t(`coach.${tip.n}.text`)}</p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {TIPS.map((_, i) => (
            <span key={i} className={i === step ? 'h-2 w-6 rounded-pill bg-accent' : 'h-2 w-2 rounded-pill bg-border-strong'} />
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" onClick={close}>
            {t('coach.skip')}
          </Button>
          <Button ref={primaryRef} className="flex-1" onClick={() => (last ? close() : setStep(step + 1))} iconRight={last ? <Hand size={18} /> : undefined}>
            {last ? t('coach.done') : t('coach.next')}
          </Button>
        </div>
      </m.div>
    </div>
  )
}
