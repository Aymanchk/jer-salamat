import { SearchX } from 'lucide-react'
import { Container } from '@/components/layout/Page'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { useT } from '@/i18n'

export default function NotFoundPage() {
  const { t } = useT()
  return (
    <Container className="py-10">
      <EmptyState headingLevel="h1" icon={SearchX} title={t('state.notFound')} action={<Button to="/">{t('state.goHome')}</Button>}>
        {t('state.notFoundBody')}
      </EmptyState>
    </Container>
  )
}
