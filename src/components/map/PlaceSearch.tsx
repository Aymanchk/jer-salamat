import { LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cx } from '@/lib'

export interface Place {
  name: string
  detail: string
  lat: number
  lon: number
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  name?: string
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const DEBOUNCE_MS = 500
/** Nominatim usage policy: at most 1 request per second. */
const MIN_GAP_MS = 1000
/** Prefer results in the Chuy region, but do not exclude the rest of Kyrgyzstan. */
const CHUY_VIEWBOX = '72.8,43.3,76.2,42.4'

let lastRequestAt = 0

async function searchPlaces(query: string, signal: AbortSignal): Promise<Place[]> {
  const wait = lastRequestAt + MIN_GAP_MS - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  lastRequestAt = Date.now()

  const params = new URLSearchParams({
    format: 'json',
    countrycodes: 'kg',
    limit: '5',
    viewbox: CHUY_VIEWBOX,
    'accept-language': 'en',
    q: query,
  })
  const res = await fetch(`${ENDPOINT}?${params}`, { signal })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const rows = (await res.json()) as NominatimResult[]
  return rows.slice(0, 5).map((r) => {
    const parts = r.display_name.split(',').map((p) => p.trim())
    return {
      name: r.name || parts[0],
      detail: parts.slice(1, 4).join(', '),
      lat: Number(r.lat),
      lon: Number(r.lon),
    }
  })
}

type Status = 'idle' | 'loading' | 'done' | 'error'

interface PlaceSearchProps {
  onPick: (place: Place) => void
  className?: string
}

/** "Search your village or town", backed by OpenStreetMap Nominatim. */
export function PlaceSearch({ onPick, className }: PlaceSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setStatus('idle')
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setStatus('loading')
      searchPlaces(q, controller.signal)
        .then((places) => {
          setResults(places)
          setActive(-1)
          setStatus('done')
        })
        .catch((err: unknown) => {
          if ((err as Error).name === 'AbortError') return
          setResults([])
          setStatus('error')
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Close the list when tapping elsewhere.
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  const pick = (place: Place) => {
    onPick(place)
    setQuery(place.name)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      const target = results[active] ?? results[0]
      if (target) {
        e.preventDefault()
        pick(target)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && query.trim().length >= 2 && status !== 'idle'

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <div className="glass flex items-center gap-2 rounded-pill border border-glass px-4 shadow-raised focus-within:border-selected">
        {status === 'loading' ? (
          <LoaderCircle size={20} aria-hidden="true" className="shrink-0 animate-spin text-accent-text" />
        ) : (
          <Search size={20} aria-hidden="true" className="shrink-0 text-text-muted" />
        )}
        <input
          type="search"
          role="combobox"
          aria-label="Search your village or town"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Search your village or town"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          className="min-h-tap w-full min-w-0 bg-transparent text-base text-text outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            aria-label="Clear search"
            className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-text-muted hover:text-text"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {showList && (
        <div className="glass absolute inset-x-0 top-full z-popover mt-2 overflow-hidden rounded-card border border-glass shadow-raised">
          <ul id={listId} role="listbox" aria-label="Places">
            {results.map((place, i) => (
              <li
                key={`${place.lat},${place.lon}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(place)}
                className={cx(
                  'flex min-h-tap cursor-pointer items-center gap-3 px-4 py-2',
                  i === active ? 'bg-primary-soft' : 'hover:bg-primary-soft',
                )}
              >
                <MapPin size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-text">{place.name}</span>
                  <span className="block truncate text-sm text-text-muted">{place.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p role="status" className="px-4 py-3 text-sm text-text-muted empty:hidden">
            {status === 'loading' && results.length === 0 ? 'Searching…' : ''}
            {status === 'done' && results.length === 0 ? 'No places found. Try another spelling, or tap the map.' : ''}
            {status === 'error' ? 'Search is not available right now. Tap the map to place your pin instead.' : ''}
          </p>
          <p className="border-t border-border px-4 py-1.5 text-sm text-text-muted">Search by OpenStreetMap</p>
        </div>
      )}
    </div>
  )
}
