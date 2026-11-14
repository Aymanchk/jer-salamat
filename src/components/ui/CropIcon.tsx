import { Bean, Carrot, CircleDashed, Flower2, Salad, Wheat } from 'lucide-react'
import type { ComponentType } from 'react'
import { BarleyIcon, MaizeIcon } from './CustomCropIcons'
import type { CropId } from '@/core'
import { cx } from '@/lib'

/** Every crop has its own icon, always shown with its name. */
const CROPS: Record<CropId, { label: string; icon: ComponentType<{ size?: number }> }> = {
  wheat: { label: 'Wheat', icon: Wheat },
  barley: { label: 'Barley', icon: BarleyIcon },
  maize: { label: 'Maize', icon: MaizeIcon },
  'sugar-beet': { label: 'Sugar beet', icon: Carrot },
  alfalfa: { label: 'Alfalfa', icon: Flower2 },
  beans: { label: 'Beans', icon: Bean },
  vegetables: { label: 'Vegetables', icon: Salad },
  fallow: { label: 'Rest (fallow)', icon: CircleDashed },
}

export function cropLabel(crop: CropId): string {
  return CROPS[crop].label
}

interface CropIconProps {
  crop: CropId
  size?: 'md' | 'lg'
  /** Show the crop name under the icon. When false the name is still read aloud. */
  showLabel?: boolean
  className?: string
}

/** Round crop symbol. Always paired with the crop name, shown or spoken. */
export function CropIcon({ crop, size = 'md', showLabel = true, className }: CropIconProps) {
  const { label, icon: Icon } = CROPS[crop]
  return (
    <span className={cx('inline-flex flex-col items-center gap-1.5 text-center', className)}>
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex items-center justify-center rounded-pill border-2 border-selected bg-surface text-heading',
          size === 'lg' ? 'h-14 w-14' : 'h-11 w-11',
        )}
      >
        <Icon size={size === 'lg' ? 28 : 22} />
      </span>
      <span className={cx('text-sm font-bold leading-tight text-text', !showLabel && 'sr-only')}>{label}</span>
    </span>
  )
}
