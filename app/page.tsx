import type { Metadata } from 'next'
import Link from 'next/link'
import SearchBox from '@/components/SearchBox'
import BRFCard from '@/components/BRFCard'
import { getFeaturedBRFs, getBRFCount } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'BRFinfo.se — Sök bland 26 795 bostadsrättsföreningar i Sverige',
  description: 'Hitta styrelseinfo, avgifter och kontaktuppgifter för alla BRF:er i Sverige. Gratis register med data från Bolagsverket.',
  alternates: { canonical: 'https://brfinfo.se' },
}

const CITIES = [
  { slug: 'stockholm', name: 'Stockholm', emoji: 'S' },
  { slug: 'goteborg', name: 'Göteborg', emoji: 'G' },
  { slug: 'malmo', name: 'Malmö', emoji: 'M' },
  { slug: 'uppsala', name: 'Uppsala', emoji: 'U' },
  { slug: 'linkoping', name: 'Linköping', emoji: 'L' },
  { slug: 'orebro', name: 'Örebro', emoji: 'Ö' },
  { slug: 'vasteras', name: 'Västerås', emoji: 'V' },
  { slug: 'helsingborg', name: 'Helsingborg', emoji: 'H' },
  { slug: 'norrkoping', name: 'Norrköping', emoji: 'N' },
  { slug: 'jonkoping', name: 'Jönköping', emoji: 'J' },
  { slug: 'umea', name: 'Umeå', emoji: 'U' },
  { slug: 'lund', name: 'Lund', emoji: 'L' },
]


