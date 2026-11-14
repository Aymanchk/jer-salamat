import {
  ArrowDown,
  ArrowUp,
  Banknote,
  CircleHelp,
  Droplets,
  History,
  Lightbulb,
  Minus,
  Sprout,
  Star,
  ThumbsUp,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { AccordionItem } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { CropIcon, cropLabel } from '@/components/ui/CropIcon'
import type { Comparison, Level, PlanId, PlanResult } from '@/core'
import { useTilt } from '@/hooks/useTilt'
import { cx } from '@/lib'

interface PlanMeta {
  title: string
  goal: string
  icon: LucideIcon
}

export const PLANS: Record<PlanId, PlanMeta> = {
  'water-saving': { title: 'Water saving', goal: 'Use less irrigation water in dry summers.', icon: Droplets },
  'soil-health': { title: 'Soil health', goal: 'Make the soil richer for the years ahead.', icon: Sprout },
  economic: { title: 'Higher income', goal: 'Aim for more money from the field.', icon: Banknote },
  current: { title: 'Your current rotation', goal: 'What you grow now, for comparison.', icon: History },
}

const DIMENSIONS: Array<{ key: 'water' | 'soil' | 'economy'; label: string; icon: LucideIcon; better: string; worse: string }> = [
  { key: 'water', label: 'Water', icon: Droplets, better: 'needs less water', worse: 'needs more water' },
  { key: 'soil', label: 'Soil', icon: Sprout, better: 'better for soil', worse: 'harder on soil' },
  { key: 'economy', label: 'Income', icon: Banknote, better: 'more income', worse: 'less income' },
]

/** Words for the level of each dimension. Water is phrased as "water saving". */
const LEVEL_WORD: Record<'water' | 'soil' | 'economy', Record<Level, string>> = {
  water: { low: 'Needs a lot', medium: 'Medium need', high: 'Needs little' },
  soil: { low: 'Wears it out', medium: 'Neutral', high: 'Builds it up' },
  economy: { low: 'Low', medium: 'Medium', high: 'High' },
}

function CompareChip({ value, better, worse }: { value: Comparison; better: string; worse: string }) {
  const Icon = value === 'better' ? ArrowUp : value === 'worse' ? ArrowDown : Minus
  const text = value === 'better' ? `Better: ${better}` : value === 'worse' ? `Worse: ${worse}` : 'Same as now'
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-sm font-bold whitespace-nowrap',
        value === 'better' && 'border-better text-better',
        value === 'worse' && 'border-worse text-worse',
        value === 'same' && 'border-border-strong text-text-muted',
      )}
    >
      <Icon size={14} aria-hidden="true" strokeWidth={2.75} />
      {value === 'better' ? 'Better' : value === 'worse' ? 'Worse' : 'Same'}
      <span className="sr-only"> than your current rotation. {text}</span>
    </span>
  )
}

interface RotationCardProps {
  plan: PlanResult
  /** True for the best fit for this farmer. */
  best?: boolean
  /** True when the current rotation was assumed (farmer chose "I don't know"). */
  assumed?: boolean
  className?: string
}

export function RotationCard({ plan, best = false, assumed = false, className }: RotationCardProps) {
  const meta = PLANS[plan.id]
  const Icon = meta.icon
  const isCurrent = plan.id === 'current'
  const tilt = useTilt()

  return (
    <article
      aria-label={`${meta.title} plan`}
      {...tilt}
      className={cx(
        'lift flex h-full flex-col overflow-hidden rounded-card border bg-surface shadow-card will-change-transform',
        best ? 'gradient-border border-transparent' : isCurrent ? 'border-dashed border-border-strong' : 'border-border',
        className,
      )}
    >
      <header className={cx('flex items-start gap-3 p-4 sm:p-5', isCurrent ? 'bg-surface-muted' : 'bg-primary')}>
        <span
          aria-hidden="true"
          className={cx(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill',
            best ? 'neon-chip text-on-accent' : 'bg-primary-strong text-on-primary',
          )}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <h3 className={cx('text-xl', !isCurrent && 'text-on-primary')}>{meta.title}</h3>
          <p className={isCurrent ? 'text-text-muted' : 'text-on-primary-muted'}>
            {isCurrent && assumed ? 'You did not say, so we assume a typical Chuy rotation.' : meta.goal}
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {best && (
            <span className="neon-chip inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-sm font-bold leading-none text-on-accent">
              <Star size={14} aria-hidden="true" />
              Best fit for you
            </span>
          )}
          {isCurrent ? <Badge type="answers" /> : <Badge type="estimate" />}
          {plan.preliminary && !isCurrent && <Badge type="placeholder">Preliminary values</Badge>}
        </div>

        <section aria-label="Crop sequence">
          <p className="mb-3 text-sm font-bold text-text-muted">{isCurrent ? 'What you grow now' : 'Crop order, season by season'}</p>
          <ol className="relative grid grid-cols-4 gap-1">
            <span aria-hidden="true" className="absolute inset-x-[12.5%] top-[2.6rem] h-0.5 bg-border" />
            {plan.sequence.map((crop, i) => (
              <li key={i} className="relative flex flex-col items-center gap-1.5" aria-label={`Season ${i + 1}: ${cropLabel(crop)}`}>
                <span className="text-sm text-text-muted" aria-hidden="true">
                  Season {i + 1}
                </span>
                <CropIcon crop={crop} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-label={isCurrent ? 'How it does' : 'Compared with your current rotation'}>
          <p className="mb-2 text-sm font-bold text-text-muted">{isCurrent ? 'How it does' : 'Vs your current rotation'}</p>
          <dl className="divide-y divide-border rounded-control border border-border">
            {DIMENSIONS.map((d) => (
              <div key={d.key} className="flex items-center gap-3 px-3 py-2.5">
                <d.icon size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
                <dt className="min-w-0 flex-1">
                  <span className="block font-bold text-text">{d.label}</span>
                  <span className="block text-sm text-text-muted">{LEVEL_WORD[d.key][plan.levels[d.key]]}</span>
                </dt>
                <dd>
                  {plan.vsCurrent ? (
                    <CompareChip value={plan.vsCurrent[d.key]} better={d.better} worse={d.worse} />
                  ) : (
                    <span className="text-sm text-text-muted">Baseline</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-auto border-t border-border">
          <AccordionItem title={isCurrent ? 'About it' : 'Why this plan'} icon={Lightbulb} defaultOpen={best}>
            <ul className="list-disc space-y-1 pl-4">
              {plan.why.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title="Benefits" icon={ThumbsUp}>
            <ul className="list-disc space-y-1 pl-4">
              {plan.benefits.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </AccordionItem>
          {plan.limitations.length > 0 && (
            <AccordionItem title="Risks and limits" icon={TriangleAlert}>
              <ul className="list-disc space-y-1 pl-4">
                {plan.limitations.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </AccordionItem>
          )}
          <AccordionItem title="What we don't know" icon={CircleHelp}>
            <ul className="list-disc space-y-1 pl-4">
              {plan.missingInfo.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </AccordionItem>
        </div>
      </div>
    </article>
  )
}
