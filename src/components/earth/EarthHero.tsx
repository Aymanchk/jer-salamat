import { MapPin } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useCanRender3D } from '@/hooks/useDeviceCapability'
import { cx } from '@/lib'

// three.js is only downloaded when the device can run it.
const EarthScene = lazy(() => import('./EarthScene'))

/**
 * Landing hero visual.
 * Always paints a light static globe first. On capable devices it then
 * loads the 3D Earth in the background and fades it in over the picture.
 */
export function EarthHero({ className }: { className?: string }) {
  const canRender3D = useCanRender3D()
  const [load3D, setLoad3D] = useState(false)
  const [ready, setReady] = useState(false)
  const [settled, setSettled] = useState(false)
  const [visible, setVisible] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  // Wait until the page is idle so the 3D code never competes with first paint.
  useEffect(() => {
    if (!canRender3D) return
    const start = () => setLoad3D(true)
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(start, { timeout: 2500 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(start, 1200)
    return () => clearTimeout(id)
  }, [canRender3D])

  // Stop rendering when the hero is scrolled out of view.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const show3D = load3D && ready

  return (
    <div ref={ref} className={cx('relative mx-auto aspect-square w-full', className)}>
      {/* Soft atmosphere glow around the globe. */}
      <div aria-hidden="true" className="globe-atmosphere pointer-events-none absolute -inset-[7%] rounded-pill" />
      <img
        src="/globe-fallback.svg"
        width={480}
        height={480}
        alt="Globe centred on Central Asia, with Kyrgyzstan outlined and the Chuy Valley marked."
        fetchPriority="high"
        className={cx('h-full w-full transition-opacity duration-slow ease-token', show3D && 'opacity-0')}
      />

      {load3D && (
        <div
          aria-hidden="true"
          className={cx(
            'absolute inset-0 overflow-hidden rounded-pill transition-opacity duration-slow ease-token',
            show3D ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Suspense fallback={null}>
            <EarthScene active={visible} onReady={() => setReady(true)} onSettled={() => setSettled(true)} />
          </Suspense>
        </div>
      )}

      {/* The 3D view ends centred on the valley, so the label sits at the centre. */}
      {show3D && settled && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="globe-pulse absolute h-10 w-10 rounded-pill border-2 border-accent" />
        </div>
      )}

      <p className="glass absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-pill border border-glass px-3 py-1.5 text-sm font-bold text-text shadow-card">
        <MapPin size={16} aria-hidden="true" className="text-accent-text" />
        Chuy Valley, Kyrgyzstan
      </p>
    </div>
  )
}
