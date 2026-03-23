import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.brfNamn || !body.orgnr || !body.namn || !body.email) {
    return NextResponse.json({ error: 'Fält saknas' }, { status: 400 })
  }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'BRFinfo <noreply@brfinfo.se>',
      to: process.env.LEAD_EMAIL ?? 'info@brfinfo.se',
      subject: `Claima-ansökan: ${body.brfNamn}`,
      html: `<h2>Ny ansökan</h2><p>BRF: ${body.brfNamn}<br>Org.nr: ${body.orgnr}<br>Namn: ${body.namn}<br>Roll: ${body.roll}<br>E-post: ${body.email}<br>Tel: ${body.telefon || '—'}</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'E-post misslyckades' }, { status: 500 })
  }
}
