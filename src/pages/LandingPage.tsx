import { ArrowDown, ArrowRight, ChartLine, ClipboardList, MapPin, Satellite, Sprout, type LucideIcon } from 'lucide-react'
import { m, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Container } from '@/components/layout/Page'
import { ValleyStats } from '@/components/landing/ValleyStats'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { useCanRender3D } from '@/hooks/useDeviceCapability'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cx } from '@/lib'

// three.js is only downloaded on devices that can run it.
const OrbitScene = lazy(() => import('@/components/earth/OrbitScene'))

const STEPS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: MapPin, title: 'Pick your field', text: 'Search your village or tap the map. Drag the pin onto your field.' },
  { icon: ClipboardList, title: 'Answer 5 questions', text: 'What you grow now, your soil, your water. "I don\'t know" is a fine answer.' },
  { icon: ChartLine, title: 'See 40 years of NASA climate', text: 'Temperature, rain and snow, and soil wetness around your field since 1986.' },
  { icon: Sprout, title: 'Get your plan', text: 'The rotation that fits your goal, compared with what you grow now, and 3 steps to start.' },
]

/** Headline lines slide up one by one (fast: readable in well under 2 seconds). */
function Lines({ lines, className }: { lines: ReactNode[]; className?: string }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <m.span
            className={cx('block', className)}
            initial={{ y: '35%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 + i * 0.09, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {line}
          </m.span>
        </span>
      ))}
    </>
  )
}

function HeroCopy({ onHow }: { onHow: () => void }) {
  return (
    <>
      <p className="mb-4 inline-flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">
        <Satellite size={16} aria-hidden="true" />
        NASA climate data · Chuy Valley
      </p>
      <h1 id="hero-title" className="text-[2.25rem] leading-[1.02] sm:text-5xl lg:text-6xl">
        <Lines lines={['Climate in the', 'Chuy Valley is', 'changing.']} />
        <Lines lines={[<span key="k" className="text-accent-text">Know what to plant next.</span>]} />
      </h1>
      <p className="mt-4 max-w-md text-base text-text-muted sm:mt-5 sm:text-lg">
        Pick your field, answer 5 questions and get a crop rotation plan built on 40 years of NASA climate records. Free, no sign-up.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
        <Button to="/field" size="lg" iconRight={<ArrowRight size={22} />} className="w-full sm:w-auto">
          Check my field
        </Button>
        <Button variant="ghost" size="lg" onClick={onHow} className="w-full sm:w-auto">
          How it works
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
  { at: 0, label: 'Orbit' },
  { at: 0.45, label: 'Kyrgyzstan' },
  { at: 0.8, label: 'Chuy Valley' },
]

/** Scenes 1–2: orbit → descent → valley, on one sticky 3D canvas. */
function OrbitStory({ onHow }: { onHow: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const wide = useMediaQuery('(min-width: 1024px)')
  const [load3D, setLoad3D] = useState(false)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(true)
  const [chapter, setChapter] = useState(0)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.07, 0.15], [1, 1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -40])
  const cueOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0])
  const rail = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

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
        <div aria-hidden="true" className={cx('absolute inset-0 transition-opacity duration-slow', ready ? 'opacity-100' : 'opacity-0')}>
          {load3D && (
            <Suspense fallback={null}>
              <OrbitScene progress={scrollYProgress} active={active} wide={wide} onReady={() => setReady(true)} />
            </Suspense>
          )}
        </div>

        {/* Scrims keep text off the busy globe. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-bg)_0%,color-mix(in_srgb,var(--color-bg)_85%,transparent)_30%,transparent_62%)] max-lg:hidden" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--color-bg)_0%,var(--color-bg)_52%,color-mix(in_srgb,var(--color-bg)_75%,transparent)_60%,transparent_68%)] lg:hidden" />

        <Container className="relative h-full">
          {/* Scene 1: the headline. Visible immediately. */}
          <m.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="absolute inset-x-gutter bottom-[max(3.25rem,6vh)] max-w-xl lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
          >
            <HeroCopy onHow={onHow} />
          </m.div>

          {/* Scene 2: descent */}
          <StoryPanel progress={scrollYProgress} range={[0.3, 0.4, 0.58, 0.68]} className="inset-x-gutter bottom-[12vh] max-w-md lg:bottom-auto lg:top-[30%]">
            <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">Descending · Kyrgyzstan</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Most of Kyrgyzstan is mountains.</h2>
            <p className="mt-3 text-lg text-text-muted">Flat land that can be farmed is rare and precious. One of the largest farming valleys lies in the north.</p>
          </StoryPanel>

          <StoryPanel progress={scrollYProgress} range={[0.74, 0.82, 0.95, 1]} stay className="inset-x-gutter bottom-[10vh] max-w-md lg:bottom-auto lg:top-[26%]">
            <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">Arrived · Chuy Valley</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">The Chuy Valley.</h2>
            <p className="mt-3 text-lg text-text-muted">
              Wheat, maize, sugar beet and alfalfa grow here, watered by mountain rivers and canals. NASA POWER holds 40 years of its climate.
            </p>
            <div className="mt-5">
              <Button to="/field" iconRight={<ArrowRight size={20} />}>
                Check my field
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
                  {c.label}
                </li>
              ))}
            </ol>
          </div>
        </Container>

        <m.p style={{ opacity: cueOpacity }} aria-hidden="true" className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 text-sm text-text-muted">
          <ArrowDown size={16} className="animate-bounce" />
          Scroll to fly down to the valley
        </m.p>
      </div>
    </section>
  )
}

