import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Kör alltid dynamiskt; initiera ALDRIG Stripe-klienten på modulnivå (nyckeln läses per request).
export const dynamic = 'force-dynamic'

// Tre tiers. price_data byggs on-the-fly — inga produkter/priser behöver finnas i Stripe-dashboarden.
// unit_amount i öre (SEK).
const TIERS = {
  paket1: { namn: 'Den välskötta bostadsrättsföreningen — Handboken', unit_amount: 149900 },
  paket2: { namn: 'Den välskötta bostadsrättsföreningen — Handboken + Mallpaket', unit_amount: 249900 },
  paket3: { namn: 'Den välskötta bostadsrättsföreningen — Styrelsepaketet', unit_amount: 499900 },
} as const

type Tier = keyof typeof TIERS

function isTier(v: unknown): v is Tier {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(TIERS, v)
}

// Härled site-origin från inkommande request — hårdkoda inte localhost.
// Bakom Vercels proxy är x-forwarded-* satta; faller tillbaka på origin-headern.
function getOrigin(req: Request): string | null {
  const proto = req.headers.get('x-forwarded-proto')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (host) return `${proto ?? 'https'}://${host}`
  const origin = req.headers.get('origin')
  if (origin) return origin
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return null
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  // Acceptera bara de tre kända tier-värdena.
  const tier = body.tier
  if (!isTier(tier)) {
    return NextResponse.json({ error: 'Okänt eller saknat paket.' }, { status: 400 })
  }

  // Nyckeln läses ur miljön — finns aldrig i koden. Saknas den: 500 utan att läcka något.
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Betaltjänsten är inte konfigurerad.' }, { status: 500 })
  }

  const origin = getOrigin(req)
  if (!origin) {
    return NextResponse.json({ error: 'Kunde inte härleda webbadress.' }, { status: 500 })
  }

  // Initiera klienten INNE i handlern.
  const stripe = new Stripe(secretKey)

  const { namn, unit_amount } = TIERS[tier]

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'sek',
            unit_amount,
            product_data: { name: namn },
          },
        },
      ],
      // Stripe Checkout samlar in kundens e-post automatiskt i payment-läge
      // (läses sedan som session.customer_details.email i verifieringssteget).
      metadata: { tier },
      // {CHECKOUT_SESSION_ID} skrivs ordagrant — Stripe ersätter platshållaren.
      success_url: `${origin}/styrelseguide/tack?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/styrelseguide?avbruten=1`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Kunde inte starta kassan.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch {
    // Logga inte nyckeln eller råa Stripe-fel till klienten.
    return NextResponse.json({ error: 'Kunde inte starta kassan.' }, { status: 500 })
  }
}
