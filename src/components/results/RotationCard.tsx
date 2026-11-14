import {
  ArrowDown,
  ArrowUp,
  BookMarked,
  CircleHelp,
  Droplets,
  History,
  Lightbulb,
  Minus,
  ShoppingBasket,
  Sprout,
  Star,
  ThumbsUp,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { AccordionItem } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { CropIcon } from '@/components/ui/CropIcon'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Term } from '@/components/ui/Term'
import type { Comparison, Msg, PlanId, PlanResult } from '@/core'
import { useTilt } from '@/hooks/useTilt'
import { useT } from '@/i18n'
import { cx } from '@/lib'

export const PLAN_ICONS: Record<PlanId, LucideIcon> = {
  'water-saving': Droplets,
  'soil-health': Sprout,
  economic: ShoppingBasket,
  current: History,
  reference: BookMarked,
}

function CompareChip({ value, dim, comparedToReference }: { value: Comparison; dim: 'water' | 'soil'; comparedToReference: boolean }) {
  const { t } = useT()
  const Icon = value === 'better' ? ArrowUp : value === 'worse' ? ArrowDown : Minus
  const target = comparedToReference ? t('cmp.targetRef') : t('cmp.targetCur')
  const srText =
    value === 'same'
      ? ` ${t('cmp.srSame', { target })}`
      : value === 'better' || value === 'worse'
        ? ` ${t('cmp.srDiff', { target, detail: t(`cmp.${dim}.${value}`) })}`
        : ''
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-pill border px-2 py-0.5 text-sm font-bold',
        value === 'better' && 'border-better text-better',
        value === 'worse' && 'border-worse text-worse',
        (value === 'same' || value === 'unknown') && 'border-border-strong text-text-muted',
      )}
    >
      {value !== 'unknown' && <Icon size={14} aria-hidden="true" strokeWidth={2.75} />}
      {t(`cmp.${value}`)}
      {srText && <span className="sr-only">{srText}</span>}
    </span>
  )
}

function MsgList({ items }: { items: Msg[] }) {
  const { tm } = useT()
  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((m) => (
        <li key={m.key + JSON.stringify(m.params ?? '')}>{tm(m)}</li>
      ))}
    </ul>
  )
}

interface RotationCardProps {
  plan: PlanResult
  /** True for the best fit for this farmer. */
  best?: boolean
  /** The comparison rotation is the regional reference (farmer said "I don't know"). */
  comparedToReference?: boolean
  className?: string
}

