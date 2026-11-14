import {
  Carrot,
  CircleHelp,
  CloudRain,
  Droplet,
  Droplets,
  Flower2,
  Fuel,
  Grip,
  Layers,
  Mountain,
  Salad,
  ShoppingBasket,
  Sprout,
  Waves,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { MaizeIcon, PotatoIcon } from '@/components/ui/CustomCropIcons'
import type { QuestionId } from '@/core'
import type { TFunc } from '@/i18n'

/**
 * The 5 questions. Text lives in the dictionaries (src/i18n):
 * q.<id>.title / .help / .why / .short and opt.<id>.<value> (+ .hint).
 * Crop options follow the crops grown in Sokuluk District (Kyrgyz ESMF, 2024).
 */
export interface QuestionOption {
  value: string
  icon: LucideIcon | ComponentType<{ size?: number }>
  hasHint?: boolean
}

export interface Question {
  id: QuestionId
  options: QuestionOption[]
}

/** Added to every question. */
export const UNKNOWN_OPTION: QuestionOption = { value: 'unknown', icon: CircleHelp }

export const QUESTIONS: Question[] = [
  {
    id: 'currentRotation',
    options: [
      { value: 'wheat-every-year', icon: Wheat, hasHint: true },
      { value: 'wheat-maize', icon: MaizeIcon, hasHint: true },
      { value: 'beet-wheat-maize', icon: Carrot, hasHint: true },
      { value: 'alfalfa-wheat', icon: Flower2, hasHint: true },
      { value: 'potato-wheat', icon: PotatoIcon, hasHint: true },
      { value: 'vegetables-wheat', icon: Salad, hasHint: true },
    ],
  },
  {
    id: 'soilType',
    options: [
      { value: 'light', icon: Grip, hasHint: true },
      { value: 'medium', icon: Layers, hasHint: true },
      { value: 'heavy', icon: Waves, hasHint: true },
      { value: 'stony', icon: Mountain, hasHint: true },
    ],
  },
  {
    id: 'irrigation',
    options: [
      { value: 'canal', icon: Waves },
      { value: 'pump', icon: Fuel },
      { value: 'none', icon: CloudRain },
    ],
  },
  {
    id: 'waterLimited',
    options: [
      { value: 'often', icon: Droplet, hasHint: true },
      { value: 'sometimes', icon: Droplets, hasHint: true },
      { value: 'rarely', icon: Waves, hasHint: true },
    ],
  },
  {
    id: 'priority',
    options: [
      { value: 'water', icon: Droplets },
      { value: 'soil', icon: Sprout },
      { value: 'income', icon: ShoppingBasket, hasHint: true },
    ],
  },
]

/** Display label of a stored answer, or null. */
export function answerLabel(t: TFunc, id: QuestionId, value: string | undefined): string | null {
  if (!value) return null
  if (value === UNKNOWN_OPTION.value) return t('opt.unknown')
  return t(`opt.${id}.${value}`)
}
