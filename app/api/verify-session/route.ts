import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPaket } from '@/lib/styrelseguide'

// Kör alltid dynamiskt; Stripe-klienten initieras INNE i handlern (nyckeln läses per request).
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Nyckeln finns aldrig i koden. Saknas den: 500 utan att läcka något.
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Betaltjänsten är inte konfigurerad.' }, { status: 500 })
  }

  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id saknas.' }, { status: 400 })
  }

  try {
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const paid = session.payment_status === 'paid'
    // tier kommer ur sessionens metadata — aldrig från klienten.
    const paket = getPaket(session.metadata?.tier)

    if (!paid || !paket) {
      return NextResponse.json({ paid: false })
    }

    // Returnerar INGEN fil-URL. Klienten bygger /api/download?session_id=... själv,
    // och download-routen omverifierar betalningen serverside innan PDF:en släpps.
    return NextResponse.json({ paid: true, tier: paket.tier, namn: paket.namn })
  } catch {
    return NextResponse.json({ error: 'Kunde inte verifiera betalningen.' }, { status: 500 })
  }
}
