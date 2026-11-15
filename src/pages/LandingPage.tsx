import { ArrowDown, ArrowRight, ChartLine, Check, ClipboardList, MapPin, Satellite, Search, Sprout, Star, type LucideIcon } from 'lucide-react'
import { AnimatePresence, m, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AerialFields } from '@/components/fx/AerialFields'
import { RotationWheel } from '@/components/fx/RotationWheel'
import { SectionTitle } from '@/components/fx/SectionTitle'
import { SproutRow } from '@/components/fx/SproutRow'
import { Container } from '@/components/layout/Page'
import { ValleyStats } from '@/components/landing/ValleyStats'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CountUp } from '@/components/ui/CountUp'
import { CropIcon } from '@/components/ui/CropIcon'
import { Reveal } from '@/components/ui/Reveal'
import type { CropId } from '@/core'
import { useCanRender3D } from '@/hooks/useDeviceCapability'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSokuluk } from '@/hooks/useSokuluk'
import { useT } from '@/i18n'
import { cx } from '@/lib'

// three.js is only downloaded on devices that can run it.
const OrbitScene = lazy(() => import('@/components/earth/OrbitScene'))


/** Headline lines slide up one by one (fast: readable in well under 2 seconds). */
function Lines({ lines, className }: { lines: ReactNode[]; className?: string }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <m.span
            className={cx('block', className)}
            initial={{ y: '70%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </m.span>
        </span>
      ))}
    </>
  )
}

function HeroCopy({ onHow }: { onHow: () => void }) {
  const { t } = useT()
  return (
    <>
      <p className="mb-4 inline-flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">
        <Satellite size={16} aria-hidden="true" />
        {t('landing.eyebrow')}
      </p>
      <h1 id="hero-title" className="text-[2.25rem] leading-[1.02] sm:text-5xl lg:text-6xl">
        <Lines lines={[t('landing.h1.1'), t('landing.h1.2'), t('landing.h1.3')]} />
        <Lines lines={[<span key="k" className="text-accent-text">{t('landing.h1.4')}</span>]} />
      </h1>
      <p className="mt-4 max-w-md text-base text-text-muted sm:mt-5 sm:text-lg">
        {t('landing.sub')}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
        <Button to="/field" size="lg" iconRight={<ArrowRight size={22} />} className="w-full sm:w-auto">
          {t('landing.cta')}
        </Button>
        <Button variant="ghost" size="lg" onClick={onHow} className="w-full sm:w-auto">
          {t('landing.how')}
        </Button>
      </div>
    </>
  )
}

/** A text panel that fades in and out over a part of the scroll story. */
function StoryPanel({
  progress,
  range,
  stay = false,
  children,
  className,
}: {
  progress: MotionValue<number>
  range: [number, number, number, number]
  /** Keep the panel on screen at the end of the story. */
  stay?: boolean
  children: ReactNode
  className?: string
}) {
  const opacity = useTransform(progress, range, [0, 1, 1, stay ? 1 : 0])
  const y = useTransform(progress, range, [24, 0, 0, stay ? 0 : -24])
  const [visible, setVisible] = useState(false)
  useMotionValueEvent(opacity, 'change', (v) => setVisible(v > 0.05))
  return (
    <m.div style={{ opacity, y }} aria-hidden={!visible} inert={!visible} className={cx('absolute', !visible && 'pointer-events-none', className)}>
      {children}
    </m.div>
  )
}

const CHAPTERS = [
  { at: 0, label: 'landing.ch.orbit' },
  { at: 0.28, label: 'landing.ch.kg' },
  { at: 0.68, label: 'landing.ch.valley' },
]

