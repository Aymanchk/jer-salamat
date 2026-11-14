import {
  ArrowRight,
  CircleCheck,
  CloudRain,
  Droplets,
  Gauge,
  MapPin,
  MapPinOff,
  Minus,
  Pencil,
  Printer,
  RotateCcw,
  Satellite,
  Stethoscope,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Container, Section, SectionHeading } from '@/components/layout/Page'
import { ChartCard } from '@/components/results/ChartCard'
import { RotationCard } from '@/components/results/RotationCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CountUp } from '@/components/ui/CountUp'
import { Reveal } from '@/components/ui/Reveal'
import { EmptyState } from '@/components/ui/States'
import { Switch } from '@/components/ui/Switch'
import { Term } from '@/components/ui/Term'
import { answerLabel } from '@/content/questions'
import { recommend, takeaways, temperatureChange, type Basis, type ClimateData, type ClimateVariable, type Driver, type RotationData } from '@/core'
import ROTATIONS from '@/data/rotations.json'
import { useClimate } from '@/hooks/useClimate'
import { useT, type TFunc } from '@/i18n'
import { cx, formatCoords } from '@/lib'
import { useSession } from '@/state/session'

const DATA = ROTATIONS as unknown as RotationData

const TAKEAWAY_ICON = { temperature: ThermometerSun, precipitation: CloudRain, soilWetness: Droplets, record: Trophy }
const DIRECTION_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus }
const BASIS_BADGE: Record<Basis, 'answers' | 'historical' | 'guidance'> = { answers: 'answers', nasa: 'historical', guidance: 'guidance' }

/** One plain sentence above each chart: what the trend means for crops. */
function conclusionFor(variable: ClimateVariable, climate: ClimateData | null, t: TFunc): string | undefined {
  if (!climate) return undefined
  const tr = climate.trends[variable]
  if (variable === 'temperature') return tr.significant && tr.slopePerDecade > 0 ? t('concl.temp.up') : t('concl.temp.flat')
  if (variable === 'precipitation') return t('concl.precip')
  if (!tr.significant) return t('concl.soil.flat')
  return tr.slopePerDecade < 0 ? t('concl.soil.down') : t('concl.soil.up')
}

function DriverRow({ driver, value }: { driver: Driver; value: string | undefined }) {
  const { t } = useT()
  const effect = driver.effect
  return (
    <li className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="font-bold text-text sm:w-40 sm:shrink-0">{t(`q.${driver.id}.short`)}</span>
      <span className="min-w-0 flex-1">
        <span className="text-text">{answerLabel(t, driver.id, value) ?? t('q.notAnswered')}</span>
        <span
          className={cx(
            'ml-2 text-sm',
            effect === 'plan' ? 'font-bold text-accent-text' : effect === 'unanswered' ? 'text-worse' : 'text-text-muted',
          )}
        >
          — {t(`yours.${effect}`)}
        </span>
      </span>
    </li>
  )
}

