import { ArrowRight, MapPin, MapPinOff, Pencil, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Container, Section, SectionHeading } from '@/components/layout/Page'
import { ChartCard, type ChartStatus } from '@/components/results/ChartCard'
import { RotationCard, STRATEGIES } from '@/components/results/RotationCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { EmptyState } from '@/components/ui/States'
import { Switch } from '@/components/ui/Switch'
import { PLACEHOLDER_SECTIONS, PLACEHOLDER_STRATEGIES, placeholderShape, YEARS } from '@/content/placeholders'
import { answerLabel, QUESTIONS } from '@/content/questions'
import type { ClimateVariable, Priority, StrategyId } from '@/core'
import { cx, formatCoords } from '@/lib'
import { useSession } from '@/state/session'

const CHARTS: Array<{ variable: ClimateVariable; values: number[] }> = [
  { variable: 'temperature', values: placeholderShape('temperature') },
  { variable: 'precipitation', values: placeholderShape('precipitation') },
  { variable: 'soilWetness', values: placeholderShape('soilWetness') },
]

const PLACEHOLDER_SUMMARY = 'A one-sentence summary in plain words will appear here.'

const PRIORITY_TO_STRATEGY: Record<Priority, StrategyId> = {
  water: 'water-saving',
  soil: 'soil-health',
  income: 'economic',
}