export function RotationCard({ plan, best = false, comparedToReference = false, className }: RotationCardProps) {
  const { t } = useT()
  const Icon = PLAN_ICONS[plan.id]
  const isBaseline = plan.id === 'current' || plan.id === 'reference'
  const tilt = useTilt()
  const title = t(`plan.${plan.id}.title`)
  const long = plan.sequence.length > 4
  const vsLabel = isBaseline ? t('plan.howItDoes') : comparedToReference ? t('plan.vsReference') : t('plan.vsCurrent')

  return (
    <article
      aria-label={title}
      {...tilt}
      className={cx(
        'lift flex h-full flex-col overflow-hidden rounded-card border bg-surface shadow-card will-change-transform',
        best ? 'gradient-border border-transparent' : isBaseline ? 'border-dashed border-border-strong' : 'border-border',
        className,
      )}
    >
      <header className={cx('flex items-start gap-3 p-4 sm:p-5', isBaseline ? 'bg-surface-muted' : 'bg-primary')}>
        <span
          aria-hidden="true"
          className={cx('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill', best ? 'neon-chip text-on-accent' : 'bg-primary-strong text-on-primary')}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <h3 className={cx('text-xl', !isBaseline && 'text-on-primary')}>{title}</h3>
          <p className={isBaseline ? 'text-text-muted' : 'text-on-primary-muted'}>{t(`plan.${plan.id}.goal`)}</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {best && (
            <span className="neon-chip inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-sm font-bold leading-none text-on-accent">
              <Star size={14} aria-hidden="true" />
              {t('plan.bestFit')}
            </span>
          )}
          {plan.id === 'current' && <Badge type="answers" />}
          {plan.id === 'reference' && <Badge type="reference">{t('plan.reference.badge')}</Badge>}
          {!isBaseline && <Badge type="guidance" />}
        </div>

        <section aria-label={t('plan.cropOrder')}>
          <p className="mb-3 text-sm font-bold text-text-muted">
            {plan.id === 'current' ? t('plan.whatYouGrow') : plan.id === 'reference' ? t('plan.referenceOrder') : t('plan.cropOrder')}
          </p>
          <ol className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${plan.sequence.length}, minmax(0, 1fr))` }}>
            <span
              aria-hidden="true"
              className={cx('absolute h-0.5 bg-border', long ? 'top-[2.35rem]' : 'top-[2.6rem]')}
              style={{ left: `${50 / plan.sequence.length}%`, right: `${50 / plan.sequence.length}%` }}
            />
            {plan.sequence.map((crop, i) => (
              <li
                key={i}
                className="relative flex min-w-0 flex-col items-center gap-1.5"
                aria-label={`${t('plan.year', { n: String(i + 1) })}: ${t(`crop.${crop}`)}`}
              >
                <span className="whitespace-nowrap text-sm text-text-muted" aria-hidden="true">
                  {long ? i + 1 : t('plan.year', { n: String(i + 1) })}
                </span>
                <CropIcon crop={crop} size={long ? 'sm' : 'md'} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-label={vsLabel}>
          <p className="mb-2 text-sm font-bold text-text-muted">{vsLabel}</p>
          <dl className="divide-y divide-border rounded-control border border-border">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Droplets size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
              <dt className="min-w-0 flex-1">
                <span className="block font-bold text-text">
                  <Term id="waterNeed">{t('plan.dim.water')}</Term>
                </span>
                <span className="block text-sm text-text-muted">
                  {plan.waterLevel ? `${t(`plan.water.${plan.waterLevel}`)} · ` : ''}
                  {plan.water
                    ? plan.water.missing.length > 0
                      ? t('plan.water.rangePartial', {
                          min: String(plan.water.min),
                          max: String(plan.water.max),
                          missing: { crops: plan.water.missing, sep: 'and' },
                        })
                      : t('plan.water.range', { min: String(plan.water.min), max: String(plan.water.max) })
                    : t('plan.water.none')}
                </span>
              </dt>
              <dd>
                {plan.vsCurrent ? (
                  <CompareChip value={plan.vsCurrent.water} dim="water" comparedToReference={comparedToReference} />
                ) : (
                  <span className="text-sm text-text-muted">{t('plan.baseline')}</span>
                )}
              </dd>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Sprout size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
              <dt className="min-w-0 flex-1">
                <span className="block font-bold text-text">{t('plan.dim.soil')}</span>
                <span className="block text-sm text-text-muted">{t(`plan.soil.${plan.soilLevel}`)}</span>
              </dt>
              <dd>
                {plan.vsCurrent ? (
                  <CompareChip value={plan.vsCurrent.soil} dim="soil" comparedToReference={comparedToReference} />
                ) : (
                  <span className="text-sm text-text-muted">{t('plan.baseline')}</span>
                )}
              </dd>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <ShoppingBasket size={18} aria-hidden="true" className="shrink-0 text-text-muted" />
              <dt className="min-w-0 flex-1">
                <span className="block font-bold text-text">{t('plan.dim.income')}</span>
                <span className="block text-sm text-text-muted">{t('plan.income.none')}</span>
              </dt>
              <dd className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-text-muted">{t('plan.income.status')}</span>
                <InfoTooltip label={t('plan.income.status')} align="right">
                  {t('plan.income.info')}
                </InfoTooltip>
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-auto border-t border-border">
          <AccordionItem title={isBaseline ? t('acc.about') : t('acc.why')} icon={Lightbulb} defaultOpen={best}>
            <MsgList items={plan.why} />
          </AccordionItem>
          {plan.benefits.length > 0 && (
            <AccordionItem title={t('acc.benefits')} icon={ThumbsUp}>
              <MsgList items={plan.benefits} />
            </AccordionItem>
          )}
          {plan.limitations.length > 0 && (
            <AccordionItem title={t('acc.limits')} icon={TriangleAlert}>
              <MsgList items={plan.limitations} />
            </AccordionItem>
          )}
          <AccordionItem title={t('acc.missing')} icon={CircleHelp}>
            <MsgList items={plan.missingInfo} />
          </AccordionItem>
        </div>
      </div>
    </article>
  )
}
