import { useMemo } from 'react'
import { useTheme } from '@/state/theme'

/**
 * Reads design tokens (CSS variables) as plain strings, for canvas-based
 * libraries such as Chart.js and three.js that cannot use CSS classes.
 * Re-reads when the theme changes.
 */
export function useTokens<T extends string>(names: readonly T[]): Record<T, string> {
  const { theme } = useTheme()
  const key = names.join(',')
  return useMemo(() => {
    // The provider's effect sets this too, but children compute first.
    document.documentElement.dataset.theme = theme
    const style = getComputedStyle(document.documentElement)
    const out = {} as Record<T, string>
    for (const name of names) out[name] = style.getPropertyValue(name).trim()
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, key])
}
