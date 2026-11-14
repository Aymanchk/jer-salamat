import { SearchX } from 'lucide-react'
import { Container } from '@/components/layout/Page'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'

export default function NotFoundPage() {
  return (
    <Container className="py-10">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState icon={SearchX} title="Page not found" action={<Button to="/">Go to home</Button>}>
        This page does not exist. It may have moved.
      </EmptyState>
    </Container>
  )
}
