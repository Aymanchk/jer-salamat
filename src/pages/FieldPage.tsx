import { ArrowRight, Info, LoaderCircle, LocateFixed, MapPin, Sparkles } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router'
import { CoachMarks } from '@/components/map/CoachMarks'
import type { FlyTarget } from '@/components/map/FieldMap'
import { PlaceSearch } from '@/components/map/PlaceSearch'
import { Button } from '@/components/ui/Button'
import DEMO_POINTS from '@/data/demoPoints.json'
import { useT } from '@/i18n'
import { cx, formatCoords } from '@/lib'
import { useSession } from '@/state/session'

const FieldMap = lazy(() => import('@/components/map/FieldMap'))

type GpsState = 'idle' | 'asking' | 'denied' | 'unavailable'

export default function FieldPage() {
  const { field, setField } = useSession()
  const { t, num, lang } = useT()
  const navigate = useNavigate()
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [gps, setGps] = useState<GpsState>('idle')
  const [tilesLoading, setTilesLoading] = useState(true)

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
        place(pos.coords.latitude, pos.coords.longitude, t('field.yourLocation'))
      },
      (err) => setGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="flex h-[calc(100dvh-var(--size-header)-var(--size-stepper)-2px)] flex-col lg:flex-row-reverse">
      <h1 className="sr-only">{t('field.h1')}</h1>

      {/* Map: fills the screen on mobile. */}
      <div className="relative min-h-0 flex-1" role="region" aria-label={t('field.mapLabel')}>
        <Suspense fallback={<div className="skeleton h-full w-full rounded-none" role="status" aria-label={t('field.loadingMap')} />}>
          <FieldMap
            value={field}
            onChange={(loc) => {
              setField(loc)
              setPlaceName(null)
            }}
            flyTarget={flyTarget}
            onTilesLoading={setTilesLoading}
            className="h-full w-full"
          />
        </Suspense>

        {/* Search and demo chips float over the map. */}
        <div className="absolute inset-x-0 top-0 z-[1000] flex flex-col gap-2 p-3 sm:p-4">
          <PlaceSearch onPick={(p) => place(p.lat, p.lon, p.name)} className="mx-auto w-full max-w-lg" />
          <div className="no-scrollbar mx-auto flex w-full max-w-lg gap-2 overflow-x-auto pr-6 [mask-image:linear-gradient(90deg,#000_82%,transparent)] sm:pr-0 sm:[mask-image:none]" role="group" aria-label={t('field.demoFields')}>
            {DEMO_POINTS.map((p) => {
              const selected = field?.lat === p.lat && field?.lon === p.lon
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => place(p.lat, p.lon, t('field.demo', { name: p.name }))}
                  aria-pressed={selected}
                  className={cx(
                    'glass inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-sm font-bold transition-colors duration-fast',
                    selected ? 'border-selected text-accent-text shadow-glow-soft' : 'border-glass text-text hover:border-border-strong',
                  )}
                >
                  <Sparkles size={14} aria-hidden="true" />
                  {p.name}
                  <span className="sr-only"> {t('field.demoField')}</span>
                </button>
              )
            })}
          </div>
        </div>

        {tilesLoading && (
          <p role="status" className="glass pointer-events-none absolute bottom-3 left-1/2 z-[1000] inline-flex -translate-x-1/2 items-center gap-2 rounded-pill border border-glass px-3 py-1.5 text-sm text-text">
            <LoaderCircle size={14} aria-hidden="true" className="animate-spin" />
            {t('field.tilesLoading')}
          </p>
        )}

        <CoachMarks />
      </div>

      {/* Panel: bottom sheet on mobile, side column on desktop. */}
      <div className="shrink-0 border-t border-border bg-surface shadow-raised lg:flex lg:w-[26rem] lg:flex-col lg:border-r lg:border-t-0 lg:shadow-none">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5 px-4 pb-4 pt-3 lg:gap-5 lg:p-8">
          <div className="hidden lg:block">
            <p className="text-2xl font-bold text-heading" aria-hidden="true">
              {t('field.title')}
            </p>
            <p className="mt-2 text-text-muted">{t('field.help')}</p>
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
              <p className="text-sm text-text-muted">{placeName ?? t('field.yourField')}</p>
              {field ? (
                <p className="truncate text-sm font-bold tabular-nums text-text sm:text-base lg:overflow-visible lg:whitespace-nowrap">{formatCoords(field.lat, field.lon, num, lang)}</p>
              ) : (
                <p className="font-bold text-text-muted">{t('field.noPin')}</p>
              )}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={gps === 'asking'}
              aria-describedby="gps-note"
              aria-label={t('field.useMyLocation')}
              className="inline-flex min-h-tap min-w-tap shrink-0 items-center justify-center gap-2 rounded-pill border-2 lg:w-full border-border-strong px-3 text-sm font-bold text-text hover:border-selected hover:bg-primary-soft"
            >
              {gps === 'asking' ? (
                <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
              ) : (
                <LocateFixed size={18} aria-hidden="true" />
              )}
              <span className="max-sm:hidden">{t('field.myLocation')}</span>
            </button>
          </div>

          <p id="gps-note" className="text-sm text-text-muted" role={gps === 'denied' || gps === 'unavailable' ? 'alert' : undefined}>
            {gps === 'denied' && t('field.gpsDenied')}
            {gps === 'unavailable' && t('field.gpsFailed')}
            {(gps === 'idle' || gps === 'asking') && (
              <>
                <span className="lg:hidden">{t('field.gpsShort')}</span>
                <span className="max-lg:hidden">
                  {t('field.gpsLong')}
                </span>
              </>
            )}
          </p>

          <p className="hidden items-start gap-2 rounded-control bg-surface-muted p-3 text-sm text-text sm:flex">
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            {t('field.regional')}
          </p>

          <Button size="lg" block disabled={!field} onClick={() => navigate('/questions')} iconRight={<ArrowRight size={22} />}>
            {t('field.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
