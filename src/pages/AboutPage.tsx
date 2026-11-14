import { BookA, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react'
import { m } from 'motion/react'
import { SproutRow } from '@/components/fx/SproutRow'
import { Container, Section, SectionHeading } from '@/components/layout/Page'
import { AccordionItem } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { LIMITATIONS, NASA_SOURCE, REFERENCE_SOURCES, TEAM } from '@/content/about'
import { GLOSSARY } from '@/content/glossary'
import { useT } from '@/i18n'

function SourceLink({ url }: { url: string }) {
  const { t } = useT()
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-auto inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4">
      {t('about.open')}
      <ExternalLink size={16} aria-hidden="true" />
      <span className="sr-only">{t('about.newTab')}</span>
    </a>
  )
}

export default function AboutPage() {
  const { t } = useT()
  return (
    <>
      <Container className="pt-8 sm:pt-14">
        <m.p
          className="mb-3 inline-flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="live-dot" aria-hidden="true" />
          {t('about.eyebrow')}
        </m.p>
        <h1 className="max-w-3xl text-[2.5rem] leading-[1.02] sm:text-6xl">
          {[t('about.title1'), t('about.title2')].map((line, i) => (
            <span key={i} className="block overflow-hidden pb-[0.1em]">
              <m.span
                className={i === 1 ? 'block text-accent-text' : 'block'}
                initial={{ y: '70%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </m.span>
            </span>
          ))}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-muted">{t('about.text')}</p>
        <div className="mt-6 flex max-w-3xl gap-3 rounded-card border border-accent-text/40 bg-accent-soft p-4">
          <ShieldCheck size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
          <div>
            <h2 className="text-lg">{t('about.policyTitle')}</h2>
            <p className="mt-1 text-text-muted">{t('about.policy')}</p>
          </div>
        </div>
      </Container>

      <Section labelledBy="about-sources">
        <SectionHeading id="about-sources" title={t('about.sources')} />
        <Card className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl">NASA POWER</h3>
            <Badge type="historical" />
          </div>
          <p className="text-text-muted">{t('nasa.what')}</p>
          <p>
            <span className="font-bold">{t('about.usedFor')} </span>
            {t('nasa.use')}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-text">
            <li>{t('nasa.var.t2m')}</li>
            <li>{t('nasa.var.prec')}</li>
            <li>{t('nasa.var.gwet')}</li>
          </ul>
          <p className="text-text-muted">
            <span className="font-bold text-text">{t('about.period')} </span>
            {t('nasa.period')}
            <br />
            <span className="font-bold text-text">{t('about.uncertainty')} </span>
            {t('nasa.resolution')}. {t('limit.1')}
          </p>
          <SourceLink url={NASA_SOURCE.url} />
        </Card>
      </Section>

      <Section labelledBy="about-refs">
        <SectionHeading id="about-refs" title={t('about.references')}>
          {t('about.policy')}
        </SectionHeading>
        <ul className="grid gap-4 md:grid-cols-2">
          {REFERENCE_SOURCES.map((s) => (
            <Card as="li" key={s.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge type={s.kind === 'future' ? 'placeholder' : 'reference'} />
              </div>
              <h3 className="text-lg">{t(`src.${s.id}.name`)}</h3>
              <p className="text-text-muted">{t(`src.${s.id}.note`)}</p>
              <p className="text-sm text-text-muted">
                <span className="font-bold text-text">{t('about.source')}: </span>
                {s.publisher} · {s.year}
                <br />
                <span className="font-bold text-text">{t('about.unit')} </span>
                {s.unit}
              </p>
              <SourceLink url={s.url} />
            </Card>
          ))}
        </ul>
      </Section>

      <Section labelledBy="about-glossary">
        <SectionHeading id="about-glossary" title={t('about.glossary')}>
          {t('about.glossaryText')}
        </SectionHeading>
        <div className="rounded-card border border-border bg-surface px-5 py-1">
          {Object.entries(GLOSSARY).map(([id, entry]) => (
            <div key={id} id={`term-${id}`}>
              <AccordionItem title={t(`gl.${id}.term`)} icon={BookA}>
                <p>{t(`gl.${id}.meaning`)}</p>
                {entry.source && (
                  <a href={entry.source} target="_blank" rel="noreferrer" className="mt-2 flex min-h-11 items-center break-all text-sm text-heading underline underline-offset-4">
                    {t('about.source')}: {entry.source.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </AccordionItem>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="about-limits">
        <SectionHeading id="about-limits" title={t('about.limits')}>
          {t('about.limitsText')}
        </SectionHeading>
        <ul className="grid gap-3 md:grid-cols-2">
          {LIMITATIONS.map((key, i) => (
            <m.li
              key={key}
              className="flex gap-3 rounded-card border border-border bg-surface p-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: (i % 2) * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-wheat" />
              <span>{t(key)}</span>
            </m.li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="about-team">
        <SectionHeading id="about-team" title={t('about.team')} />
        {TEAM.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((name) => (
              <Card as="li" key={name} className="font-bold">
                {name}
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState title={t('about.teamEmpty')} compact>
            {t('about.teamNote')}
          </EmptyState>
        )}
      </Section>
      <SproutRow className="mt-section h-24 sm:h-32" count={22} />
    </>
  )
}
