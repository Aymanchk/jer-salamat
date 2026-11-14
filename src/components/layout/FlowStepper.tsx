import { Check, ChartLine, ClipboardList, MapPin, Sprout, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { QUESTIONS } from '@/content/questions'
import { cx } from '@/lib'
import { useSession } from '@/state/session'

interface FlowStep {
  id: 'field' | 'questions' | 'climate' | 'plan'
  label: string
  icon: LucideIcon
}

const STEPS: FlowStep[] = [
  { id: 'field', label: 'Field', icon: MapPin },
  { id: 'questions', label: 'Questions', icon: ClipboardList },
  { id: 'climate', label: 'Climate', icon: ChartLine },
  { id: 'plan', label: 'Plan', icon: Sprout },
]

/** Routes that show the stepper. */
export const FLOW_ROUTES = ['/field', '/questions', '/results']

/** On the results page, "Climate" is active while the climate section is on screen. */
function useResultsSection(enabled: boolean): 'climate' | 'plan' {
  const [section, setSection] = useState<'climate' | 'plan'>('plan')
  useEffect(() => {
    if (!enabled) return
    const climate = document.getElementById('climate')
    if (!climate) return
    const observer = new IntersectionObserver(
      ([entry]) => setSection(entry.isIntersecting ? 'climate' : 'plan'),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    observer.observe(climate)
    return () => observer.disconnect()
  }, [enabled])
  return section
}

/** Field → Questions → Climate → Plan. Shown on every page of the flow. */
export function FlowStepper() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { field, answers } = useSession()
  const onResults = pathname === '/results'
  const section = useResultsSection(onResults)

  const current: FlowStep['id'] = pathname === '/field' ? 'field' : pathname === '/questions' ? 'questions' : section
  const currentIndex = STEPS.findIndex((s) => s.id === current)
  const answeredAll = QUESTIONS.every((q) => answers[q.id] !== undefined)

  const isDone = (step: FlowStep, i: number) => {
    if (step.id === 'field') return field !== null && i !== currentIndex
    if (step.id === 'questions') return answeredAll && i !== currentIndex
    return onResults && i < currentIndex
  }
  const canGo = (step: FlowStep, i: number) => {
    if (i === currentIndex) return false
    if (step.id === 'field') return true
    if (step.id === 'questions') return field !== null
    return field !== null && answeredAll
  }

  const go = (step: FlowStep) => {
    if (step.id === 'field') navigate('/field')
    else if (step.id === 'questions') navigate('/questions')
    else if (onResults) {
      document.getElementById(step.id === 'climate' ? 'climate' : 'recommendation')?.scrollIntoView({ behavior: 'smooth' })
    } else navigate(step.id === 'climate' ? '/results#climate' : '/results')
  }

  return (
    <nav aria-label="Progress" className="glass sticky top-header z-[1050] border-b border-glass print:hidden">
      <ol className="mx-auto flex h-stepper max-w-content items-center gap-1 px-gutter sm:gap-2">
        {STEPS.map((step, i) => {
          const active = i === currentIndex
          const done = isDone(step, i)
          const clickable = canGo(step, i)
          const Icon = done ? Check : step.icon
          return (
            <li key={step.id} className={cx('flex min-w-0 items-center gap-1 sm:flex-1 sm:gap-2', active ? 'flex-auto' : 'flex-none')}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => go(step)}
                aria-current={active ? 'step' : undefined}
                className={cx(
                  'flex min-h-11 min-w-11 flex-1 items-center justify-center gap-1.5 rounded-pill px-2 text-sm font-bold transition-colors duration-fast sm:justify-start sm:px-3',
                  active && 'neon-chip text-on-accent',
                  !active && done && 'text-heading hover:bg-primary-soft',
                  !active && !done && 'text-text-muted',
                  !clickable && !active && 'cursor-default',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill',
                    !active && (done ? 'bg-primary-soft' : 'border border-border-strong'),
                  )}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </span>
                <span className={cx('truncate', !active && 'max-sm:sr-only')}>{step.label}</span>
                {done && <span className="sr-only"> (done)</span>}
              </button>
              {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-3 shrink-0 bg-border-strong sm:w-4" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
