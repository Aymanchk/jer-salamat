import { ExternalLink, TriangleAlert } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/layout/Page'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { DATA_SOURCES, LIMITATIONS, TEAM } from '@/content/about'
import { GLOSSARY } from '@/content/glossary'

export default function AboutPage() {
  return (
    <>
      <Container className="pt-6 sm:pt-10">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent-text">About</p>
        <h1 className="max-w-3xl text-3xl sm:text-4xl">Data sources and limits</h1>
        <p className="mt-3 max-w-2xl text-lg text-text-muted">
          Jer Salamat helps farmers in the Chuy Valley compare crop rotation plans using open climate data. It was
          built for the NASA Space Apps Challenge 2026, challenge "Field Shift: Adapting Farms with NASA Data".
        </p>
      </Container>

      <Section labelledBy="about-sources">
        <SectionHeading id="about-sources" title="Data sources" />
        <ul className="grid gap-4">
          {DATA_SOURCES.map((source) => (
            <Card as="li" key={source.name} className="flex flex-col gap-2">
              <h3 className="text-xl">{source.name}</h3>
              <p className="text-text-muted">{source.what}</p>
              <p>
                <span className="font-bold">Used for: </span>
                {source.use}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-text">
                {source.variables.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p className="text-text-muted">
                <span className="font-bold text-text">Period: </span>
                {source.period}
                <br />
                <span className="font-bold text-text">Resolution: </span>
                {source.resolution}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex min-h-tap items-center gap-2 font-bold text-heading underline underline-offset-4"
              >
                Open website
                <ExternalLink size={16} aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Card>
          ))}
        </ul>
      </Section>

      <Section labelledBy="about-glossary">
        <SectionHeading id="about-glossary" title="Glossary">
          The technical words in this app, in plain English.
        </SectionHeading>
        <dl className="grid gap-4 md:grid-cols-2">
          {Object.entries(GLOSSARY).map(([id, entry]) => (
            <Card key={id} id={`term-${id}`}>
              <dt className="text-lg font-bold text-heading">{entry.term}</dt>
              <dd className="mt-1 text-text-muted">{entry.meaning}</dd>
            </Card>
          ))}
        </dl>
      </Section>

      <Section labelledBy="about-limits">
        <SectionHeading id="about-limits" title="Limitations">
          Please read these before you use a plan on your farm.
        </SectionHeading>
        <Card padding="lg">
          <ul className="space-y-3">
            {LIMITATIONS.map((item) => (
              <li key={item} className="flex gap-3">
                <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section labelledBy="about-team">
        <SectionHeading id="about-team" title="Team" />
        {TEAM.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((name) => (
              <Card as="li" key={name} className="font-bold">
                {name}
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState title="Team names will be added here" compact>
            <span className="mb-2 block">
              <Badge type="placeholder" />
            </span>
            Names only. No photos.
          </EmptyState>
        )}
      </Section>
    </>
  )
}
