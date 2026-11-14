import { GLOSSARY, type GlossaryId } from '@/content/glossary'
import { InfoTooltip } from './InfoTooltip'

interface TermProps {
  id: GlossaryId
  /** Text to show. Defaults to the glossary term. */
  children?: string
  align?: 'left' | 'right'
}

/** A technical word with a small "i" that explains it in plain English. */
export function Term({ id, children, align = 'left' }: TermProps) {
  const entry = GLOSSARY[id]
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="underline decoration-dotted decoration-2 underline-offset-4">{children ?? entry.term}</span>
      <span className="relative top-1 ml-1 inline-flex">
        <InfoTooltip label={`What is ${entry.term.toLowerCase()}?`} align={align}>
          {entry.meaning}
        </InfoTooltip>
      </span>
    </span>
  )
}
