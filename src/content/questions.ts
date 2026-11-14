import {
  Banknote,
  Carrot,
  CircleHelp,
  Clover,
  CloudRain,
  Droplet,
  Droplets,
  Ellipsis,
  Fuel,
  Grip,
  Layers,
  Mountain,
  Sprout,
  Waves,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import type { QuestionId } from '@/core'

export interface QuestionOption {
  value: string
  label: string
  hint?: string
  icon: LucideIcon
}

export interface Question {
  id: QuestionId
  title: string
  help: string
  /** Short label used in the answers summary. */
  short: string
  options: QuestionOption[]
}

/** Added to every question. */
export const UNKNOWN_OPTION: QuestionOption = {
  value: 'unknown',
  label: "I don't know",
  icon: CircleHelp,
}

export const QUESTIONS: Question[] = [
  {
    id: 'previousCrop',
    title: 'What grew on this field last season?',
    help: 'The last crop changes what the soil needs next.',
    short: 'Last crop',
    options: [
      { value: 'wheat', label: 'Wheat', icon: Wheat },
      { value: 'barley', label: 'Barley', icon: Wheat },
      { value: 'maize', label: 'Maize (corn)', icon: Sprout },
      { value: 'sugar-beet', label: 'Sugar beet', icon: Carrot },
      { value: 'alfalfa', label: 'Alfalfa', icon: Clover },
      { value: 'vegetables', label: 'Potato or vegetables', icon: Carrot },
      { value: 'other', label: 'Other crop', icon: Ellipsis },
    ],
  },
  {
    id: 'soilType',
    title: 'What is the soil like?',
    help: 'Think about how it feels in your hand after rain.',
    short: 'Soil',
    options: [
      { value: 'light', label: 'Light, sandy', hint: 'Water drains fast', icon: Grip },
      { value: 'medium', label: 'Medium, loam', hint: 'Soft and crumbly', icon: Layers },
      { value: 'heavy', label: 'Heavy, clay', hint: 'Sticky when wet', icon: Waves },
      { value: 'stony', label: 'Stony', hint: 'Many stones', icon: Mountain },
    ],
  },
  {
    id: 'irrigation',
    title: 'Can you irrigate this field?',
    help: 'Choose the main water source.',
    short: 'Irrigation',
    options: [
      { value: 'canal', label: 'Yes, from a canal', icon: Waves },
      { value: 'pump', label: 'Yes, from a well or pump', icon: Fuel },
      { value: 'none', label: 'No, rain only', icon: CloudRain },
    ],
  },
  {
    id: 'waterLimited',
    title: 'Is water short in summer?',
    help: 'For example, the canal runs low or your turn comes late.',
    short: 'Water short',
    options: [
      { value: 'often', label: 'Often', hint: 'Most summers', icon: Droplet },
      { value: 'sometimes', label: 'Sometimes', hint: 'In dry years', icon: Droplets },
      { value: 'rarely', label: 'Rarely', hint: 'Water is enough', icon: Waves },
    ],
  },
  {
    id: 'priority',
    title: 'What matters most to you?',
    help: 'We show all three plans. This one comes first.',
    short: 'Priority',
    options: [
      { value: 'water', label: 'Save water', icon: Droplets },
      { value: 'soil', label: 'Keep soil healthy', icon: Sprout },
      { value: 'income', label: 'Earn more', icon: Banknote },
    ],
  },
]

/** Looks up the display label of a stored answer. */
export function answerLabel(id: QuestionId, value: string | undefined): string | null {
  if (!value) return null
  if (value === UNKNOWN_OPTION.value) return UNKNOWN_OPTION.label
  const question = QUESTIONS.find((q) => q.id === id)
  return question?.options.find((o) => o.value === value)?.label ?? null
}
