import {
  ArrowRight,
  ChartLine,
  ClipboardList,
  Droplets,
  MapPin,
  Repeat,
  Satellite,
  ShieldCheck,
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
    title: '3 plans to compare',
    text: 'Water saving, soil health or income. See what each plan gives and what it costs.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest about limits',
    text: 'Every plan shows why, its weak points, and what we do not know.',
  },
]

const STEPS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: MapPin, title: 'Pick your field', text: 'Tap the map to place a pin.' },
  { icon: ClipboardList, title: 'Answer 5 questions', text: 'Simple questions. "I don\'t know" is fine.' },
  { icon: ChartLine, title: 'See your climate', text: 'Charts from 1986 to 2025.' },
  { icon: Droplets, title: 'Compare 3 plans', text: 'Choose the crop rotation that fits you.' },
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
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-text">
              For farmers in the Chuy Valley
            </p>
            <h1 id="hero-title" className="text-3xl sm:text-4xl lg:text-5xl">
              Choose a smarter crop rotation with 40 years of NASA climate data
            </h1>
            <p className="mt-4 max-w-xl text-lg text-text-muted">
              Pick your field, answer 5 short questions, and compare 3 rotation plans. Free. No sign-up.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button to="/field" size="lg" iconRight={<ArrowRight size={22} />} className="w-full sm:w-auto">
                Check my field
              </Button>
              <Button to="/about" variant="ghost" size="lg" className="w-full sm:w-auto">
                How we use data
              </Button>
            </div>
            <p className="mt-4 text-sm text-text-muted">Data: NASA POWER · Takes about 2 minutes</p>
          </m.div>

          <EarthHero className="order-1 max-w-[17rem] sm:max-w-sm lg:order-2 lg:max-w-[30rem]" />
        </Container>
      </section>

      {/* Benefits */}
      <Section labelledBy="benefits-title">
        <SectionHeading id="benefits-title" title="What you get" />
        <ul className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((item, i) => (
            <li key={item.title}>
              <Reveal delay={i * 0.06} className="h-full">
                <Card padding="lg" className="h-full">
                  <span aria-hidden="true" className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-control bg-primary-soft text-heading">
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

      {/* How it works */}
      <Section labelledBy="how-title">
        <SectionHeading id="how-title" title="How it works">
          Four steps. About two minutes.
        </SectionHeading>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Reveal delay={i * 0.06} className="h-full">
                <div className="flex h-full gap-4 rounded-card border border-border bg-surface p-4 lg:flex-col lg:p-5">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-primary text-xl font-extrabold text-on-primary">
                    <span className="sr-only">Step </span>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg">
                      <step.icon size={20} aria-hidden="true" className="shrink-0" />
                      {step.title}
                    </h3>
                    <p className="mt-1 text-text-muted">{step.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
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
                <Card className="h-full">
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
          <div className="on-primary-surface flex flex-col items-start gap-5 rounded-card bg-primary p-6 text-on-primary sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl text-on-primary sm:text-3xl">Ready to check your field?</h2>
              <p className="mt-2 text-lg text-on-primary-muted">It works on a phone and on slow internet.</p>
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
