import { ArrowRight, Info, LocateFixed, MapPin } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { StepProgress } from '@/components/ui/StepProgress'
import { formatCoords } from '@/lib'
import { useSession } from '@/state/session'

const FieldMap = lazy(() => import('@/components/map/FieldMap'))

/** Kept in sync with SOKULUK_CENTER in FieldMap (not imported, to keep Leaflet lazy). */
const DISTRICT_CENTER = { lat: 42.86, lon: 74.3 }

export default function FieldPage() {
  const { field, setField } = useSession()
  const navigate = useNavigate()

  return (
    <div className="flex h-[calc(100dvh-var(--size-header))] flex-col lg:flex-row-reverse">
      <h1 className="sr-only">Pick your field</h1>

      {/* Map: fills the screen on mobile. */}
      <div className="relative min-h-0 flex-1" role="region" aria-label="Map of Sokuluk district. Tap to place a pin on your field.">
        <Suspense fallback={<div className="skeleton h-full w-full rounded-none" role="status" aria-label="Loading map" />}>
          <FieldMap value={field} onChange={setField} className="h-full w-full" />
        </Suspense>

        {!field && (
          <p className="pointer-events-none absolute left-1/2 top-3 z-[1000] inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-pill bg-primary px-4 py-2 font-bold text-on-primary shadow-raised">
            <MapPin size={18} aria-hidden="true" className="text-accent" />
            Tap the map on your field
          </p>
        )}
      </div>

      {/* Panel: bottom sheet on mobile, side column on desktop. */}
      <div className="shrink-0 border-t border-border bg-surface shadow-raised lg:flex lg:w-[26rem] lg:flex-col lg:border-r lg:border-t-0 lg:shadow-none">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 p-4 lg:gap-5 lg:p-8">
          <StepProgress current={1} total={3} className="hidden lg:block" />
          <div className="hidden lg:block">
            <p className="text-2xl font-bold text-heading" aria-hidden="true">
              Pick your field
            </p>
            <p className="mt-2 text-text-muted">Tap the map to place a pin. You can drag the pin to move it.</p>
          </div>

          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-heading">
              <MapPin size={22} />
            </span>
            <div className="min-w-0 flex-1" aria-live="polite">
              <p className="text-sm text-text-muted">Your field</p>
              {field ? (
                <p className="whitespace-nowrap font-bold tabular-nums text-text">{formatCoords(field.lat, field.lon)}</p>
              ) : (
                <p className="font-bold text-text-muted">No pin yet. Tap the map.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setField(DISTRICT_CENTER)}
              aria-label="Use the district centre"
              title="Use the district centre"
              className="inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-control border-2 border-border-strong text-heading hover:border-selected hover:bg-primary-soft"
            >
              <LocateFixed size={22} aria-hidden="true" />
            </button>
          </div>

          <p className="flex items-start gap-2 rounded-control bg-surface-muted p-3 text-sm text-text">
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-heading" />
            NASA POWER shows regional climate, not exact field measurements.
          </p>

          <Button
            size="lg"
            block
            disabled={!field}
            onClick={() => navigate('/questions')}
            iconRight={<ArrowRight size={22} />}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
