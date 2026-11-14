import {
  ArrowRight,
  CircleCheck,
  Gauge,
  MapPin,
  MapPinOff,
  Pencil,
  Printer,
  RotateCcw,
  Stethoscope,
  ThermometerSun,
  Trophy,
  CloudRain,
  Droplets,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Container, Section, SectionHeading } from '@/components/layout/Page'
import { ChartCard } from '@/components/results/ChartCard'
import { PLANS, RotationCard } from '@/components/results/RotationCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CountUp } from '@/components/ui/CountUp'
import { Reveal } from '@/components/ui/Reveal'
import { EmptyState } from '@/components/ui/States'
import { Switch } from '@/components/ui/Switch'
import { Term } from '@/components/ui/Term'
import { answerLabel, QUESTIONS } from '@/content/questions'
import { recommend, takeaways, temperatureChange, type ClimateVariable, type RotationData } from '@/core'
import ROTATIONS from '@/data/rotations.json'
import { useClimate } from '@/hooks/useClimate'
import { cx, formatCoords } from '@/lib'
import { useSession } from '@/state/session'

const DATA = ROTATIONS as unknown as RotationData

const CHART_SUMMARY: Record<ClimateVariable, string> = {
  temperature: 'Yearly average air temperature near the ground.',
  precipitation: 'Total rain and snow in each year.',
  soilWetness: 'How wet the soil is where roots grow, yearly average.',
}

const TAKEAWAY_ICON = { temperature: ThermometerSun, precipitation: CloudRain, soilWetness: Droplets, record: Trophy }
const DIRECTION_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus }

