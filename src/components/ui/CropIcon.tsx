import { Bean, Carrot, CircleDashed, Flower2, Salad, Sun, Wheat } from 'lucide-react'
import type { ComponentType } from 'react'
import type { CropId } from '@/core'
import { useT } from '@/i18n'
import { cx } from '@/lib'
import { BarleyIcon, MaizeIcon, PotatoIcon } from './CustomCropIcons'

/** Every crop has its own icon, always shown with its name. Crops follow Sokuluk District (ESMF 2024). */
const ICONS: Record<CropId, ComponentType<{ size?: number }>> = {
  wheat: Wheat,
  barley: BarleyIcon,
  'cereal-grass': BarleyIcon,
  maize: MaizeIcon,
  'sugar-beet': Carrot,
  potato: PotatoIcon,
  vegetables: Salad,
  alfalfa: Flower2,
  beans: Bean,
  oilseeds: Sun,
  fallow: CircleDashed,
}

interface CropIconProps {
  crop: CropId
  size?: 'sm' | 'md' | 'lg'
  /** Show the crop name under the icon. When false the name is still read aloud. */
  showLabel?: boolean
  className?: string
}

/** Round crop symbol. Always paired with the crop name, shown or spoken. */
export function CropIcon({ crop, size = 'md', showLabel = true, className }: CropIconProps) {
  const { t } = useT()
  const Icon = ICONS[crop]
  return (
    <span className={cx('inline-flex min-w-0 flex-col items-center gap-1.5 text-center', className)}>
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex items-center justify-center rounded-pill border-2 border-selected bg-surface text-heading',
          size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11',
        )}
      >
        <Icon size={size === 'lg' ? 28 : size === 'sm' ? 18 : 22} />
      </span>
      <span className={cx('break-words text-sm font-bold leading-tight text-text [hyphens:auto]', !showLabel && 'sr-only')}>
        {t(`crop.short.${crop}`)}
      </span>
    </span>
  )
}
