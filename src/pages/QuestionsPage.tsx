import { ArrowLeft, ArrowRight, Check, Lightbulb, MapPinOff } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Container } from '@/components/layout/Page'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { StepProgress } from '@/components/ui/StepProgress'
import { QUESTIONS, UNKNOWN_OPTION, type QuestionOption } from '@/content/questions'
import type { FarmerAnswers } from '@/core'
import { cx } from '@/lib'
import { useSession } from '@/state/session'

interface OptionButtonProps {
  option: QuestionOption
  name: string
  selected: boolean
  onSelect: () => void
  /** "I don't know" is styled quieter than real answers. */
  quiet?: boolean
}

function OptionButton({ option, name, selected, onSelect, quiet }: OptionButtonProps) {
  const Icon = option.icon
  return (
    <label
      className={cx(
        'flex min-h-14 cursor-pointer items-center gap-3 rounded-card border-2 p-2 pr-4 sm:min-h-16 sm:p-3 sm:pr-4 transition-colors duration-fast ease-token',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
        selected ? 'border-selected bg-primary-soft shadow-glow-soft' : 'border-border bg-surface hover:border-border-strong',
        quiet && !selected && 'border-dashed',
      )}
    >
      <input type="radio" name={name} value={option.value} checked={selected} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control transition-colors duration-fast',
          selected ? 'neon-chip text-on-accent' : 'bg-surface-muted text-heading',
        )}
      >
        <Icon size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-snug text-text">{option.label}</span>
        {option.hint && <span className="block text-sm text-text-muted">{option.hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border-2',
          selected ? 'border-selected bg-accent text-on-accent' : 'border-border-strong',
        )}
      >
        {selected && <Check size={16} strokeWidth={3} />}
      </span>
    </label>
  )
}

export default function QuestionsPage() {
  const { field } = useSession()
  if (!field) {
    return (
      <Container className="py-10">
        <EmptyState
          headingLevel="h1"
          icon={MapPinOff}
          title="Pick your field first"
          action={
            <Button to="/field" iconRight={<ArrowRight size={20} />}>
              Pick my field
            </Button>
          }
        >
          The questions are about one field. Place a pin on the map, then come back.
        </EmptyState>
      </Container>
    )
  }
  return <Wizard />
}

function Wizard() {
  const { answers, setAnswer } = useSession()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const question = QUESTIONS[index]
  const selected = answers[question.id] as string | undefined
  const isLast = index === QUESTIONS.length - 1

  // Move focus to the new question so keyboard and screen-reader users follow along.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [index])

  const go = (step: number) => {
    setDirection(step)
    setIndex((i) => i + step)
  }
  const next = () => (isLast ? navigate('/results') : go(1))
  const back = () => (index === 0 ? navigate('/field') : go(-1))
  const select = (value: string) => setAnswer(question.id, value as FarmerAnswers[typeof question.id])

  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex max-w-2xl flex-1 flex-col pt-4 sm:pt-8">
        <StepProgress current={index + 1} total={QUESTIONS.length} label="Question" />

        <div className="flex-1 overflow-x-clip pb-6 pt-5">
          {/* Enter-only slide: the new question is readable at once, no blank frame. */}
          <m.fieldset
              key={question.id}
              initial={{ opacity: 0.5, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16, ease: [0.2, 0.7, 0.2, 1] }}
              className="m-0 min-w-0 border-0 p-0"
            >
              <legend className="mb-4 p-0 sm:mb-5">
                <h1 ref={headingRef} tabIndex={-1} className="text-2xl outline-none sm:text-3xl">
                  {question.title}
                </h1>
                <span className="mt-2 block text-lg text-text">{question.help}</span>
                <span className="mt-2 flex items-start gap-2 text-text-muted">
                  <Lightbulb size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                  <span>
                    <span className="sr-only">Why we ask: </span>
                    {question.why}
                  </span>
                </span>
              </legend>

              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {question.options.map((option) => (
                  <OptionButton
                    key={option.value}
                    option={option}
                    name={question.id}
                    selected={selected === option.value}
                    onSelect={() => select(option.value)}
                  />
                ))}
                <div className="sm:col-span-2">
                  <OptionButton
                    option={UNKNOWN_OPTION}
                    name={question.id}
                    selected={selected === UNKNOWN_OPTION.value}
                    onSelect={() => select(UNKNOWN_OPTION.value)}
                    quiet
                  />
                </div>
              </div>
            </m.fieldset>
        </div>
      </Container>

      {/* Sticky action bar keeps Back and Next within thumb reach. */}
      <div className="glass sticky bottom-0 border-t border-glass">
        <Container className="flex max-w-2xl gap-3 py-3">
          <Button variant="outline" size="lg" onClick={back} iconLeft={<ArrowLeft size={20} />}>
            Back
          </Button>
          <Button size="lg" onClick={next} disabled={!selected} iconRight={<ArrowRight size={22} />} className="flex-1">
            {isLast ? 'See results' : 'Next'}
          </Button>
        </Container>
      </div>
    </div>
  )
}
