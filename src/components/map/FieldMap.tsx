import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet'
import type { FieldLocation } from '@/core'

/** Sokuluk district, Chuy region. */
export const SOKULUK_CENTER: FieldLocation = { lat: 42.86, lon: 74.3 }
const DEFAULT_ZOOM = 11
/** Highest zoom the map flies to; closer than this the farmland tiles get blurry. */
export const MAX_FLY_ZOOM = 13
/** Kyrgyzstan, with a little padding. The map cannot be dragged far outside it. */
const KG_BOUNDS = L.latLngBounds([38.9, 68.9], [43.6, 80.6])

/**
 * Tile providers, in order. Both need no API key.
 * OpenStreetMap standard tiles first; Esri World Street Map as automatic backup.
 * (CARTO was removed: it answers 200 OK with an "API KEY REQUIRED" image.)
 */
const PROVIDERS = [
  {
    id: 'osm',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
]
/** After this many failed tiles, switch to the next provider. */
const MAX_TILE_ERRORS = 3

// A pin drawn with CSS token colours instead of Leaflet's default image.
const PIN_HTML = `
<span class="field-pin-ring"></span>
<svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true">
  <path class="field-pin-body" d="M20 47C20 47 37 30.5 37 18.5C37 8.8 29.4 1 20 1S3 8.8 3 18.5C3 30.5 20 47 20 47Z" fill="currentColor" stroke-width="2"/>
  <circle class="field-pin-dot" cx="20" cy="18.5" r="6.5"/>
</svg>`

function ClickToPlace({ onPick }: { onPick: (location: FieldLocation) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lon: event.latlng.lng })
    },
  })
  return null
}

/** Keeps the pin on screen when it is set from outside the map (for example a button). */
function KeepInView({ value }: { value: FieldLocation | null }) {
  const map = useMap()
  useEffect(() => {
    if (!value) return
    const point = L.latLng(value.lat, value.lon)
    if (!map.getBounds().pad(-0.15).contains(point)) map.panTo(point)
  }, [map, value])
  return null
}

/**
 * The lowest zoom at which Kyrgyzstan still fills the whole map, so zooming out
 * never shows a small square of tiles on an empty background.
 */
function FillMinZoom() {
  const map = useMap()
  useEffect(() => {
    const update = () => {
      const fill = map.getBoundsZoom(KG_BOUNDS, true)
      map.setMinZoom(Math.max(7, Math.ceil(fill)))
    }
    update()
    map.on('resize', update)
    return () => {
      map.off('resize', update)
    }
  }, [map])
  return null
}

/** Smoothly moves the map to a place picked from search, GPS or a demo chip. */
function FlyTo({ target }: { target: FlyTarget | null }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.flyTo([target.lat, target.lon], Math.min(target.zoom ?? MAX_FLY_ZOOM, MAX_FLY_ZOOM), { animate: !reduced, duration: 1 })
  }, [map, target])
  return null
}

export interface FlyTarget extends FieldLocation {
  zoom?: number
}

interface FieldMapProps {
  value: FieldLocation | null
  onChange: (location: FieldLocation) => void
  /** A new object here makes the map fly to it. */
  flyTarget?: FlyTarget | null
  /** True while map tiles are downloading (the pin and search work meanwhile). */
  onTilesLoading?: (loading: boolean) => void
  /** Called when the main tile provider failed and the backup is in use. */
  onBackupTiles?: () => void
  className?: string
}

export default function FieldMap({ value, onChange, flyTarget = null, onTilesLoading, onBackupTiles, className }: FieldMapProps) {
  const icon = useMemo(
    () => L.divIcon({ className: 'field-pin', html: PIN_HTML, iconSize: [40, 48], iconAnchor: [20, 47] }),
    [],
  )
  const [provider, setProvider] = useState(0)
  const errors = useRef(0)
  const tiles = PROVIDERS[provider]

  return (
    <MapContainer
      center={value ? [value.lat, value.lon] : [SOKULUK_CENTER.lat, SOKULUK_CENTER.lon]}
      zoom={DEFAULT_ZOOM}
      minZoom={7}
      maxZoom={18}
      maxBounds={KG_BOUNDS}
      maxBoundsViscosity={1}
      scrollWheelZoom
      zoomControl={false}
      className={className}
      attributionControl
    >
      <TileLayer
        key={tiles.id}
        url={tiles.url}
        attribution={tiles.attribution}
        keepBuffer={4}
        maxZoom={tiles.maxZoom}
        eventHandlers={{
          loading: () => onTilesLoading?.(true),
          load: () => onTilesLoading?.(false),
          tileerror: () => {
            errors.current += 1
            if (errors.current > MAX_TILE_ERRORS && provider < PROVIDERS.length - 1) {
              errors.current = 0
              setProvider((p) => p + 1)
              onBackupTiles?.()
            }
          },
        }}
      />
      <FillMinZoom />
      <ClickToPlace onPick={onChange} />
      <KeepInView value={value} />
      <FlyTo target={flyTarget} />
      <ZoomControl position="bottomright" />
      {value && (
        <Marker
          position={[value.lat, value.lon]}
          icon={icon}
          draggable
          alt="Your field"
          eventHandlers={{
            dragend(event) {
              const { lat, lng } = (event.target as L.Marker).getLatLng()
              onChange({ lat, lon: lng })
            },
          }}
        />
      )}
    </MapContainer>
  )
}
