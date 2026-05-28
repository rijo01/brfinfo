// Tunn wrapper kring gtag (GA4) — använder brfinfo:s egen stream (G-0281GKZT7X,
// konfigurerad i components/GoogleAnalytics.tsx). No-op om gtag inte laddats
// (t.ex. innan cookie-samtycke).
type GtagParams = Record<string, string | number | boolean | undefined>

export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  if (typeof w.gtag === 'function') {
    w.gtag('event', event, params)
  }
}