/** Scenes 1–2: orbit → descent → valley, on one sticky 3D canvas. */
function OrbitStory({ onHow }: { onHow: () => void }) {
  const { t } = useT()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const wide = useMediaQuery('(min-width: 1024px)')
  const [load3D, setLoad3D] = useState(false)
  const [ready, setReady] = useState(false)
  const [slow, setSlow] = useState(false)
  const [active, setActive] = useState(true)
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')
  const [heroVisible, setHeroVisible] = useState(true)

  // Stop rendering in a background tab.
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])
  const [chapter, setChapter] = useState(0)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18, 0.28], [1, 1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.28], [0, -32])
  const cueOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0])
  const rail = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useMotionValueEvent(heroOpacity, 'change', (v) => setHeroVisible(v > 0.05))
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setChapter(p >= CHAPTERS[2].at ? 2 : p >= CHAPTERS[1].at ? 1 : 0)
  })

  // Start the 3D download once the page is idle, so it never delays the headline.
  useEffect(() => {
    const start = () => setLoad3D(true)
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(start, { timeout: 1200 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(start, 600)
    return () => clearTimeout(id)
  }, [])

  // Pause rendering when the story is off screen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} aria-labelledby="hero-title" data-theme="dark" className="relative -mt-header h-[230vh] bg-bg text-text lg:h-[340vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Static globe until the 3D one is ready (slow phones, background tabs), so the scene is never empty. */}
        {!ready && (
          <img
            src="/globe-fallback.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[calc(var(--size-header)+0.5rem)] aspect-square w-[min(62vw,30vh)] -translate-x-1/2 opacity-90 lg:left-auto lg:right-[6%] lg:top-1/2 lg:w-[min(40vw,70vh)] lg:-translate-x-0 lg:-translate-y-1/2"
          />
        )}

        {/* 3D Earth */}
        <div aria-hidden="true" className={cx('pointer-events-none absolute inset-0 transition-opacity duration-slow', ready ? 'opacity-100' : 'opacity-0')}>
          {load3D && !slow && (
            <Suspense fallback={null}>
              <OrbitScene
                progress={scrollYProgress}
                active={active && !hidden}
                wide={wide}
                onReady={() => setReady(true)}
                onSlow={() => {
                  setSlow(true)
                  setReady(false)
                }}
              />
            </Suspense>
          )}
        </div>

        {/* Scrims keep text off the busy globe while leaving the upper globe/border window clear on mobile. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-bg)_0%,color-mix(in_srgb,var(--color-bg)_85%,transparent)_30%,transparent_62%)] max-lg:hidden" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--color-bg)_0%,var(--color-bg)_44%,color-mix(in_srgb,var(--color-bg)_75%,transparent)_52%,transparent_58%)] lg:hidden" />

        <Container className="relative h-full">
          {/* Scene 1: the headline. Visible immediately. */}
          <m.div
            style={{ opacity: heroOpacity, y: heroY }}
            aria-hidden={!heroVisible}
            inert={!heroVisible}
            className={cx(
              'absolute inset-x-gutter bottom-[max(3rem,5vh)] max-w-xl lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2',
              !heroVisible && 'pointer-events-none',
            )}
          >
            <HeroCopy onHow={onHow} />
          </m.div>

          {/* Scene 2: descent */}
          <StoryPanel progress={scrollYProgress} range={[0.24, 0.34, 0.6, 0.68]} className="inset-x-gutter bottom-[max(3rem,8vh)] max-w-md lg:bottom-auto lg:top-[30%]">
            <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">{t('landing.s2.eyebrow')}</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">{t('landing.s2.title')}</h2>
            <p className="mt-3 text-lg text-text-muted">{t('landing.s2.text')}</p>
          </StoryPanel>

          <StoryPanel progress={scrollYProgress} range={[0.64, 0.74, 0.95, 1]} stay className="inset-x-gutter bottom-[max(2.75rem,7vh)] max-w-md lg:bottom-auto lg:top-[26%]">
            <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">{t('landing.s3.eyebrow')}</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">{t('landing.s3.title')}</h2>
            <p className="mt-3 text-lg text-text-muted">
              {t('landing.s3.text')}
            </p>
            <div className="mt-5">
              <Button to="/field" iconRight={<ArrowRight size={20} />}>
                {t('landing.cta')}
              </Button>
            </div>
          </StoryPanel>

          {/* Chapter rail: tells the viewer where they are in the story. */}
          <div aria-hidden="true" className="glass absolute bottom-8 right-gutter hidden items-stretch gap-3 rounded-card border border-glass px-4 py-3 lg:flex">
            <div className="relative w-px bg-border">
              <m.div style={{ height: rail }} className="absolute inset-x-0 top-0 bg-accent shadow-glow-soft" />
            </div>
            <ol className="flex flex-col justify-between gap-3 py-0.5">
              {CHAPTERS.map((c, i) => (
                <li key={c.label} className={cx('font-display text-sm uppercase tracking-[0.14em] transition-colors duration-base', i === chapter ? 'text-accent-text' : 'text-text-muted')}>
                  {t(c.label)}
                </li>
              ))}
            </ol>
          </div>
        </Container>

        <m.p style={{ opacity: cueOpacity }} aria-hidden="true" className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 text-sm text-text-muted">
          <ArrowDown size={16} className="animate-bounce" />
          {t('landing.scroll')}
        </m.p>
      </div>
    </section>
  )
}

