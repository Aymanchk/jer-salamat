import {
  ArrowRight,
  BookOpen,
  CircleCheck,
  CloudRain,
  Droplets,
  Gauge,
  MapPinOff,
  Minus,
  Pencil,
  Printer,
  RotateCcw,
  Satellite,
  Stethoscope,
  Tag,
  ThermometerSun,
  TriangleAlert,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { RotationWheel } from '@/components/fx/RotationWheel'
import { SectionTitle } from '@/components/fx/SectionTitle'
import { SproutRow } from '@/components/fx/SproutRow'
import { Container } from '@/components/layout/Page'
import { ChartCard } from '@/components/results/ChartCard'
import { RotationCard } from '@/components/results/RotationCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AccordionItem } from '@/components/ui/Accordion'
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
const EASE = [0.16, 1, 0.3, 1] as const

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
            effect === 'plan' || effect === 'matched' ? 'font-bold text-accent-text' : effect === 'unanswered' ? 'text-worse' : 'text-text-muted',
          )}
        >
          ({t(`yours.${effect}`)})
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

  const best = rec.best
  const waterRisk = best.id === 'soil-health' && (answers.waterLimited === 'sometimes' || answers.waterLimited === 'often')

  return (
    <>
      {/* ---------- Your plan: the best fit, as a turning wheel ---------- */}
      <section id="recommendation" aria-labelledby="rec-title" className="relative scroll-mt-32 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-pill bg-accent-soft opacity-60 blur-3xl" />
        <Container className="relative grid items-center gap-8 pt-8 sm:pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <m.p
              className="inline-flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <span className="live-dot" aria-hidden="true" />
              {t('results.eyebrow')}
              <span className="text-text-muted normal-case tracking-normal">· {formatCoords(field.lat, field.lon, num, lang)}</span>
            </m.p>
            <h1 id="rec-title" className="mt-3 text-[2.5rem] leading-[1.02] sm:text-6xl">
              <span className="block overflow-hidden pb-[0.1em]">
                <m.span className="block" initial={{ y: '70%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: EASE }}>
                  {t('results.title')}
                </m.span>
              </span>
              <span className="block overflow-hidden pb-[0.1em]">
                <m.span className="block text-accent-text" initial={{ y: '70%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.12, ease: EASE }}>
                  {t(`plan.${best.id}.title`)}.
                </m.span>
              </span>
            </h1>
            <m.p className="mt-4 max-w-xl text-lg text-text" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }}>
              {tm(rec.headline)}
            </m.p>

            <m.div className="mt-5 flex flex-wrap items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm font-bold">
                <Gauge size={16} aria-hidden="true" className="text-accent-text" />
                {t('conf.label')}:{' '}
                <span className={cx(rec.confidence === 'high' ? 'text-better' : rec.confidence === 'low' ? 'text-worse' : 'text-text')}>{t(`conf.${rec.confidence}`)}</span>
              </span>
              <Badge type="answers" />
              {climateReady && <Badge type="historical" />}
            </m.div>

            {waterRisk && (
              <p className="mt-4 flex items-start gap-2 rounded-control border border-worse bg-bg-2 p-3 text-sm font-semibold text-text">
                <TriangleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-worse" />
                <span>{t('limit.sh.alfalfaWaterSupply')}</span>
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2 print:hidden">
              <Button to="/questions" variant="outline" iconLeft={<Pencil size={18} />}>
                {t('results.changeAnswers')}
              </Button>
              <Button variant="ghost" iconLeft={<Printer size={18} />} onClick={() => window.print()}>
                {t('results.print')}
              </Button>
            </div>
          </div>

          <m.div initial={{ opacity: 0, scale: 0.85, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.4, delay: 0.2, ease: EASE }}>
            <RotationWheel sequence={best.sequence} size={400} />
          </m.div>
        </Container>
      </section>

      {/* ---------- Three steps to start ---------- */}
      <Container className="pt-section">
        <SectionTitle line1={t('results.whatToDo')} line2={t('results.whatToDo2')} />
        <ol className="relative mt-8 grid gap-4 md:grid-cols-3">
          <m.span
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-8 hidden h-0.5 origin-left bg-accent-text md:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.6, delay: 0.3, ease: 'easeInOut' }}
          />
          {rec.steps.map((step, i) => (
            <m.li
              key={step.label.key}
              className="relative flex flex-col rounded-card border border-border bg-surface p-5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.25, ease: EASE }}
            >
              <span className="neon-chip relative inline-flex h-11 w-11 items-center justify-center rounded-pill font-display text-lg font-bold text-on-accent">{i + 1}</span>
              <p className="mt-4 font-display text-xl font-semibold text-heading">{tm(step.label)}</p>
              <p className="mt-2 flex-1 text-text">{tm(step.text)}</p>
              <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
                {step.basis.map((b) => (
                  <Badge key={b} type={BASIS_BADGE[b]}>
                    {t(`basis.${b}`)}
                  </Badge>
                ))}
              </p>
            </m.li>
          ))}
        </ol>

        {/* Everything behind the plan, folded away until asked for. */}
        <div className="mt-6 rounded-card border border-border bg-surface px-5 py-1">
          <AccordionItem title={t('yours.title')} icon={Users}>
            <p>{t('yours.text')}</p>
            <ul className="mt-2 divide-y divide-border">
              {rec.drivers.map((d) => (
                <DriverRow key={d.id} driver={d} value={answers[d.id]} />
              ))}
            </ul>
            <p className="mt-3 text-text">
              <span className="font-bold">{t('yours.shared')}: </span>
              {t('yours.sharedText')}
            </p>
          </AccordionItem>
          <AccordionItem title={t('results.nasaFactorsTitle')} icon={Satellite}>
            <ul className="list-disc space-y-1.5 pl-4">
              {rec.nasaFactors.map((f) => (
                <li key={f.key}>{tm(f)}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title={t('results.assumptionsTitle')} icon={BookOpen}>
            <ul className="list-disc space-y-1.5 pl-4">
              {rec.assumptions.map((f) => (
                <li key={f.key}>{tm(f)}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title={t('results.agronomist')} icon={Stethoscope}>
            <p>{t('results.agronomistText')}</p>
            <p className="mt-2">
              {t('conf.label')}: {t(`conf.${rec.confidence}`)}. {tm(rec.confidenceReason)}
            </p>
          </AccordionItem>
        </div>
      </Container>

      {/* ---------- Climate ---------- */}
      <section id="climate" aria-labelledby="climate-title" className="scroll-mt-32 pt-section">
        <Container>
          <SectionTitle id="climate-title" eyebrow={t('climate.eyebrow')} line1={t('climate.title1')} line2={t('climate.title2')}>
            {t('climate.text', { first, last })}
          </SectionTitle>

          {climateReady && climate && (
            <div className="mb-6 mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Reveal className="rounded-card border border-border bg-surface p-5">
                  <p className="text-sm text-text-muted">{t('climate.tempChange')}</p>
                  <p className="mt-1 font-display text-5xl font-semibold tabular-nums text-data-temp">
                    <CountUp value={change?.trend ?? 0} decimals={1} prefix={(change?.trend ?? 0) > 0 ? '+' : ''} suffix=" °C" />
                  </p>
                  {change && (
                    <p className="text-sm text-text-muted">
                      {t('climate.tempMethod', { decades: { n: change.decades, d: 2, sign: true }, first: change.firstSpan, last: change.lastSpan })}
                    </p>
                  )}
                </Reveal>
                <Reveal delay={0.1} className="rounded-card border border-border bg-surface p-5">
                  <p className="text-sm text-text-muted">{t('climate.avgRain')}</p>
                  <p className="mt-1 font-display text-5xl font-semibold tabular-nums text-data-precip">
                    <CountUp value={pMean} suffix=" mm" />
                  </p>
                  <p className="text-sm text-text-muted">{t('climate.perYear')}</p>
                </Reveal>
              </div>
              <Reveal delay={0.15} className="rounded-card border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg">{t('climate.plainWords')}</h3>
                  <Badge type="historical" />
                </div>
                <ul className="mt-3 space-y-3">
                  {points.map((tk, i) => {
                    const Icon = TAKEAWAY_ICON[tk.variable]
                    const Dir = DIRECTION_ICON[tk.direction]
                    return (
                      <m.li
                        key={tk.variable}
                        className="flex gap-3"
                        initial={{ opacity: 0, x: -14 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.15, ease: EASE }}
                      >
                        <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                        <span className="flex-1 text-text">{tm(tk.msg)}</span>
                        {tk.variable !== 'record' && <Dir size={18} aria-hidden="true" className="mt-1 shrink-0 text-text-muted" />}
                      </m.li>
                    )
                  })}
                </ul>
              </Reveal>
            </div>
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
                <Reveal delay={i * 0.12} className="h-full">
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
      <Container className="pt-section">
        <SectionTitle
          id="plans-title"
          eyebrow={t('compare.eyebrow')}
          line1={rec.currentIsReference ? t('compare.titleRef1') : t('compare.title1')}
          line2={t('compare.title2')}
        >
          {t('compare.text')}
        </SectionTitle>
        <p className="mb-3 mt-4 text-sm text-text-muted lg:hidden" aria-hidden="true">
          {t('compare.swipe')}
        </p>
      </Container>

      <div className="mx-auto mt-6 w-full max-w-content">
        <div
          ref={railRef}
          role="group"
          aria-label={t('compare.group')}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--space-gutter)] px-gutter pb-4 pt-1 lg:grid lg:grid-cols-2 lg:overflow-visible"
        >
          {cards.map((plan, i) => (
            <m.div
              key={plan.id}
              className="w-[88%] max-w-sm shrink-0 snap-center lg:w-auto lg:max-w-none"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, delay: (i % 2) * 0.15, ease: EASE }}
            >
              <RotationCard plan={plan} best={plan.id === rec.best.id} comparedToReference={rec.currentIsReference} />
            </m.div>
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

      {/* ---------- Labels and next steps ---------- */}
      <Container className="pt-section">
        <div className="rounded-card border border-border bg-surface px-5 py-1">
          <AccordionItem title={t('labels.title')} icon={Tag}>
            <dl className="grid gap-4 sm:grid-cols-2">
              {(['historical', 'answers', 'guidance', 'hypothetical'] as const).map((type) => (
                <div key={type}>
                  <dt>
                    <Badge type={type} />
                  </dt>
                  <dd className="mt-1.5">
                    {t(`labels.${type}`)} {type === 'guidance' && <Term id="nitrogenFixation" />}
                  </dd>
                </div>
              ))}
            </dl>
          </AccordionItem>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
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
      </Container>
      <SproutRow className="mt-section h-24 sm:h-32 lg:h-44" count={22} />
    </>
  )
}
