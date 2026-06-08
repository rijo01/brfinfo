'use client'
import { useState } from 'react'

type Tier = 'paket1' | 'paket2' | 'paket3'

type Props = {
  tier: Tier
  /** Primär guldknapp (aktivt köp) eller dämpad sekundär. */
  primary?: boolean
  /** Visa knappen men i "kommer snart"-läge (disabled). Leveransen är inte klar än. */
  comingSoon?: boolean
  /** Knapptext i aktivt läge. */
  label?: string
}

export default function StyrelseguideKopKnapp({ tier, primary = false, comingSoon = false, label = 'Köp och ladda ner' }: Props) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleClick() {
    if (comingSoon || loading) return
    setLoading(true)
    setErr(null)
    try {
      // /api/checkout byggs i nästa steg — knappen får alltså inte fungera ännu.
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data.error || 'Något gick fel')
      // Redirect till Stripe Checkout.
      window.location.href = data.url
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kunde inte starta köpet. Försök igen.')
      setLoading(false)
    }
  }

  // "Kommer snart"-läge: synlig men disabled. Aktiveras senare genom att ta bort comingSoon.
  if (comingSoon) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        style={{
          width: '100%', border: '1px solid rgba(15,31,45,0.15)', background: 'rgba(15,31,45,0.04)',
          color: '#6A8090', padding: '13px 18px', borderRadius: 8, fontSize: 15, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'not-allowed',
        }}
      >
        Snart tillgänglig
      </button>
    )
  }

  const bg = loading ? '#6A8090' : primary ? '#C9932A' : '#0F1F2D'
  const color = primary ? '#0F1F2D' : 'white'

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%', border: 'none', background: bg, color,
          padding: '13px 18px', borderRadius: 8, fontSize: 15, fontWeight: 600,
          fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, opacity 0.15s',
        }}
      >
        {loading ? 'Öppnar kassan…' : `${label} →`}
      </button>
      {err && (
        <p style={{ fontSize: 12.5, color: '#B4451F', marginTop: 8, textAlign: 'center' }}>{err}</p>
      )}
    </div>
  )
}
