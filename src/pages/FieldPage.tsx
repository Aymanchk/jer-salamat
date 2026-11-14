import { ArrowRight, Info, LoaderCircle, LocateFixed, MapPin, Sparkles } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router'
import { CoachMarks } from '@/components/map/CoachMarks'
import type { FlyTarget } from '@/components/map/FieldMap'
import { PlaceSearch } from '@/components/map/PlaceSearch'
import { Button } from '@/components/ui/Button'
import DEMO_POINTS from '@/data/demoPoints.json'
import { cx, formatCoords } from '@/lib'
import { useSession } from '@/state/session'

const FieldMap = lazy(() => import('@/components/map/FieldMap'))

type GpsState = 'idle' | 'asking' | 'denied' | 'unavailable'

export default function FieldPage() {
  const { field, setField } = useSession()
  const navigate = useNavigate()
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [gps, setGps] = useState<GpsState>('idle')

  const place = (lat: number, lon: number, name: string | null, zoom = 13) => {
    setField({ lat, lon })
    setPlaceName(name)
    setFlyTarget({ lat, lon, zoom })
  }

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGps('unavailable')
      return
    }
    setGps('asking')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps('idle')
        place(pos.coords.latitude, pos.coords.longitude, 'Your location', 15)
      },
      (err) => setGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="flex h-[calc(100dvh-var(--size-header)-var(--size-stepper))] flex-col lg:flex-row-reverse">
      <h1 className="sr-only">Pick your field</h1>

      {/* Map: fills the screen on mobile. */}
      <div className="relative min-h-0 flex-1" role="region" aria-label="Map of Sokuluk district. Tap to place a pin on your field.">
        <Suspense fallback={<div className="skeleton h-full w-full rounded-none" role="status" aria-label="Loading map" />}>
          <FieldMap
            value={field}
            onChange={(loc) => {
              setField(loc)
              setPlaceName(null)
            }}
            flyTarget={flyTarget}
            className="h-full w-full"
          />
        </Suspense>

        {/* Search and demo chips float over the map. */}
        <div className="absolute inset-x-0 top-0 z-[1000] flex flex-col gap-2 p-3 sm:p-4">
          <PlaceSearch onPick={(p) => place(p.lat, p.lon, p.name)} className="mx-auto w-full max-w-lg" />
          <div className="no-scrollbar mx-auto flex w-full max-w-lg gap-2 overflow-x-auto" role="group" aria-label="Demo fields">
            {DEMO_POINTS.map((p) => {
              const selected = field?.lat === p.lat && field?.lon === p.lon
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => place(p.lat, p.lon, `${p.name} (demo)`, 14)}
                  aria-pressed={selected}
                  className={cx(
                    'glass inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-sm font-bold transition-colors duration-fast',
                    selected ? 'border-selected text-accent-text shadow-glow-soft' : 'border-glass text-text hover:border-border-strong',
                  )}
                >
                  <Sparkles size={14} aria-hidden="true" />
                  {p.name}
                  <span className="sr-only"> demo field</span>
                </button>
              )
            })}
          </div>
        </div>

        <CoachMarks />
      </div>

      {/* Panel: bottom sheet on mobile, side column on desktop. */}
      <div className="shrink-0 border-t border-border bg-surface shadow-raised lg:flex lg:w-[26rem] lg:flex-col lg:border-r lg:border-t-0 lg:shadow-none">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 p-4 lg:gap-5 lg:p-8">
          <div className="hidden lg:block">
            <p className="text-2xl font-bold text-heading" aria-hidden="true">
              Where is your field?
            </p>
            <p className="mt-2 text-text-muted">Search your village, tap the map, or use your location. Drag the pin to adjust.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className={cx(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill',
                field ? 'neon-chip text-on-accent' : 'bg-primary-soft text-heading',
              )}
            >
              <MapPin size={22} />
            </span>
            <div className="min-w-0 flex-1" aria-live="polite">
              <p className="text-sm text-text-muted">{placeName ?? 'Your field'}</p>
              {field ? (
                <p className="truncate text-sm font-bold tabular-nums text-text sm:text-base lg:overflow-visible lg:whitespace-nowrap">{formatCoords(field.lat, field.lon)}</p>
              ) : (
                <p className="font-bold text-text-muted">No pin yet</p>
              )}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={gps === 'asking'}
              aria-describedby="gps-note"
              aria-label="Use my location"
              className="inline-flex min-h-tap min-w-tap shrink-0 items-center justify-center gap-2 rounded-pill border-2 lg:w-full border-border-strong px-3 text-sm font-bold text-text hover:border-selected hover:bg-primary-soft"
            >
              {gps === 'asking' ? (
                <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
              ) : (
                <LocateFixed size={18} aria-hidden="true" />
              )}
              <span className="max-sm:hidden">My location</span>
            </button>
          </div>

          <p id="gps-note" className="text-sm text-text-muted" role={gps === 'denied' || gps === 'unavailable' ? 'alert' : undefined}>
            {gps === 'denied' && 'Location permission was blocked. Search your village or tap the map instead.'}
            {gps === 'unavailable' && 'We could not get your location. Search your village or tap the map instead.'}
            {(gps === 'idle' || gps === 'asking') &&
              '"My location" asks your browser for permission. We use it only to place the pin and load climate data for that spot. We do not save it.'}
          </p>

          <p className="hidden items-start gap-2 rounded-control bg-surface-muted p-3 text-sm text-text sm:flex">
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            NASA POWER shows the climate of the wider area (about 50 km), not exact field measurements.
          </p>

          <Button size="lg" block disabled={!field} onClick={() => navigate('/questions')} iconRight={<ArrowRight size={22} />}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
