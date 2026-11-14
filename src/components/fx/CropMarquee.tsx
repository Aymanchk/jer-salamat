import { CropIcon } from '@/components/ui/CropIcon'
import type { CropId } from '@/core'
import { useT } from '@/i18n'
import { cx } from '@/lib'

const CROPS: CropId[] = ['wheat', 'barley', 'maize', 'sugar-beet', 'potato', 'alfalfa', 'beans', 'vegetables', 'oilseeds']

/** An endless, slow ribbon of the valley's crops. Decorative: pauses on hover, stops for reduced motion. */
export function CropMarquee({ reverse = false, className }: { reverse?: boolean; className?: string }) {
  const { t } = useT()
  const row = [...CROPS, ...CROPS]
  return (
    <div aria-hidden="true" className={cx('marquee overflow-hidden', className)}>
      <div className="marquee-track gap-3 py-2" style={{ animationDirection: reverse ? 'reverse' : 'normal' }}>
        {[...row, ...row].map((crop, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-3 rounded-pill border border-border bg-surface py-1.5 pl-1.5 pr-5">
            <CropIcon crop={crop} size="sm" showLabel={false} />
            <span className="whitespace-nowrap font-display text-lg font-medium text-heading">{t(`crop.short.${crop}`)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
