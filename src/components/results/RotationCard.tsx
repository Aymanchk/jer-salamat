import {
  Banknote,
  CircleHelp,
  Droplets,
  Lightbulb,
  Sprout,
  Target,
  ThumbsUp,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { AccordionItem } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CropIcon, cropLabel } from '@/components/ui/CropIcon'
import { ScoreBar } from '@/components/ui/ScoreBar'
import type { CropId, StrategyId, StrategyScores } from '@/core'
import { cx } from '@/lib'

interface StrategyMeta {
  title: string
  goal: string
  icon: LucideIcon
}

export const STRATEGIES: Record<StrategyId, StrategyMeta> = {
  'water-saving': {
    title: 'Water saving',
    goal: 'Use less irrigation water in dry summers.',
    icon: Droplets,
  },
  'soil-health': {
    title: 'Soil health',
    goal: 'Keep the soil rich for the years ahead.',
    icon: Sprout,
  },
  economic: {
    title: 'Economic potential',
    goal: 'Aim for more income from the field.',
    icon: Banknote,
  },
}

interface RotationCardProps {
  id: StrategyId
  /** One crop per season, in order. */
  sequence: CropId[]
  /** Leave undefined while scores are not calculated. */
  scores?: StrategyScores
  sections: { why: string; benefits: string; limitations: string; missing: string }
  /** True when this plan matches the farmer's stated priority. */
  matchesPriority?: boolean
  placeholder?: boolean
  className?: string
}

export function RotationCard({
  id,
  sequence,
  scores,
  sections,
  matchesPriority = false,
  placeholder = false,
  className,
}: RotationCardProps) {
  const meta = STRATEGIES[id]
  const Icon = meta.icon

  return (
    <Card
      as="article"
      padding="none"
      aria-label={`${meta.title} plan`}
      className={cx('flex h-full flex-col overflow-hidden', matchesPriority && 'border-2 border-selected', className)}
    >
      <header className="on-primary-surface flex items-start gap-3 bg-primary p-4 text-on-primary sm:p-5">
        <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-strong">
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl text-on-primary">{meta.title}</h3>
          <p className="text-on-primary-muted">{meta.goal}</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Badge type="estimate" />
          {placeholder && <Badge type="placeholder" />}
          {matchesPriority && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-2.5 py-1 text-sm font-bold leading-none text-on-accent">
              <Target size={14} aria-hidden="true" />
              Your priority
            </span>
          )}
        </div>

        <section aria-label="Crop sequence">
          <p className="mb-3 text-sm font-bold text-text-muted">
            {placeholder ? 'Example sequence, not a recommendation' : 'Crop sequence'}
          </p>
          <ol className="relative grid grid-cols-4 gap-1">
            <span aria-hidden="true" className="absolute inset-x-[12.5%] top-[2.6rem] h-0.5 bg-border" />
            {sequence.map((crop, i) => (
              <li key={i} className="relative flex flex-col items-center gap-1.5" aria-label={`Season ${i + 1}: ${cropLabel(crop)}`}>
                <span className="text-sm text-text-muted" aria-hidden="true">
                  Season {i + 1}
                </span>
                <CropIcon crop={crop} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Scores" className="space-y-3">
          <ScoreBar label="Water" icon={Droplets} value={scores?.water} />
          <ScoreBar label="Soil" icon={Sprout} value={scores?.soil} />
          <ScoreBar label="Economy" icon={Banknote} value={scores?.economy} />
        </section>

        <div className="mt-auto border-t border-border">
          <AccordionItem title="Why this" icon={Lightbulb} defaultOpen>
            {sections.why}
          </AccordionItem>
          <AccordionItem title="Benefits" icon={ThumbsUp}>
            {sections.benefits}
          </AccordionItem>
          <AccordionItem title="Limitations" icon={TriangleAlert}>
            {sections.limitations}
          </AccordionItem>
          <AccordionItem title="Missing information" icon={CircleHelp}>
            {sections.missing}
          </AccordionItem>
        </div>
      </div>
    </Card>
  )
}
