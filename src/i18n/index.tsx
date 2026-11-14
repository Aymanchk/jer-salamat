import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Msg, MsgParam } from '@/core'
import { en } from './en'
import { ru } from './ru'

/** Supported languages. Add 'ky' here and a ky.ts dictionary to add Kyrgyz. */
export type Lang = 'en' | 'ru'
export const LANGS: Array<{ id: Lang; label: string; name: string }> = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'ru', label: 'RU', name: 'Русский' },
]
const DICTS: Record<Lang, Record<string, string>> = { en, ru }
const LOCALES: Record<Lang, string> = { en: 'en-US', ru: 'ru-RU' }
const STORAGE_KEY = 'js-lang'

function readInitial(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'ru') return v
  } catch {
    // Storage blocked: fall back to English.
  }
  return 'en'
}

export type TFunc = (key: string, params?: Record<string, MsgParam>) => string

interface LangContextValue {
  lang: Lang
  locale: string
  setLang: (lang: Lang) => void
  t: TFunc
  /** Translates an engine message. */
  tm: (msg: Msg) => string
  /** Formats a number for the current language. */
  num: (n: number, digits?: number, sign?: boolean) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial)
  const locale = LOCALES[lang]

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the choice lasts for this visit.
    }
  }, [])

  const value = useMemo<LangContextValue>(() => {
    const dict = DICTS[lang]
    const num = (n: number, digits = 0, sign = false) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        signDisplay: sign ? 'exceptZero' : 'auto',
      }).format(n)
    const t: TFunc = (key, params) => {
      let text = dict[key] ?? en[key] ?? key
      if (!params) return text
      for (const [name, value] of Object.entries(params)) {
        let shown: string
        if (typeof value === 'string') shown = value
        else if ('n' in value) shown = num(value.n, value.d ?? 0, value.sign ?? false)
        else if ('plan' in value) shown = t(`plan.${value.plan}.title`)
        else {
          const names = value.crops.map((c) => t(`crop.${c}`).toLocaleLowerCase(locale))
          shown =
            value.sep === 'arrow'
              ? names.join(' → ')
              : names.length <= 1
                ? (names[0] ?? '')
                : `${names.slice(0, -1).join(', ')} ${t('list.and')} ${names[names.length - 1]}`
        }
        text = text.split(`{${name}}`).join(shown)
      }
      return text
    }
    return { lang, locale, setLang, t, tm: (msg) => t(msg.key, msg.params), num }
  }, [lang, locale, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useT(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useT must be used inside LangProvider')
  return ctx
}