/** Shown instead of the 3D story on weak devices, slow connections or reduced motion. */
function StaticHero({ onHow }: { onHow: () => void }) {
  const { t } = useT()
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <Container className="grid items-center gap-6 pt-8 sm:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-16">
        <div className="order-2 lg:order-1">
          <HeroCopy onHow={onHow} />
        </div>
        <div className="relative order-1 mx-auto aspect-square w-full max-w-[16rem] sm:max-w-sm lg:order-2 lg:max-w-[28rem]">
          <div aria-hidden="true" className="globe-atmosphere pointer-events-none absolute -inset-[7%] rounded-pill" />
          <img
            src="/globe-fallback.svg"
            width={480}
            height={480}
            alt={t('landing.globeAlt')}
            fetchPriority="high"
            className="relative h-full w-full"
          />
        </div>
      </Container>
    </section>
  )
}

/* ---------- How it works: four steps, each with a live mini demo ---------- */

const STEP_MS = 5600
const EASE = [0.16, 1, 0.3, 1] as const

function DemoMap() {
  const { t } = useT()
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f2efe9]">
      {/* A stylised map: fields, a river and two roads. */}
      <svg aria-hidden="true" viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 7 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => (
            <m.rect
              key={`${r}-${c}`}
              x={c * 48 - 12}
              y={r * 48 - 10}
              width={42}
              height={42}
              rx={3}
              fill={(r * 7 + c * 3) % 5 === 0 ? '#cfe0b4' : (r + c) % 3 === 0 ? '#ead9a8' : '#dfe6cc'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (r + c) * 0.04, duration: 0.5 }}
            />
          )),
        )}
        <m.path d="M-10 215 C 90 180 140 245 230 205 S 360 150 420 172" stroke="#9cc3e6" strokeWidth={11} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
        <path d="M0 98 L400 120 M150 0 L170 300" stroke="#ffffff" strokeWidth={7} fill="none" />
      </svg>
      <m.div
        className="absolute left-4 right-4 top-4 flex items-center gap-2 rounded-pill bg-white px-4 py-3 text-sm text-[#14201a] shadow-raised"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <Search size={16} aria-hidden="true" className="text-[#55605a]" />
        <m.span initial={{ width: 0 }} animate={{ width: 'auto' }} transition={{ duration: 1.1, delay: 0.5, ease: 'linear' }} className="overflow-hidden whitespace-nowrap">
          {t('how.demo.search')}
        </m.span>
        <span className="h-4 w-px animate-pulse bg-[#14201a]" />
      </m.div>
      <m.div
        className="absolute left-[54%] top-[50%] -translate-x-1/2 -translate-y-full"
        initial={{ y: -120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 13, delay: 1.8 }}
      >
        <MapPin size={46} fill="#2e7d3a" color="#14201a" strokeWidth={1.5} className="drop-shadow-lg" />
      </m.div>
      <m.span
        className="absolute left-[54%] top-[50%] h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-[#2e7d3a]"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 2], opacity: [0.9, 0] }}
        transition={{ duration: 1.6, delay: 2.2, repeat: Infinity, repeatDelay: 0.3 }}
      />
    </div>
  )
}