const PREVIEW_STATES: Array<{ value: ChartStatus; label: string }> = [
  { value: 'ready', label: 'Ready' },
  { value: 'cached', label: 'Cached' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

export default function ResultsPage() {
  const { field, answers, reset } = useSession()
  const navigate = useNavigate()
  const [status, setStatus] = useState<ChartStatus>('ready')
  const [whatIf, setWhatIf] = useState(false)
  const [activeCard, setActiveCard] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)

  // Track which plan is in view on the mobile swipe rail.
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const onScroll = () => {
      const first = rail.firstElementChild as HTMLElement | null
      if (!first) return
      const step = first.offsetWidth + parseFloat(getComputedStyle(rail).columnGap || '0')
      setActiveCard(Math.round(rail.scrollLeft / step))
    }
    rail.addEventListener('scroll', onScroll, { passive: true })
    return () => rail.removeEventListener('scroll', onScroll)
  }, [field])

  if (!field) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={MapPinOff}
          title="No field picked yet"
          action={
            <Button to="/field" iconRight={<ArrowRight size={20} />}>
              Pick my field
            </Button>
          }
        >
          Place a pin on the map first. Then we can show the climate and rotation plans for your area.
        </EmptyState>
      </Container>
    )
  }

  const priority = answers.priority && answers.priority !== 'unknown' ? PRIORITY_TO_STRATEGY[answers.priority] : null
  const scrollToCard = (i: number) => {
    const card = railRef.current?.children[i] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <>
      {/* Summary of what the farmer entered */}
      <Container className="pt-6 sm:pt-10">
        <h1 className="text-3xl sm:text-4xl">Results for your field</h1>
        <p className="mt-2 flex items-center gap-2 text-lg text-text-muted">
          <MapPin size={20} aria-hidden="true" className="shrink-0 text-heading" />
          <span className="tabular-nums">{formatCoords(field.lat, field.lon)}</span>
        </p>

        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge type="answers" />
            <Link
              to="/questions"
              className="inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4"
            >
              <Pencil size={16} aria-hidden="true" />
              Change answers
            </Link>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUESTIONS.map((q) => (
              <div key={q.id}>
                <dt className="text-sm text-text-muted">{q.short}</dt>
                <dd className="font-bold text-text">{answerLabel(q.id, answers[q.id]) ?? 'Not answered'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Design-review control. Remove when real data states are wired. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-dashed border-border-strong p-3">
          <Badge type="placeholder">Design preview</Badge>
          <p id="preview-label" className="text-sm text-text-muted">
            Data state for review:
          </p>
          <div role="radiogroup" aria-labelledby="preview-label" className="flex flex-wrap gap-1">
            {PREVIEW_STATES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={status === s.value}
                onClick={() => setStatus(s.value)}
                className={cx(
                  'min-h-11 rounded-control border-2 px-2.5 text-sm font-bold transition-colors duration-fast',
                  status === s.value
                    ? 'border-selected bg-primary-soft text-heading'
                    : 'border-transparent text-text-muted hover:text-text',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Container>

      {/* Climate */}
      <Section labelledBy="climate-title">
        <SectionHeading id="climate-title" eyebrow="Step 1 · Climate" title="Climate around your field, 1986–2025">
          Forty years of records for your area. This is regional climate, not a measurement of your exact field.
        </SectionHeading>

        <div className="mb-5 flex flex-col gap-2 rounded-card border border-dashed border-border-strong bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Switch checked={whatIf} onChange={setWhatIf} label="What if +2°C?" />
            <p className="text-sm text-text-muted">
              Adds a "what if" line to the temperature chart. It is not a forecast.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge type="hypothetical">Hypothetical</Badge>
            <Badge type="placeholder" />
          </div>
        </div>

        <ul className="grid gap-4 lg:grid-cols-3">
          {CHARTS.map((chart, i) => (
            <li key={chart.variable} className="min-w-0">
              <Reveal delay={i * 0.08} className="h-full">
                <ChartCard
                  variable={chart.variable}
                  status={status}
                  years={YEARS}
                  values={chart.values}
                  summary={PLACEHOLDER_SUMMARY}
                  placeholder
                  scenarioLabel={whatIf && chart.variable === 'temperature' ? '+2°C scenario (hypothetical)' : undefined}
                  onRetry={() => setStatus('ready')}
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Rotation plans */}
      <Section labelledBy="plans-title">
        <SectionHeading id="plans-title" eyebrow="Step 2 · Plans" title="Compare 3 rotation plans">
          Each plan has a different goal. Open "Limitations" and "Missing information" before you decide.
        </SectionHeading>

        <p className="mb-3 text-sm text-text-muted lg:hidden" aria-hidden="true">
          Swipe to see all 3 plans
        </p>
      </Section>

      {/* The rail runs edge to edge on mobile so the next card peeks in. */}
      <div className="mx-auto w-full max-w-content">
        <div
          ref={railRef}
          role="group"
          aria-label="Rotation plans"
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--space-gutter)] px-gutter pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible"
        >
          {PLACEHOLDER_STRATEGIES.map((strategy) => (
            <div key={strategy.id} className="w-[86%] max-w-sm shrink-0 snap-center lg:w-auto lg:max-w-none">
              <RotationCard
                id={strategy.id}
                sequence={strategy.sequence}
                sections={PLACEHOLDER_SECTIONS}
                matchesPriority={priority === strategy.id}
                placeholder
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-center gap-1 lg:hidden">
          {PLACEHOLDER_STRATEGIES.map((strategy, i) => (
            <button
              key={strategy.id}
              type="button"
              onClick={() => scrollToCard(i)}
              aria-label={`Show ${STRATEGIES[strategy.id].title} plan`}
              aria-current={activeCard === i}
              className="inline-flex h-11 w-9 items-center justify-center"
            >
              <span
                className={cx(
                  'h-2.5 rounded-pill transition-all duration-base ease-token',
                  activeCard === i ? 'w-7 bg-selected' : 'w-2.5 bg-border-strong',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* How to read the labels */}
      <Section labelledBy="labels-title">
        <Card padding="lg">
          <h2 id="labels-title" className="text-xl">
            How to read the labels
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt><Badge type="historical" /></dt>
              <dd className="mt-1.5 text-text-muted">Climate records from NASA POWER for your area.</dd>
            </div>
            <div>
              <dt><Badge type="answers" /></dt>
              <dd className="mt-1.5 text-text-muted">What you told us about your field.</dd>
            </div>
            <div>
              <dt><Badge type="estimate" /></dt>
              <dd className="mt-1.5 text-text-muted">Calculated by this app. Useful, but not exact.</dd>
            </div>
            <div>
              <dt><Badge type="hypothetical" /></dt>
              <dd className="mt-1.5 text-text-muted">A "what if" picture. Not a forecast.</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <Button
              variant="outline"
              iconLeft={<RotateCcw size={18} />}
              onClick={() => {
                reset()
                navigate('/field')
              }}
            >
              Check another field
            </Button>
            <Button to="/about" variant="ghost">
              Sources and limits
            </Button>
          </div>
        </Card>
      </Section>
    </>
  )
}