export default function ResultsPage() {
  const { field, answers, reset } = useSession()
  const { t, tm, num, lang } = useT()
  const navigate = useNavigate()
  const { data: climate, status, retry } = useClimate(field)
  const [whatIf, setWhatIf] = useState(false)
  const [activeCard, setActiveCard] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)

  const rec = useMemo(() => recommend(answers, climate, DATA), [answers, climate])
  const points = useMemo(() => (climate ? takeaways(climate) : []), [climate])
  const cards = [rec.current, ...rec.plans]

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
          headingLevel="h1"
          icon={MapPinOff}
          title={t('state.noField')}
          action={
            <Button to="/field" iconRight={<ArrowRight size={20} />}>
              {t('state.pickField')}
            </Button>
          }
        >
          {t('state.noFieldBody')}
        </EmptyState>
      </Container>
    )
  }

  const scrollToCard = (i: number) => {
    const card = railRef.current?.children[i] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const tp = climate?.series.temperature.points ?? []
  const pp = climate?.series.precipitation.points ?? []
  const change = climate ? temperatureChange(climate) : null
  const pMean = pp.length ? pp.reduce((s, x) => s + x.value, 0) / pp.length : 0
  const climateReady = status === 'ready' || status === 'cached'
  const first = String(tp[0]?.year ?? 1986)
  const last = String(tp[tp.length - 1]?.year ?? 2025)

  return (
    <>
      {/* ---------- Your plan ---------- */}
      <Container className="pt-6 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent-text">{t('results.eyebrow')}</p>
            <h1 className="mt-1 text-3xl sm:text-4xl">{t('results.title')}</h1>
            <p className="mt-2 flex items-center gap-2 text-text-muted">
              <MapPin size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
              <span className="tabular-nums">{formatCoords(field.lat, field.lon, num, lang)}</span>
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" iconLeft={<Printer size={18} />} onClick={() => window.print()}>
              {t('results.print')}
            </Button>
          </div>
        </div>

        <section id="recommendation" aria-labelledby="rec-title" className="mt-6 scroll-mt-32">
          <div className="gradient-border rounded-card bg-surface p-5 shadow-card sm:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge type="answers" />
              <Badge type="guidance" />
              {climateReady && <Badge type="historical" />}
            </div>
            <h2 id="rec-title" className="mt-4 max-w-3xl text-2xl leading-snug sm:text-3xl">
              {tm(rec.headline)}
            </h2>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-text-muted">{t('results.whatToDo')}</h3>
            <ol className="mt-3 grid gap-3 md:grid-cols-3">
              {rec.steps.map((step, i) => (
                <li key={step.label.key} className="relative flex flex-col rounded-control border border-border bg-bg-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="neon-chip inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill font-display text-sm font-bold text-on-accent">
                      {i + 1}
                    </span>
                    <span className="font-display font-semibold text-heading">{tm(step.label)}</span>
                  </div>
                  <p className="mt-2 flex-1 text-text">{tm(step.text)}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
                    <span>{t('results.basedOn')}</span>
                    {step.basis.map((b) => (
                      <Badge key={b} type={BASIS_BADGE[b]}>
                        {t(`basis.${b}`)}
                      </Badge>
                    ))}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-control border border-border p-4">
                <Gauge size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                <div>
                  <p className="font-bold text-text">
                    {t('conf.label')}:{' '}
                    <span className={cx(rec.confidence === 'high' ? 'text-better' : rec.confidence === 'low' ? 'text-worse' : 'text-text')}>
                      {t(`conf.${rec.confidence}`)}
                    </span>
                  </p>
                  <p className="text-text-muted">{tm(rec.confidenceReason)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-control border border-border p-4">
                <Stethoscope size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                <div>
                  <p className="font-bold text-text">{t('results.agronomist')}</p>
                  <p className="text-text-muted">{t('results.agronomistText')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What makes your plan yours: which answers changed it, what is shared regional climate. */}
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl">{t('yours.title')}</h2>
            <Link to="/questions" className="inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4 print:hidden">
              <Pencil size={16} aria-hidden="true" />
              {t('results.changeAnswers')}
            </Link>
          </div>
          <p className="mt-1 text-text-muted">{t('yours.text')}</p>
          <ul className="mt-2 divide-y divide-border">
            {rec.drivers.map((d) => (
              <DriverRow key={d.id} driver={d} value={answers[d.id]} />
            ))}
          </ul>
          <div className="mt-3 flex items-start gap-3 rounded-control bg-surface-muted p-3">
            <Users size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            <p className="text-text">
              <span className="font-bold">{t('yours.shared')}: </span>
              {t('yours.sharedText')}
            </p>
          </div>
        </Card>
      </Container>

      {/* ---------- Climate ---------- */}
      <section id="climate" aria-labelledby="climate-title" className="scroll-mt-32 pt-section">
        <Container>
          <SectionHeading id="climate-title" eyebrow={t('climate.eyebrow')} title={t('climate.title')}>
            {t('climate.text', { first, last })}
          </SectionHeading>

          {climateReady && climate && (
            <Reveal>
              <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-card border border-border bg-surface p-4">
                    <p className="text-sm text-text-muted">{t('climate.tempChange')}</p>
                    <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-data-temp">
                      <CountUp value={change?.trend ?? 0} decimals={1} prefix={(change?.trend ?? 0) > 0 ? '+' : ''} suffix=" °C" />
                    </p>
                    {change && (
                      <p className="text-sm text-text-muted">
                        {t('climate.tempMethod', { decades: { n: change.decades, d: 2, sign: true }, first: change.firstSpan, last: change.lastSpan })}
                      </p>
                    )}
                  </div>
                  <div className="rounded-card border border-border bg-surface p-4">
                    <p className="text-sm text-text-muted">{t('climate.avgRain')}</p>
                    <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-data-precip">
                      <CountUp value={pMean} suffix=" mm" />
                    </p>
                    <p className="text-sm text-text-muted">{t('climate.perYear')}</p>
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg">{t('climate.plainWords')}</h3>
                    <Badge type="historical" />
                  </div>
                  <ul className="mt-3 space-y-3">
                    {points.map((tk) => {
                      const Icon = TAKEAWAY_ICON[tk.variable]
                      const Dir = DIRECTION_ICON[tk.direction]
                      return (
                        <li key={tk.variable} className="flex gap-3">
                          <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                          <span className="flex-1 text-text">{tm(tk.msg)}</span>
                          {tk.variable !== 'record' && <Dir size={18} aria-hidden="true" className="mt-1 shrink-0 text-text-muted" />}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </Reveal>
          )}

          {status === 'cached' && climate?.cachedFrom && (
            <p className="mb-4 flex items-start gap-2 text-sm text-text-muted">
              <Satellite size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              {t('climate.cached', { name: climate.cachedFrom })}
            </p>
          )}

          <div className="mb-5 flex flex-col gap-2 rounded-card border border-dashed border-border-strong bg-surface p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div>
              <Switch checked={whatIf} onChange={setWhatIf} label={t('whatif.label')} />
              <p className="text-sm text-text-muted">{t('whatif.text')}</p>
            </div>
            <Badge type="hypothetical">{t('whatif.badge')}</Badge>
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
                    summary={t(`chart.${variable}.summary`)}
                    conclusion={conclusionFor(variable, climate, t)}
                    scenario={whatIf && variable === 'temperature' ? { label: t('whatif.line'), offset: 2 } : undefined}
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
        <SectionHeading id="plans-title" eyebrow={t('compare.eyebrow')} title={rec.currentIsReference ? t('compare.titleRef') : t('compare.title')}>
          {t('compare.text')}
        </SectionHeading>
        <p className="mb-3 text-sm text-text-muted lg:hidden" aria-hidden="true">
          {t('compare.swipe')}
        </p>
      </Section>

      <div className="mx-auto w-full max-w-content">
        <div
          ref={railRef}
          role="group"
          aria-label={t('compare.group')}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--space-gutter)] px-gutter pb-4 pt-1 lg:grid lg:grid-cols-2 lg:overflow-visible"
        >
          {cards.map((plan) => (
            <div key={plan.id} className="w-[88%] max-w-sm shrink-0 snap-center lg:w-auto lg:max-w-none">
              <RotationCard plan={plan} best={plan.id === rec.best.id} comparedToReference={rec.currentIsReference} />
            </div>
          ))}
        </div>

        <div className="mt-1 flex justify-center gap-1 lg:hidden print:hidden">
          {cards.map((plan, i) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => scrollToCard(i)}
              aria-label={t('compare.show', { name: t(`plan.${plan.id}.title`) })}
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
            {t('labels.title')}
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt>
                <Badge type="historical" />
              </dt>
              <dd className="mt-1.5 text-text-muted">{t('labels.historical')}</dd>
            </div>
            <div>
              <dt>
                <Badge type="answers" />
              </dt>
              <dd className="mt-1.5 text-text-muted">{t('labels.answers')}</dd>
            </div>
            <div>
              <dt>
                <Badge type="guidance" />
              </dt>
              <dd className="mt-1.5 text-text-muted">
                {t('labels.guidance')} <Term id="nitrogenFixation" />
              </dd>
            </div>
            <div>
              <dt>
                <Badge type="hypothetical" />
              </dt>
              <dd className="mt-1.5 text-text-muted">{t('labels.hypothetical')}</dd>
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
              {t('results.another')}
            </Button>
            <Button to="/about" variant="ghost" iconLeft={<CircleCheck size={18} />}>
              {t('results.sources')}
            </Button>
          </div>
        </Card>
      </Section>
    </>
  )
}