function DemoQuestion() {
  const { t } = useT()
  const options = ['opt.soilType.light', 'opt.soilType.medium', 'opt.soilType.heavy']
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 p-5 sm:p-8">
      <p className="text-sm text-text-muted">{t('q.counter', { n: '2', total: '5' })}</p>
      <m.p className="font-display text-2xl font-semibold text-heading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
        {t('q.soilType.title')}
      </m.p>
      <div className="mt-2 grid gap-2">
        {options.map((key, i) => (
          <m.div
            key={key}
            className={cx('flex items-center justify-between rounded-control border-2 px-4 py-3 font-bold text-text', i === 1 ? 'demo-pick' : 'border-border')}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.18, ease: EASE }}
          >
            {t(key)}
            {i === 1 && (
              <m.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2, type: 'spring', stiffness: 380, damping: 16 }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-pill bg-accent text-on-accent"
              >
                <Check size={14} strokeWidth={3} aria-hidden="true" />
              </m.span>
            )}
          </m.div>
        ))}
      </div>
    </div>
  )
}

function DemoChart() {
  const { t } = useT()
  const { data } = useSokuluk()
  const pts = data?.series.temperature.points ?? []
  if (pts.length < 2) return <div className="skeleton m-6 h-[70%] w-full" />
  const vals = pts.map((p) => p.value)
  const min = Math.min(...vals) - 0.3
  const max = Math.max(...vals) + 0.3
  const W = 400
  const H = 200
  const x = (i: number) => 12 + (i / (pts.length - 1)) * (W - 24)
  const y = (v: number) => H - 18 - ((v - min) / (max - min)) * (H - 36)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const area = `${d} L${x(pts.length - 1)} ${H} L${x(0)} ${H} Z`
  const n = pts.length
  const mx = (n - 1) / 2
  const my = vals.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  vals.forEach((v, i) => {
    sxy += (i - mx) * (v - my)
    sxx += (i - mx) ** 2
  })
  const slope = sxy / sxx
  const a = my - slope * mx
  return (
    <div className="flex h-full w-full flex-col p-5 sm:p-8">
      <p className="text-sm text-text-muted">{t('how.demo.temp')}</p>
      <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-data-temp">
        <CountUp value={vals.at(-1)!} decimals={1} suffix=" °C" /> <span className="text-base font-medium text-text-muted">{pts.at(-1)!.year}</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto w-full overflow-visible" aria-hidden="true">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={12} x2={W - 12} y1={H * f} y2={H * f} className="stroke-border" strokeWidth={1} />
        ))}
        <m.path d={area} className="fill-data-temp-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }} />
        <m.path d={d} fill="none" className="stroke-data-temp" strokeWidth={2.5} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
        <m.line x1={x(0)} y1={y(a)} x2={x(n - 1)} y2={y(a + slope * (n - 1))} className="stroke-text" strokeWidth={1.5} strokeDasharray="5 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2.2, duration: 1.2 }} />
        <m.circle cx={x(n - 1)} cy={y(vals.at(-1)!)} r={5} className="fill-data-temp" initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ delay: 2.4, duration: 0.6 }} />
      </svg>
    </div>
  )
}

const DEMO_PLAN: CropId[] = ['wheat', 'beans', 'barley', 'wheat']

