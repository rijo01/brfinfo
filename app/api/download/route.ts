import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import Stripe from 'stripe'
import { getPaket } from '@/lib/styrelseguide'

// Kör alltid dynamiskt; Stripe-klienten initieras INNE i handlern.
export const dynamic = 'force-dynamic'

// Serverside-mapp UTANFÖR public/ — PDF:erna serveras ALDRIG statiskt.
const PDF_DIR = join(process.cwd(), 'content', 'styrelseguide-pdf')

// Härdning (skillnad mot driva-foretag): en delad länk dör efter denna tid.
const MAX_AGE_SECONDS = 60 * 60 // 60 minuter sedan köpet

export async function GET(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Betaltjänsten är inte konfigurerad.' }, { status: 500 })
  }

  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id saknas.' }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)

  let paket
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = session.payment_status === 'paid'
    // tier kommer från Stripe-sessionens metadata — aldrig från klient-input → ingen path traversal.
    paket = getPaket(session.metadata?.tier)

    // 403 om betalningen inte är verifierad eller paketet okänt.
    if (!paid || !paket) {
      return NextResponse.json({ error: 'Betalning kunde inte verifieras.' }, { status: 403 })
    }

    // Tidsgräns: neka om mer än 60 min passerat sedan köpet (session.created i sekunder).
    // Gör att en delad/läckt länk slutar fungera efter en timme.
    const ageSeconds = Math.floor(Date.now() / 1000) - session.created
    if (ageSeconds > MAX_AGE_SECONDS) {
      return NextResponse.json(
        { error: 'Nedladdningslänken har gått ut. Kontakta oss så hjälper vi dig.' },
        { status: 403 }
      )
    }
  } catch (error) {
    // Ogiltigt/okänt session_id (t.ex. resource_missing) → betalning kan inte verifieras → 403.
    // Fel/ogiltig nyckel (autentisering) → konfigfel → 500. Övrigt → 500.
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return NextResponse.json({ error: 'Betaltjänsten är inte korrekt konfigurerad.' }, { status: 500 })
    }
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      return NextResponse.json({ error: 'Betalning kunde inte verifieras.' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Kunde inte leverera guiden.' }, { status: 500 })
  }

  // paket.pdf är ett känt filnamn ur katalogen (getPaket), inte en klient-styrd sökväg.
  let pdf: Buffer
  try {
    pdf = await readFile(join(PDF_DIR, paket.pdf))
  } catch {
    return NextResponse.json({ error: 'Guiden kunde inte hittas.' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="brf-styrelseguide.pdf"',
      'Content-Length': String(pdf.byteLength),
      'Cache-Control': 'private, no-store',
    },
  })
}
