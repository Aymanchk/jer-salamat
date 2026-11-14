import { ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/layout/Page'
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
      <Container className="pt-6 sm:pt-10">
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent-text">{t('about.eyebrow')}</p>
        <h1 className="max-w-3xl text-3xl sm:text-4xl">{t('about.title')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-text-muted">{t('about.text')}</p>
        <div className="mt-6 flex max-w-3xl gap-3 rounded-card border border-border bg-surface p-4">
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
        <dl className="grid gap-4 md:grid-cols-2">
          {Object.entries(GLOSSARY).map(([id, entry]) => (
            <Card key={id} id={`term-${id}`}>
              <dt className="text-lg font-bold text-heading">{t(`gl.${id}.term`)}</dt>
              <dd className="mt-1 text-text-muted">
                {t(`gl.${id}.meaning`)}
                {entry.source && (
                  <a href={entry.source} target="_blank" rel="noreferrer" className="mt-2 flex min-h-11 items-center break-all text-sm text-heading underline underline-offset-4">
                    {t('about.source')}: {entry.source.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </dd>
            </Card>
          ))}
        </dl>
      </Section>

      <Section labelledBy="about-limits">
        <SectionHeading id="about-limits" title={t('about.limits')}>
          {t('about.limitsText')}
        </SectionHeading>
        <Card padding="lg">
          <ul className="space-y-3">
            {LIMITATIONS.map((key) => (
              <li key={key} className="flex gap-3">
                <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </Card>
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
    </>
  )
}