function DemoPlan() {
  const { t } = useT()
  return (
    <div className="flex h-full w-full flex-col justify-center p-5 sm:p-8">
      <m.span
        className="neon-chip inline-flex w-fit items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-bold text-on-accent"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2.2, type: 'spring', stiffness: 300, damping: 14 }}
      >
        <Star size={14} aria-hidden="true" />
        {t('plan.bestFit')}
      </m.span>
      <p className="mt-3 font-display text-2xl font-semibold text-heading">{t('plan.water-saving.title')}</p>
      <ol className="relative mt-6 grid grid-cols-4 gap-2">
        <m.span
          aria-hidden="true"
          className="absolute left-[12%] right-[12%] top-[2.6rem] h-0.5 origin-left bg-accent-text"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 1.8, ease: 'easeInOut' }}
        />
        {DEMO_PLAN.map((crop, i) => (
          <m.li
            key={i}
            className="relative flex flex-col items-center gap-1"
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.4, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <span className="text-xs text-text-muted">{t('plan.year', { n: String(i + 1) })}</span>
            <CropIcon crop={crop} size="md" />
          </m.li>
        ))}
      </ol>
    </div>
  )
}

const DEMOS = [DemoMap, DemoQuestion, DemoChart, DemoPlan]
const STEP_ICONS: LucideIcon[] = [MapPin, ClipboardList, ChartLine, Sprout]

function HowItWorks() {
  const { t } = useT()
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const [seen, setSeen] = useState(false)
  const ref = useRef<HTMLElement>(null)

  // Only start the cycle once the section is on screen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const auto = !reduced && seen && !paused
  const Demo = DEMOS[step]

  return (
    <section id="how" ref={ref} aria-labelledby="how-title" className="scroll-mt-header pt-section">
      <Container>
        <SectionTitle id="how-title" eyebrow={t('how.eyebrow')} line1={t('how.title1')} line2={t('how.title2')}>
          {t('how.text')}
        </SectionTitle>

        <div
          className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <ol className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((n, i) => {
              const on = i === step
              const Icon = STEP_ICONS[i]
              return (
                <li key={n}>
                  <button
                    type="button"
                    aria-current={on ? 'step' : undefined}
                    onClick={() => setStep(i)}
                    className={cx(
                      'relative w-full overflow-hidden rounded-card border p-4 text-left transition-colors duration-slow sm:p-5',
                      on ? 'border-border-strong bg-surface' : 'border-transparent hover:bg-surface/60',
                    )}
                  >
                    <span className="flex items-center gap-4">
                      <span
                        className={cx(
                          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill transition-colors duration-slow',
                          on ? 'neon-chip text-on-accent' : 'bg-surface-muted text-text-muted',
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={20} />
                      </span>
                      <span className={cx('font-display text-xl font-semibold', on ? 'text-heading' : 'text-text-muted')}>
                        <span className="sr-only">{t('how.step', { n: String(n) })}: </span>
                        {t(`how.${n}.title`)}
                      </span>
                    </span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <m.span
                          className="block overflow-hidden pl-15 text-text-muted"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: EASE }}
                        >
                          <span className="block pt-2">{t(`how.${n}.text`)}</span>
                        </m.span>
                      )}
                    </AnimatePresence>
                    {on && auto && (
                      <span
                        key={`bar-${step}`}
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 h-[3px] bg-accent-text"
                        style={{ animation: `step-progress ${STEP_MS}ms linear forwards` }}
                        onAnimationEnd={() => setStep((s) => (s + 1) % 4)}
                      />
                    )}
                  </button>
                </li>
              )
            })}
            <li className="mt-auto pt-4 max-lg:hidden">
              <Button to="/field" iconRight={<ArrowRight size={20} />}>
                {t('how.cta')}
              </Button>
            </li>
          </ol>

          <div className="relative min-h-[20rem] overflow-hidden rounded-card border border-border bg-surface shadow-raised sm:min-h-[24rem]">
            <AnimatePresence mode="wait">
              <m.div
                key={step}
                className="absolute inset-0 flex"
                initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <Demo />
              </m.div>
            </AnimatePresence>
          </div>
          <div className="lg:hidden">
            <Button to="/field" block iconRight={<ArrowRight size={20} />}>
              {t('how.cta')}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

