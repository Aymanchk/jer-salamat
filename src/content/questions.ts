import {
  Banknote,
  Carrot,
  CircleHelp,
  Flower2,
  CloudRain,
  Droplet,
  Droplets,
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
  /** Why we ask: one plain sentence under the question. */
  why: string
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
    id: 'currentRotation',
    title: 'What do you usually grow here over 2–3 years?',
    help: 'Pick the order closest to what you do now.',
    why: 'We compare every new plan with what you grow today, so you see what would change.',
    short: 'Now growing',
    options: [
      { value: 'wheat-every-year', label: 'Wheat every year', hint: 'Wheat → wheat → wheat', icon: Wheat },
      { value: 'wheat-maize', label: 'Wheat and maize in turn', hint: 'Wheat → maize → wheat', icon: Sprout },
      { value: 'beet-wheat-maize', label: 'Sugar beet, wheat, maize', hint: 'Beet → wheat → maize', icon: Carrot },
      { value: 'alfalfa-wheat', label: 'Alfalfa, then wheat', hint: 'Alfalfa 2 years → wheat', icon: Flower2 },
      { value: 'vegetables-wheat', label: 'Potato or vegetables, then wheat', hint: 'Vegetables → wheat', icon: Carrot },
    ],
  },
  {
    id: 'soilType',
    title: 'What is the soil like?',
    help: 'Think about how it feels in your hand after rain.',
    why: 'Sandy soil loses water fast; clay holds it. This changes which crops cope with dry summers.',
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
    why: 'Thirsty crops like maize and sugar beet need reliable irrigation in the Chuy Valley.',
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
    why: 'If water is short, we put crops that need less water higher in the list.',
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
    help: 'We show all plans. The one that fits this goal comes first.',
    why: 'There is no single best plan. Your goal decides which trade-off is right for you.',
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
