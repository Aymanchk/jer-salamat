import type { GlossaryId } from '@/content/glossary'
import { useT } from '@/i18n'
import { InfoTooltip } from './InfoTooltip'

interface TermProps {
  id: GlossaryId
  /** Text to show. Defaults to the glossary term. */
  children?: string
  align?: 'left' | 'right'
}

/** A technical word with a small "i" that explains it in plain words. */
export function Term({ id, children, align = 'left' }: TermProps) {
  const { t } = useT()
  const term = t(`gl.${id}.term`)
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="underline decoration-dotted decoration-2 underline-offset-4">{children ?? term}</span>
      <span className="relative top-1 ml-1 inline-flex">
        <InfoTooltip label={t('gl.whatIs', { term: term.toLowerCase() })} align={align}>
          {t(`gl.${id}.meaning`)}
        </InfoTooltip>
      </span>
    </span>
  )
}
