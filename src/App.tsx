import { AnimatePresence, domAnimation, LazyMotion, m, MotionConfig } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import LandingPage from '@/pages/LandingPage'
import { SessionProvider } from '@/state/session'
import { ThemeProvider } from '@/state/theme'

// The landing page ships in the first bundle. Heavier pages
// (map, charts) load only when the farmer reaches them.
const FieldPage = lazy(() => import('@/pages/FieldPage'))
const QuestionsPage = lazy(() => import('@/pages/QuestionsPage'))
const ResultsPage = lazy(() => import('@/pages/ResultsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/** Pages that fill the screen themselves and do not show the footer. */
const FULL_SCREEN = ['/field', '/questions']

function Shell() {
  const location = useLocation()
  const fullScreen = FULL_SCREEN.includes(location.pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-popover focus:rounded-control focus:bg-accent focus:px-4 focus:py-3 focus:font-bold focus:text-on-accent"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={location.pathname}
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <Suspense fallback={<LoadingSkeleton variant="page" label="Loading page" />}>
              <Routes location={location}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/field" element={<FieldPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </m.div>
        </AnimatePresence>
      </main>
      {!fullScreen && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <Shell />
            </BrowserRouter>
          </MotionConfig>
        </LazyMotion>
      </SessionProvider>
    </ThemeProvider>
  )
}