/** Shown instead of the 3D story on weak devices, slow connections or reduced motion. */
function StaticHero({ onHow }: { onHow: () => void }) {
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
            alt="Globe centred on Central Asia, with Kyrgyzstan outlined and the Chuy Valley marked."
            fetchPriority="high"
            className="relative h-full w-full"
          />
        </div>
      </Container>
    </section>
  )
}

/** Scene 4: the 4 steps. Pinned on large screens, a simple list on phones. */
function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [activeStep, setActiveStep] = useState(0)
  const pinned = useMediaQuery('(min-width: 1024px)')
  useMotionValueEvent(scrollYProgress, 'change', (p) => setActiveStep(Math.min(3, Math.floor(p * 4.2))))

  return (
    <section id="how" ref={ref} aria-labelledby="how-title" className={cx('relative scroll-mt-header', pinned ? 'h-[240vh]' : 'pt-section')}>
      <div className={cx(pinned && 'sticky top-header flex h-[calc(100dvh-var(--size-header))] items-center')}>
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">How it works</p>
              <h2 id="how-title" className="mt-2 text-3xl sm:text-5xl">
                Four steps.
                <br />
                About two minutes.
              </h2>
              <p className="mt-4 max-w-sm text-lg text-text-muted">One task per screen, big buttons, plain words. Works on a phone in the field.</p>
              <div className="mt-6">
                <Button to="/field" iconRight={<ArrowRight size={20} />}>
                  Start with my field
                </Button>
              </div>
            </div>
            <ol className="relative grid gap-3">
              {STEPS.map((step, i) => {
                const on = !pinned || i <= activeStep
                return (
                  <li
                    key={step.title}
                    className={cx(
                      'flex gap-4 rounded-card border p-5 transition-[opacity,border-color,background-color,transform] duration-slow ease-token sm:p-6',
                      on ? 'border-border bg-surface opacity-100' : 'border-transparent bg-transparent opacity-35',
                      pinned && i === activeStep && 'border-border-strong shadow-glow-soft lg:translate-x-2',
                    )}
                  >
                    <span className="font-display text-4xl font-semibold leading-none text-accent-text tabular-nums" aria-hidden="true">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2 text-xl">
                        <step.icon size={20} aria-hidden="true" className="text-accent-text" />
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </h3>
                      <p className="mt-1 text-text-muted">{step.text}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </Container>
      </div>
    </section>
  )
}

/** Scene 5: where the data comes from, how to read labels, final call to action. */
function Trust() {
  return (
    <section aria-labelledby="trust-title" className="pt-section">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">Honest by design</p>
            <h2 id="trust-title" className="mt-2 text-3xl sm:text-4xl">
              Every number says where it comes from.
            </h2>
            <p className="mt-4 text-lg text-text-muted">
              All climate numbers come from <strong className="text-text">NASA POWER</strong>: temperature, rain and snow, and root zone soil
              wetness, 1986–2025. Crop advice is general rotation guidance, clearly labelled. We never invent yields or prices.
            </p>
            <p className="mt-4">
              <a href="/about" className="inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4">
                Sources, limits and glossary
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <dl className="divide-y divide-border rounded-card border border-border bg-surface">
              {(
                [
                  ['historical', 'Measured or modelled by NASA for your area.'],
                  ['answers', 'What you told us about your field.'],
                  ['guidance', 'General crop rotation knowledge, not from NASA data.'],
                  ['hypothetical', 'A "what if" picture. Not a forecast.'],
                ] as const
              ).map(([type, text]) => (
                <div key={type} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <dt className="sm:w-56">
                    <Badge type={type} />
                  </dt>
                  <dd className="text-text-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal>
          <div className="gradient-border mt-section flex flex-col items-start gap-5 rounded-card bg-surface p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl sm:text-4xl">Ready to check your field?</h2>
              <p className="mt-2 text-lg text-text-muted">Works on a phone and on slow internet. Takes about 2 minutes.</p>
            </div>
            <Button to="/field" size="lg" iconRight={<ArrowRight size={22} />} className="w-full sm:w-auto">
              Check my field
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

export default function LandingPage() {
  const can3D = useCanRender3D()
  const toHow = () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
  return (
    <>
      {can3D ? <OrbitStory onHow={toHow} /> : <StaticHero onHow={toHow} />}
      <ValleyStats />
      <HowItWorks />
      <Trust />
    </>
  )
}