export default async function HomePage() {
  const featured = await getFeaturedBRFs(6)
  const brfCount = await getBRFCount()
  const brfCountLabel = brfCount != null ? brfCount.toLocaleString('sv-SE') : '26 795'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'WebSite', name: 'BRFinfo.se', url: 'https://brfinfo.se',
        potentialAction: { '@type': 'SearchAction', target: 'https://brfinfo.se/sok?q={search_term_string}', 'query-input': 'required name=search_term_string' }
      })}} />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '72px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(27,124,110,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(27,124,110,0.06) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,147,42,0.12)', border: '1px solid rgba(201,147,42,0.25)', padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#E8B84B', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, background: '#E8B84B', borderRadius: '50%', display: 'inline-block' }} />
            26 795 bostadsrättsföreningar
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(34px,6vw,58px)', fontWeight: 300, color: 'white', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20 }}>
            Sveriges mest kompletta{' '}
            <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>BRF-register</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 36px' }}>
            Styrelseinfo, avgifter och kontaktuppgifter för alla bostadsrättsföreningar i Sverige.
          </p>
          <SearchBox />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {['Brf Storken', 'Brf Hornsgatan', 'Brf Olivedal', 'Södermalm'].map(h => (
              <Link key={h} href={`/sok?q=${encodeURIComponent(h)}`} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', padding: '5px 14px', borderRadius: 20, fontSize: 12.5, textDecoration: 'none' }}>{h}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ background: '#1B7C6E', padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap' }}>
        {[{ num: brfCountLabel, label: 'BRF:er' }, { num: '290', label: 'Kommuner' }, { num: 'Dagligen', label: 'Uppdaterat' }].map(s => (
          <div key={s.label} style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, fontWeight: 600, letterSpacing: '-0.5px' }}>{s.num}</div>
            <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px', background: '#ffffff' }}>

        {/* FEATURED */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-0.5px' }}>Senast uppdaterade BRF:er</h2>
          <Link href="/sok" style={{ fontSize: 14, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>Sök bland alla →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 60 }}>
          {featured.map((brf: any) => <BRFCard key={brf.orgnr} brf={brf} />)}
        </div>

        {/* CITIES */}
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-0.5px', marginBottom: 20 }}>BRF:er per stad</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))', gap: 10, marginBottom: 60 }}>
          {CITIES.map(c => (
            <Link key={c.slug} href={`/stad/${c.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 10, padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0F1F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 600, color: 'white', flexShrink: 0 }}>{c.emoji}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#0F1F2D', lineHeight: 1.2 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: '#8A9BAB' }}>Visa BRF:er →</div>
              </div>
            </Link>
          ))}
        </div>

        {/* STYRELSEGUIDE */}
        <div style={{ background: '#F5F1E8', border: '1px solid rgba(201,147,42,0.25)', borderRadius: 16, padding: '40px 48px', marginBottom: 60, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,147,42,0.14)', border: '1px solid rgba(201,147,42,0.3)', padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#9A6E1E', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 18 }}>
            För styrelsen
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-0.5px', marginBottom: 12, lineHeight: 1.2 }}>
            Sitter du i en <em style={{ color: '#C9932A', fontStyle: 'normal' }}>BRF-styrelse?</em>
          </h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 24px' }}>
            Handboken <em style={{ fontStyle: 'italic' }}>Den välskötta bostadsrättsföreningen</em> ger styrelsen struktur för lägre kostnader, tryggare beslut och högre fastighetsvärde — 20 kapitel, checklistor och mallar.
          </p>
          {/* Guld = pengavägen. Handboken är intäktsprodukten → denna CTA är sidans guldelement. */}
          <Link href="/styrelseguide" style={{ display: 'inline-block', background: '#C9932A', color: '#0F1F2D', padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Läs mer om handboken →
          </Link>
        </div>

        {/* HEMSIDA ÅT BRF */}
        <div style={{ background: 'rgba(27,124,110,0.06)', border: '1px solid rgba(27,124,110,0.22)', borderRadius: 16, padding: '40px 48px', marginBottom: 60, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(27,124,110,0.12)', border: '1px solid rgba(27,124,110,0.28)', padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#1B7C6E', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 18 }}>
            För föreningen
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-0.5px', marginBottom: 12, lineHeight: 1.2 }}>
            Behöver er förening en <em style={{ color: '#1B7C6E', fontStyle: 'normal' }}>egen hemsida?</em>
          </h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 24px' }}>
            Vi bygger och sköter professionella hemsidor åt bostadsrättsföreningar — egen adress, dokumentarkiv, styrelsesidor och felanmälan, utan teknik­krångel.
          </p>
          <Link href="/hemsida" style={{ display: 'inline-block', background: '#1B7C6E', color: 'white', padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Läs mer om hemsidor →
          </Link>
        </div>

        {/* FOR BUSINESS */}
        <div className="home-business-grid" style={{ background: '#0F1F2D', borderRadius: 16, padding: '40px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', marginBottom: 60 }}>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 300, color: 'white', letterSpacing: '-0.5px', marginBottom: 12, lineHeight: 1.2 }}>
              Är du <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>förvaltningsbolag</em> eller hantverkare?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Nå BRF-styrelser som aktivt söker efter era tjänster. Vi matchar er med föreningar baserat på geografi och behov.
            </p>
            <Link href="/claima" style={{ display: 'inline-block', background: '#C9932A', color: '#0F1F2D', padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              Kom igång →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Grundlisting', desc: 'Synlighet i sökresultat', price: 'Gratis', featured: false },
              { name: 'BRF Premium', desc: 'Verifierad profil + leads', price: '490 kr/mån', featured: true },
              { name: 'Förvaltarpartner', desc: 'Exklusiva BRF-leads', price: '990 kr/mån', featured: false },
            ].map(t => (
              <div key={t.name} style={{ background: t.featured ? 'rgba(201,147,42,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${t.featured ? 'rgba(201,147,42,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: t.featured ? '#E8B84B' : 'white' }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.desc}</div>
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: t.featured ? '#E8B84B' : 'white' }}>{t.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SEO TEXT */}
        <section style={{ maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 12 }}>Om BRFinfo — Sveriges BRF-register</h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 12 }}>
            BRFinfo.se samlar information om alla registrerade bostadsrättsföreningar i Sverige. Data hämtas dagligen från Bolagsverket och SCB och kompletteras med information som föreningarna själva lämnar in.
          </p>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 12, marginTop: 28 }}>Vad är en bostadsrättsförening?</h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7 }}>
            En bostadsrättsförening (BRF) är en ekonomisk förening som äger en fastighet och upplåter lägenheter med bostadsrätt till sina medlemmar. I Sverige finns det drygt 26 000 registrerade BRF:er.
          </p>
        </section>
      </div>
    </>
  )
}
