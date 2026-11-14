import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { FarmerAnswers, FieldLocation, QuestionId } from '@/core'

/** What the farmer has entered so far. Kept for the browser tab only. */
interface SessionState {
  field: FieldLocation | null
  answers: FarmerAnswers
}

interface SessionContextValue extends SessionState {
  setField: (field: FieldLocation | null) => void
  setAnswer: <K extends QuestionId>(id: K, value: FarmerAnswers[K]) => void
  reset: () => void
}

const STORAGE_KEY = 'js-session'
const EMPTY: SessionState = { field: null, answers: {} }
const SessionContext = createContext<SessionContextValue | null>(null)

function load(): SessionState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<SessionState>
    return { field: parsed.field ?? null, answers: parsed.answers ?? {} }
  } catch {
    return EMPTY
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(load)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage can be blocked; the flow still works in memory.
    }
  }, [state])

  const setField = useCallback((field: FieldLocation | null) => {
    setState((s) => ({ ...s, field }))
  }, [])

  const setAnswer = useCallback(<K extends QuestionId>(id: K, value: FarmerAnswers[K]) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [id]: value } }))
  }, [])

  const reset = useCallback(() => setState(EMPTY), [])

  const value = useMemo(() => ({ ...state, setField, setAnswer, reset }), [state, setField, setAnswer, reset])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
