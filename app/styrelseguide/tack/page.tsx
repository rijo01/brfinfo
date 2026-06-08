import type { Metadata } from 'next'
import { Suspense } from 'react'
import StyrelseguideTackClient from '@/components/StyrelseguideTackClient'

export const metadata: Metadata = {
  title: 'Tack för ditt köp',
  description: 'Ladda ner din styrelseguide.',
  robots: { index: false, follow: false },
}

export default function StyrelseguideTackPage() {
  return (
    <section style={{ background: '#F5F1E8', minHeight: '72vh', padding: '64px 24px' }}>
      <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
        <Suspense fallback={<p style={{ color: '#4A6070', fontSize: 15 }}>Laddar…</p>}>
          <StyrelseguideTackClient />
        </Suspense>
      </div>
    </section>
  )
}