/** The valley from above: fields trading crops year by year. */
function AerialSection() {
  const { t } = useT()
  return (
    <section aria-labelledby="aerial-title" className="pt-section">
      <Container>
        <SectionTitle id="aerial-title" eyebrow={t('aerial.eyebrow')} line1={t('aerial.title1')} line2={t('aerial.title2')} />
        <AerialFields className="mt-8" />
      </Container>
    </section>
  )
}

/** Why rotate at all: a turning wheel of one real plan from the app. */
function WhyRotate() {
  const { t } = useT()
  const points = ['rotate.p1', 'rotate.p2', 'rotate.p3']
  return (
    <section aria-labelledby="rotate-title" className="pt-section">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionTitle id="rotate-title" eyebrow={t('rotate.eyebrow')} line1={t('rotate.title1')} line2={t('rotate.title2')}>
            {t('rotate.text')}
          </SectionTitle>
          <ul className="mt-6 grid gap-3">
            {points.map((key, i) => (
              <Reveal key={key} delay={0.15 + i * 0.12}>
                <li className="flex items-start gap-3 rounded-card border border-border bg-surface p-4">
                  <span aria-hidden="true" className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-accent-soft font-display text-sm font-bold text-accent-text">
                    {i + 1}
                  </span>
                  <span className="text-text">{t(key)}</span>
                </li>
              </Reveal>
            ))}
          </ul>
          <div className="mt-4">
            <Badge type="guidance" />
          </div>
        </div>
        <div className="relative">
          <div aria-hidden="true" className="globe-atmosphere absolute inset-[8%] rounded-pill opacity-60" />
          <RotationWheel sequence={['alfalfa', 'alfalfa', 'wheat', 'beans']} size={420} />
          <p className="mt-4 text-center text-sm text-text-muted">{t('rotate.caption')}</p>
        </div>
      </Container>
    </section>
  )
}

/** Where the numbers come from. */
function Trust() {
  const { t } = useT()
  const rows = [
    ['historical', 'trust.historical'],
    ['answers', 'trust.answers'],
    ['guidance', 'trust.guidance'],
    ['hypothetical', 'trust.hypothetical'],
  ] as const
  return (
    <section aria-labelledby="trust-title" className="pt-section">
      <Container>
        <SectionTitle id="trust-title" eyebrow={t('trust.eyebrow')} line1={t('trust.title1')} line2={t('trust.title2')}>
          {t('trust.text')}
        </SectionTitle>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map(([type, text], i) => (
            <li key={type}>
              <Reveal delay={i * 0.1} className="lift flex h-full flex-col items-start gap-4 rounded-card border border-border bg-surface p-5">
                <Badge type={type} />
                <p className="text-text">{t(text)}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link to="/about" className="inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4">
            {t('trust.link')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </p>
      </Container>
    </section>
  )
}

function FinalCta() {
  const { t } = useT()
  return (
    <section aria-labelledby="final-title" className="relative mt-section overflow-hidden">
      <Container className="relative z-10 flex flex-col items-center pt-section text-center">
        <SectionTitle id="final-title" align="center" line1={t('final.title1')} line2={t('final.title2')}>
          {t('final.text')}
        </SectionTitle>
        <m.div className="mt-8" initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4, ease: EASE }}>
          <Button to="/field" size="lg" iconRight={<ArrowRight size={22} />}>
            {t('landing.cta')}
          </Button>
        </m.div>
      </Container>
      <SproutRow className="mt-6 h-32 sm:h-40 lg:h-48" />
    </section>
  )
}

export default function LandingPage() {
  const can3D = useCanRender3D()
  const toHow = () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
  // The landing is a night scene in both themes (the theme switch applies to the tool pages).
  return (
    <div data-theme="dark" className="bg-bg text-text">
      {can3D ? <OrbitStory onHow={toHow} /> : <StaticHero onHow={toHow} />}
      <AerialSection />
      <ValleyStats />
      <HowItWorks />
      <WhyRotate />
      <Trust />
      <FinalCta />
    </div>
  )
}
