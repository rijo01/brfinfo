import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.namn || !body.email || !body.forvaltare) {
    return NextResponse.json({ error: 'Fält saknas' }, { status: 400 })
  }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'BRFinfo <noreply@brfinfo.se>',
      to: process.env.LEAD_EMAIL ?? 'info@brfinfo.se',
      subject: `Förvaltare-partner: ${body.forvaltare}`,
      html: `<h2>Ny partnerförfrågan</h2>
<p><strong>Förvaltare:</strong> ${body.forvaltare}</p>
<p><strong>Namn:</strong> ${body.namn}</p>
<p><strong>E-post:</strong> ${body.email}</p>
<p><strong>Telefon:</strong> ${body.telefon || '—'}</p>
<p><strong>Meddelande:</strong><br>${body.meddelande || '—'}</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'E-post misslyckades' }, { status: 500 })
  }
}
