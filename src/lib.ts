/** Joins class names, skipping empty values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Formats a coordinate pair for display, for example "42.8600° N, 74.3000° E". */
export function formatCoords(lat: number, lon: number, num?: (n: number, d: number) => string, lang = 'en'): string {
  const ru = lang === 'ru'
  const ns = lat >= 0 ? (ru ? 'с. ш.' : 'N') : ru ? 'ю. ш.' : 'S'
  const ew = lon >= 0 ? (ru ? 'в. д.' : 'E') : ru ? 'з. д.' : 'W'
  const f = (n: number) => (num ? num(Math.abs(n), 4) : Math.abs(n).toFixed(4))
  return `${f(lat)}° ${ns}, ${f(lon)}° ${ew}`
}