export default function ResultsPage() {
  const { field, answers, reset } = useSession()
  const navigate = useNavigate()
  const { data: climate, status, retry } = useClimate(field)
  const [whatIf, setWhatIf] = useState(false)
  const [activeCard, setActiveCard] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)

  const rec = useMemo(() => recommend(answers, climate, DATA), [answers, climate])
  const points = useMemo(() => (climate ? takeaways(climate) : []), [climate])
  const cards = useMemo(() => [rec.current, ...rec.plans], [rec])

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
          Place a pin on the map first. Then we can show the climate and a plan for your field.
        </EmptyState>
      </Container>
    )
  }

  const scrollToCard = (i: number) => {
    const card = railRef.current?.children[i] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const t = climate?.series.temperature.points ?? []
  const p = climate?.series.precipitation.points ?? []
  const change = climate ? temperatureChange(climate) : null
  const tChange = change?.trend ?? 0
  const pMean = p.length ? p.reduce((s, x) => s + x.value, 0) / p.length : 0
  const climateReady = status === 'ready' || status === 'cached'

  return (
    <>
      {/* ---------- Your plan ---------- */}
      <Container className="pt-6 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent-text">Your plan</p>
            <h1 className="mt-1 text-3xl sm:text-4xl">What to do on your field</h1>
            <p className="mt-2 flex items-center gap-2 text-text-muted">
              <MapPin size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
              <span className="tabular-nums">{formatCoords(field.lat, field.lon)}</span>
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" iconLeft={<Printer size={18} />} onClick={() => window.print()}>
              Save or print
            </Button>
          </div>
        </div>

        <section id="recommendation" aria-labelledby="rec-title" className="mt-6 scroll-mt-32">
          <div>
            <div className="gradient-border rounded-card bg-surface p-5 shadow-card sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge type="answers" />
                <Badge type="guidance" />
                {climateReady && <Badge type="historical" />}
              </div>
              <h2 id="rec-title" className="mt-4 max-w-3xl text-2xl leading-snug sm:text-3xl">
                {rec.headline}
              </h2>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">What to do</h3>
              <ol className="mt-3 grid gap-3 md:grid-cols-3">
                {rec.steps.map((step, i) => (
                  <li key={step.label} className="relative rounded-control border border-border bg-bg-2 p-4">
                    <div className="flex items-center gap-2">
                      <span className="neon-chip inline-flex h-7 w-7 items-center justify-center rounded-pill font-display text-sm font-bold text-on-accent">
                        {i + 1}
                      </span>
                      <span className="font-display font-semibold text-heading">{step.label}</span>
                    </div>
                    <p className="mt-2 text-text">{step.text}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-control border border-border p-4">
                  <Gauge size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                  <div>
                    <p className="font-bold text-text">
                      Confidence:{' '}
                      <span className={cx(rec.confidence === 'High' ? 'text-better' : rec.confidence === 'Low' ? 'text-worse' : 'text-text')}>
                        {rec.confidence}
                      </span>
                    </p>
                    <p className="text-text-muted">{rec.confidenceReason}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-control border border-border p-4">
                  <Stethoscope size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                  <div>
                    <p className="font-bold text-text">Check with a local agronomist before deciding</p>
                    <p className="text-text-muted">
                      This plan uses general <Term id="rotation">rotation</Term> guidance and regional climate, not a test of your soil.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What the farmer entered */}
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge type="answers" />
            <Link to="/questions" className="inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4 print:hidden">
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
      </Container>

      {/* ---------- Climate ---------- */}
      <section id="climate" aria-labelledby="climate-title" className="scroll-mt-32 pt-section">
        <Container>
          <SectionHeading id="climate-title" eyebrow="Climate · NASA POWER" title="What changed in 40 years">
            Records for the area around your field, {t[0]?.year ?? 1986}–{t[t.length - 1]?.year ?? 2025}. This is regional climate (a grid of about
            50 km), not a measurement of your exact field.
          </SectionHeading>

          {climateReady && climate && (
            <Reveal>
              <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-card border border-border bg-surface p-4">
                    <p className="text-sm text-text-muted">Temperature change</p>
                    <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-data-temp">
                      <CountUp value={tChange} decimals={1} prefix={tChange > 0 ? '+' : ''} suffix=" °C" />
                    </p>
                    <p className="text-sm text-text-muted">
                      along the 40-year trend line
                      {change && (
                        <>
                          {' '}
                          ({change.decades > 0 ? '+' : '−'}
                          {Math.abs(change.decades).toFixed(2)} °C, {change.firstSpan} vs {change.lastSpan} average)
                        </>
                      )}
                    </p>
                  </div>
                  <div className="rounded-card border border-border bg-surface p-4">
                    <p className="text-sm text-text-muted">Average rain and snow</p>
                    <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-data-precip">
                      <CountUp value={pMean} suffix=" mm" />
                    </p>
                    <p className="text-sm text-text-muted">per year</p>
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg">In plain words</h3>
                    <Badge type="historical" />
                  </div>
                  <ul className="mt-3 space-y-3">
                    {points.map((tk) => {
                      const Icon = TAKEAWAY_ICON[tk.variable]
                      const Dir = DIRECTION_ICON[tk.direction]
                      return (
                        <li key={tk.variable} className="flex gap-3">
                          <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                          <span className="flex-1 text-text">{tk.text}</span>
                          <Dir size={18} aria-hidden="true" className="mt-1 shrink-0 text-text-muted" />
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </Reveal>
          )}

          {status === 'cached' && climate?.cachedFrom && (
            <p className="mb-4 text-sm text-text-muted">Showing saved NASA POWER data for {climate.cachedFrom}, which is in the same NASA grid cell.</p>
          )}

          <div className="mb-5 flex flex-col gap-2 rounded-card border border-dashed border-border-strong bg-surface p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div>
              <Switch checked={whatIf} onChange={setWhatIf} label="What if it were 2 °C warmer?" />
              <p className="text-sm text-text-muted">Adds a dotted line 2 °C above the temperature trend. It is a picture of a possibility, not a forecast.</p>
            </div>
            <Badge type="hypothetical">Hypothetical</Badge>
          </div>

          <ul className="grid gap-4 lg:grid-cols-3">
            {(['temperature', 'precipitation', 'soilWetness'] as const).map((variable, i) => (
              <li key={variable} className="min-w-0">
                <Reveal delay={i * 0.06} className="h-full">
                  <ChartCard
                    variable={variable}
                    status={status}
                    points={climate?.series[variable].points ?? []}
                    trend={climate?.trends[variable]}
                    summary={CHART_SUMMARY[variable]}
                    scenario={whatIf && variable === 'temperature' ? { label: '+2 °C (hypothetical)', offset: 2 } : undefined}
                    onRetry={retry}
                  />
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---------- Compare plans ---------- */}
      <Section labelledBy="plans-title">
        <SectionHeading id="plans-title" eyebrow="Compare" title="Your current rotation vs 3 alternatives">
          Arrows show if a plan is better, the same or worse than what you grow now. These are general guidance levels, not
          measured yields or prices.
        </SectionHeading>
        <p className="mb-3 text-sm text-text-muted lg:hidden" aria-hidden="true">
          Swipe to see all 4
        </p>
      </Section>

      <div className="mx-auto w-full max-w-content">
        <div
          ref={railRef}
          role="group"
          aria-label="Rotation plans"
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--space-gutter)] px-gutter pb-4 pt-1 lg:grid lg:grid-cols-2 lg:overflow-visible"
        >
          {cards.map((plan) => (
            <div key={plan.id} className="w-[86%] max-w-sm shrink-0 snap-center lg:w-auto lg:max-w-none">
              <RotationCard plan={plan} best={plan.id === rec.best.id} assumed={plan.id === 'current' && rec.currentAssumed} />
            </div>
          ))}
        </div>

        <div className="mt-1 flex justify-center gap-1 lg:hidden print:hidden">
          {cards.map((plan, i) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => scrollToCard(i)}
              aria-label={`Show ${PLANS[plan.id].title}`}
              aria-current={activeCard === i}
              className="inline-flex h-11 w-11 items-center justify-center"
            >
              <span className={cx('h-2.5 rounded-pill transition-all duration-base ease-token', activeCard === i ? 'w-7 bg-selected' : 'w-2.5 bg-border-strong')} />
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Labels ---------- */}
      <Section labelledBy="labels-title">
        <Card padding="lg">
          <h2 id="labels-title" className="text-xl">
            How to read the labels
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt><Badge type="historical" /></dt>
              <dd className="mt-1.5 text-text-muted">Climate records from NASA POWER for your area. The only source of numbers in this app.</dd>
            </div>
            <div>
              <dt><Badge type="answers" /></dt>
              <dd className="mt-1.5 text-text-muted">What you told us about your field.</dd>
            </div>
            <div>
              <dt><Badge type="guidance" /></dt>
              <dd className="mt-1.5 text-text-muted">
                General crop rotation knowledge (for example, that a <Term id="legume">legume</Term> adds nitrogen). Not calculated from NASA data.
              </dd>
            </div>
            <div>
              <dt><Badge type="hypothetical" /></dt>
              <dd className="mt-1.5 text-text-muted">A "what if" picture. Not a forecast.</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row print:hidden">
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
            <Button to="/about" variant="ghost" iconLeft={<CircleCheck size={18} />}>
              Sources and limits
            </Button>
          </div>
        </Card>
      </Section>
    </>
  )
}
