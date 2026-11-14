import {
  ArrowRight,
  ChartLine,
  ClipboardList,
  MapPin,
  Repeat,
  Satellite,
  ShieldCheck,
  Sprout,
  type LucideIcon,
} from 'lucide-react'
import { m } from 'motion/react'
import { Link } from 'react-router'
import { EarthHero } from '@/components/earth/EarthHero'
import { Container, Section, SectionHeading } from '@/components/layout/Page'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { DATA_SOURCES } from '@/content/about'

const BENEFITS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Satellite,
    title: '40 years of climate',
    text: 'See how temperature, rain and soil wetness changed around your field since 1986.',
  },
  {
    icon: Repeat,
    title: 'A plan, not just charts',
    text: 'Water saving, soil health or income, each compared with what you grow today. Plus 3 clear next steps.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest about limits',
    text: 'Every plan shows why, its weak points, and what we do not know.',
  },
]

const STEPS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: MapPin, title: 'Pick field', text: 'Search your village or tap the map.' },
  { icon: ClipboardList, title: 'Answer 5 questions', text: '"I don\'t know" is a fine answer.' },
  { icon: ChartLine, title: 'See climate', text: '40 years of NASA data for your area.' },
  { icon: Sprout, title: 'Get your plan', text: 'What to plant, and what to do next.' },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="overflow-hidden">
        <Container className="grid items-center gap-6 pt-6 sm:pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-16">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="order-2 lg:order-1"
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-pill border border-glass bg-surface px-3 py-1 text-sm font-bold text-accent-text">
              <Satellite size={16} aria-hidden="true" />
              For farmers in the Chuy Valley · NASA data
            </p>
            <h1 id="hero-title" className="text-3xl sm:text-4xl lg:text-5xl">
              Climate in the Chuy Valley is changing.{' '}
              <span className="text-gradient">Find out which crops to plant next</span> to save water and keep your soil
              healthy.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-text-muted">Free. No sign-up. About 2 minutes.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button to="/field" size="lg" iconRight={<ArrowRight size={22} />} className="w-full sm:w-auto">
                Check my field
              </Button>
              <Button to="/about" variant="ghost" size="lg" className="w-full sm:w-auto">
                How we use data
              </Button>
            </div>
            <p className="mt-4 text-sm text-text-muted">Climate data: NASA POWER</p>
          </m.div>

          <EarthHero className="order-1 max-w-[15rem] sm:max-w-sm lg:order-2 lg:max-w-[30rem]" />
        </Container>

        {/* The 4 steps, right under the hero, so a first-time visitor knows what will happen. */}
        <Container className="pt-8 sm:pt-12">
          <h2 className="sr-only">How it works</h2>
          <ol className="gradient-border grid grid-cols-2 gap-px overflow-hidden rounded-card bg-border shadow-card lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3 bg-surface p-4 sm:flex-row sm:items-start sm:p-5">
                <span aria-hidden="true" className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-primary-soft text-accent-text">
                  <step.icon size={26} />
                  <span className="neon-chip absolute -right-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-pill text-sm font-extrabold text-on-accent">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="text-lg leading-snug">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Benefits */}
      <Section labelledBy="benefits-title">
        <SectionHeading id="benefits-title" title="What you get" />
        <ul className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((item, i) => (
            <li key={item.title}>
              <Reveal delay={i * 0.06} className="h-full">
                <Card padding="lg" interactive className="h-full">
                  <span aria-hidden="true" className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-control bg-primary-soft text-accent-text">
                    <item.icon size={24} />
                  </span>
                  <h3 className="text-xl">{item.title}</h3>
                  <p className="mt-2 text-text-muted">{item.text}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Data sources */}
      <Section labelledBy="sources-title">
        <SectionHeading id="sources-title" title="Where the data comes from">
          Open, public sources. We always say which numbers are measured and which are estimates.
        </SectionHeading>
        <ul className="grid gap-4 md:grid-cols-3">
          {DATA_SOURCES.map((source, i) => (
            <li key={source.name}>
              <Reveal delay={i * 0.06} className="h-full">
                <Card interactive className="h-full">
                  <h3 className="text-lg">{source.name}</h3>
                  <p className="mt-1 text-text-muted">{source.what}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link to="/about" className="inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4">
            Read about sources and limits
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </p>
      </Section>

      {/* Closing call to action */}
      <Section>
        <Reveal>
          <div className="gradient-border flex flex-col items-start gap-5 rounded-card bg-surface p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl">Ready to check your field?</h2>
              <p className="mt-2 text-lg text-text-muted">It works on a phone and on slow internet.</p>
            </div>
            <Button to="/field" size="lg" iconRight={<ArrowRight size={22} />} className="w-full sm:w-auto">
              Check my field
            </Button>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
