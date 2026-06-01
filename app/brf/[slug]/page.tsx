import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBRFBySlug, formatOrgnr, bildadAr, avgift, parseBvData, slugify, extractForvaltare } from '@/lib/supabase'
import { getEnergiByOrgnr } from '@/lib/energi'
import { EnergiFakta, EnergiEjRegistrerad } from '@/components/EnergiFakta'
import EnergiLeadCTA from '@/components/EnergiLeadCTA'
import StickyClaimBar from '@/components/StickyClaimBar'

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s|[-/])\S/g, (c) => c.toUpperCase())
}

// Next.js 15: params is a Promise
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brf = await getBRFBySlug(slug)
  if (!brf) return { title: 'BRF hittades inte' }
  return {
    title: `${brf.namn} — Styrelseinfo, avgifter och kontakt`,
    description: `Information om ${brf.namn} i ${brf.postort}. Org.nr ${formatOrgnr(brf.orgnr)}, bildad ${bildadAr(brf.startdatum)}. Styrelseinfo och kontaktuppgifter.`,
    alternates: { canonical: `https://brfinfo.se/brf/${brf.slug}` },
  }
}

export default async function BRFPage({ params }: Props) {
  const { slug } = await params
  const brf = await getBRFBySlug(slug)
  if (!brf) notFound()

  const energi = await getEnergiByOrgnr(brf.orgnr)
  const fee = avgift(brf)
  const year = bildadAr(brf.startdatum)
  const orgnr = formatOrgnr(brf.orgnr)

  const bvData = parseBvData(brf)
  // Använd samma extraktion som förvaltarlistan/-resolvern, annars länkar vi till
  // /forvaltare/<slug> som inte kan resolvas (personnamn etc.) → 404.
  const forvaltare = extractForvaltare(brf)
  const displayName = toTitleCase(brf.namn)
  const card = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
  const cardTitle = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 400, color: '#0F1F2D', marginBottom: 16, letterSpacing: '-0.3px' } as React.CSSProperties

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Organization',
        name: brf.namn, taxID: orgnr, foundingDate: brf.startdatum?.slice(0, 4),
        address: brf.adress ? { '@type': 'PostalAddress', streetAddress: brf.adress, addressLocality: brf.postort, addressCountry: 'SE' } : undefined,
        description: `${brf.namn} är en bostadsrättsförening i ${brf.postort}.`,
      })}} />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(160deg, #0F1F2D 0%, #1A3045 100%)', padding: '0 0 0', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(27,124,110,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(27,124,110,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '16px 24px 40px' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>BRFinfo</Link>
            {' → '}
            <Link href={`/stad/${brf.postort?.toLowerCase().replace(/\s+/g, '-').replace(/[åä]/g, 'a').replace(/ö/g, 'o')}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              BRF i {brf.postort}
            </Link>
            {' → '}
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{displayName}</span>
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 300, color: 'white', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 8 }}>{displayName}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>{orgnr} · {brf.postort}, {brf.lan}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Bildad', value: year },
              { label: 'Avg/kvm', value: fee },
              { label: 'Status', value: brf.status === 'Är verksam' ? 'Aktiv' : (brf.status ?? '—') },
              { label: 'Ort', value: brf.postort },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{m.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* LEFT */}
          <div>

            {/* Om */}
            <div style={card}>
              <h2 style={cardTitle}>Om {brf.namn}</h2>
              <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.7 }}>
                {brf.infotext || `${brf.namn} är en bostadsrättsförening belägen i ${brf.postort}, ${brf.lan}. Föreningen är registrerad hos Bolagsverket med organisationsnummer ${orgnr}${year !== 'Okänt' ? ` och bildades ${year}` : ''}.`}
              </p>
            </div>

            {/* Register */}
            <div style={card}>
              <h2 style={cardTitle}>Registeruppgifter</h2>
              {[
                { label: 'Organisationsnummer', value: orgnr },
                { label: 'Juridisk form', value: 'Bostadsrättsförening' },
                { label: 'Status', value: brf.status ?? '—' },
                { label: 'Bildad', value: year !== 'Okänt' ? year : '—' },
                { label: 'Adress', value: brf.adress ?? '—' },
                { label: 'Ort', value: brf.postort },
                { label: 'Kommun', value: brf.kommun ?? '—' },
                { label: 'Län', value: brf.lan ?? '—' },
                { label: 'Bransch (SNI)', value: brf.bransch ?? '—' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(15,31,45,0.05)' : 'none', fontSize: 14 }}>
                  <span style={{ color: '#6A8090' }}>{row.label}</span>
                  <span style={{ fontWeight: 500, color: '#1A2B38' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Bolagsverket */}
            {bvData && (
              <div style={card}>
                <h2 style={cardTitle}>Från Bolagsverket</h2>

                {bvData.verksamhetsbeskrivning && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Verksamhetsbeskrivning</div>
                    <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.7 }}>{bvData.verksamhetsbeskrivning}</p>
                  </div>
                )}

                {bvData.adress_bv && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Registrerad adress</div>
                    <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.7 }}>
                      {bvData.adress_bv}
                    </p>
                  </div>
                )}

                {forvaltare && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Förvaltare</div>
                    <Link href={`/forvaltare/${slugify(forvaltare)}`} style={{ fontSize: 14, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>
                      {forvaltare} →
                    </Link>
                  </div>
                )}

                {bvData.sni_koder && bvData.sni_koder.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>SNI-branschkoder</div>
                    {bvData.sni_koder.map((sni, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < (bvData.sni_koder!.length - 1) ? '1px solid rgba(15,31,45,0.05)' : 'none', fontSize: 14 }}>
                        {sni.kod && <span style={{ color: '#1B7C6E', fontWeight: 500, fontFamily: 'monospace' }}>{sni.kod}</span>}
                        <span style={{ color: '#4A6070' }}>{sni.klartext}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Energideklaration */}
            {energi ? <EnergiFakta d={energi} /> : <EnergiEjRegistrerad />}

            {/* Lead-CTA: energiåtgärder */}
            <EnergiLeadCTA brfNamn={displayName} orgnr={brf.orgnr} kommun={brf.kommun} energiklass={energi?.energiklass} kalla="brf-sida" />

            {/* FAQ */}
            <div style={card} itemScope itemType="https://schema.org/FAQPage">
              <h2 style={cardTitle}>Vanliga frågor om {brf.namn}</h2>
              {[
                { q: `Var ligger ${brf.namn}?`, a: `${brf.namn} är beläget i ${brf.postort}${brf.adress ? `, på adressen ${brf.adress}` : ''}, ${brf.lan ?? 'Sverige'}.` },
                { q: `Vad har ${brf.namn} för organisationsnummer?`, a: `Organisationsnumret för ${brf.namn} är ${orgnr}.` },
                { q: `När bildades ${brf.namn}?`, a: year !== 'Okänt' ? `${brf.namn} bildades år ${year}.` : 'Bildandedatum saknas i nuläget.' },
                { q: `Hur kontaktar jag styrelsen i ${brf.namn}?`, a: `Kontakta styrelsen via de uppgifter som visas på den här sidan. Styrelsen kan också claima föreningsprofilen för att lägga till direktkontakt.` },
              ].map((faq, i) => (
                <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" style={{ marginBottom: 16 }}>
                  <h3 itemProp="name" style={{ fontSize: 14, fontWeight: 500, color: '#0F1F2D', marginBottom: 6 }}>
                    <span style={{ color: '#1B7C6E' }}>Q: </span>{faq.q}
                  </h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.6, paddingLeft: 20 }}>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '20px 22px' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 400, color: '#0F1F2D', marginBottom: 14, letterSpacing: '-0.2px' }}>Kontakt</h2>
              {brf.telefon && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 10, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>Telefon</div><a href={`tel:${brf.telefon}`} style={{ fontSize: 13, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>{brf.telefon}</a></div>}
              {brf.email && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 10, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>E-post</div><a href={`mailto:${brf.email}`} style={{ fontSize: 13, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>{brf.email}</a></div>}
              {!brf.telefon && !brf.email && <p style={{ fontSize: 12, color: '#8A9BAB', lineHeight: 1.5 }}>Kontaktuppgifter saknas.</p>}
              <Link href="/claima" style={{ display: 'block', textAlign: 'center', background: '#C9932A', color: '#0F1F2D', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', marginTop: 12 }}>
                Claima denna BRF
              </Link>
            </div>
            <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '16px 22px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 500, color: '#0F1F2D', marginBottom: 8 }}>Externa källor</h3>
              <a href={`https://www.bolagsverket.se/omregistret/sokforetagochorganisationer/${brf.orgnr}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 12.5, color: '#1B7C6E', textDecoration: 'none', padding: '6px 0', borderBottom: '1px solid rgba(15,31,45,0.06)' }}>Bolagsverket ↗</a>
              <a href={`https://infofinder.se/foretag/${brf.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 12.5, color: '#1B7C6E', textDecoration: 'none', padding: '6px 0' }}>InfoFinder.se ↗</a>
            </div>
          </div>
        </div>
      </div>

      <StickyClaimBar brfNamn={brf.namn} />
    </>
  )
}
