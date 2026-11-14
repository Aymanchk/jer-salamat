import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { FieldLocation } from '@/core'

/** Sokuluk district, Chuy region. */
export const SOKULUK_CENTER: FieldLocation = { lat: 42.86, lon: 74.3 }
const DEFAULT_ZOOM = 11

// A pin drawn with CSS token colours instead of Leaflet's default image.
const PIN_HTML = `
<svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true">
  <path d="M20 47C20 47 37 30.5 37 18.5C37 8.8 29.4 1 20 1S3 8.8 3 18.5C3 30.5 20 47 20 47Z" fill="currentColor" stroke="white" stroke-width="2"/>
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

interface FieldMapProps {
  value: FieldLocation | null
  onChange: (location: FieldLocation) => void
  className?: string
}

export default function FieldMap({ value, onChange, className }: FieldMapProps) {
  const icon = useMemo(
    () => L.divIcon({ className: 'field-pin', html: PIN_HTML, iconSize: [40, 48], iconAnchor: [20, 47] }),
    [],
  )

  return (
    <MapContainer
      center={value ? [value.lat, value.lon] : [SOKULUK_CENTER.lat, SOKULUK_CENTER.lon]}
      zoom={DEFAULT_ZOOM}
      minZoom={7}
      maxZoom={17}
      scrollWheelZoom
      className={className}
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ClickToPlace onPick={onChange} />
      <KeepInView value={value} />
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
