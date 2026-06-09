import type { Metadata } from 'next'
import Link from 'next/link'
import HemsidaLeadForm from './HemsidaLeadForm'

export const metadata: Metadata = {
  title: 'Hemsida åt din bostadsrättsförening — enkel, snygg och alltid uppdaterad',
  description:
    'BRFinfo bygger professionella hemsidor åt bostadsrättsföreningar. Egen domän, styrelsesidor, dokumentarkiv och kontaktformulär — utan teknik­krångel. Boka en kostnadsfri genomgång.',
  alternates: { canonical: 'https://brfinfo.se/hemsida' },
  robots: { index: true, follow: true },
}

const FEATURES = [
  {
    title: 'Egen adress',
    desc: 'Föreningen får en egen webbadress, t.ex. brfstorken.se, som vi kopplar och förnyar åt er.',
  },
  {
    title: 'Styrelse & kontakt',
    desc: 'Presentera styrelsen, visa kontaktuppgifter och låt boende nå rätt person direkt.',
  },
  {
    title: 'Dokumentarkiv',
    desc: 'Stadgar, årsredovisning, protokoll och trivselregler samlade på ett ställe — för medlemmar.',
  },
  {
    title: 'Nyheter & anslag',
    desc: 'Lägg upp driftinfo, stambyten och kommande stämmor utan att behöva en webbyrå.',
  },
  {
    title: 'Kontaktformulär',
    desc: 'Felanmälan och frågor landar direkt i styrelsens inkorg — inga formulärtjänster att hantera.',
  },
  {
    title: 'Mobilanpassad',
    desc: 'Sidan ser lika bra ut i mobilen som på datorn, och laddar snabbt för alla boende.',
  },
]

const STEPS = [
  { n: '1', title: 'Genomgång', desc: 'Vi går igenom föreningens behov och vad sidan ska innehålla — kostnadsfritt och utan förpliktelser.' },
  { n: '2', title: 'Vi bygger', desc: 'Vi sätter upp sidan med ert innehåll och er egen adress. Ni granskar och tycker till.' },
  { n: '3', title: 'Klart & skött', desc: 'Sidan publiceras och vi tar hand om drift, säkerhet och uppdateringar löpande.' },
]

const sectionWrap: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '0 24px' }

export default function HemsidaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Hemsida åt bostadsrättsförening',
            provider: { '@type': 'Organization', name: 'BRFinfo.se', url: 'https://brfinfo.se' },
            serviceType: 'Webbplats för bostadsrättsförening',
            areaServed: 'SE',
            url: 'https://brfinfo.se/hemsida',
          }),
        }}
      />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(27,124,110,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(27,124,110,0.06) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,147,42,0.12)', border: '1px solid rgba(201,147,42,0.25)', padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#E8B84B', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, background: '#E8B84B', borderRadius: '50%', display: 'inline-block' }} />
            Hemsida åt din BRF
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(32px,5.5vw,52px)', fontWeight: 300, color: 'white', lineHeight: 1.12, letterSpacing: '-1.3px', marginBottom: 20 }}>
            En professionell hemsida åt{' '}
            <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>din bostadsrättsförening</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.65, maxWidth: 540, margin: '0 auto 36px' }}>
            Egen adress, styrelsesidor, dokumentarkiv och felanmälan — byggt och skött av oss, utan att någon i styrelsen behöver vara webbexpert.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/hemsida/demo" style={{ background: '#C9932A', color: '#0F1F2D', padding: '13px 26px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Se en demosida →
            </Link>
            <a href="#boka" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '13px 26px', borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
              Boka genomgång
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: '#ffffff', padding: '64px 0' }}>
        <div style={sectionWrap}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-0.5px', marginBottom: 8, textAlign: 'center' }}>
            Allt en förening behöver — på ett ställe
          </h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 40px', textAlign: 'center' }}>
            Vi sätter upp sidan, ni fyller på med innehåll när ni vill. Inga licenser, plugins eller serverkonton att hålla reda på.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '22px 24px', background: 'white' }}>
                <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 400, color: '#0F1F2D', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#F5F1E8', padding: '64px 0' }}>
        <div style={sectionWrap}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-0.5px', marginBottom: 40, textAlign: 'center' }}>
            Så går det till
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ background: 'white', border: '1px solid rgba(201,147,42,0.22)', borderRadius: 12, padding: '26px 24px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#0F1F2D', color: '#E8B84B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, marginBottom: 14 }}>{s.n}</div>
                <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 400, color: '#0F1F2D', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link href="/hemsida/demo" style={{ display: 'inline-block', background: '#0F1F2D', color: '#E8B84B', padding: '12px 26px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Se hur en färdig sida ser ut →
            </Link>
          </div>
        </div>
      </section>

      {/* LEAD FORM */}
      <section id="boka" style={{ background: '#ffffff', padding: '64px 0' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-0.5px', marginBottom: 8, textAlign: 'center' }}>
            Boka en kostnadsfri genomgång
          </h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.6, marginBottom: 32, textAlign: 'center' }}>
            Berätta lite om er förening så hör vi av oss med ett förslag. Inga förpliktelser.
          </p>
          <HemsidaLeadForm />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#F8FAFB', padding: '56px 0 72px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, fontWeight: 400, color: '#0F1F2D', marginBottom: 24 }}>Vanliga frågor</h2>
          {[
            { q: 'Måste någon i styrelsen kunna teknik?', a: 'Nej. Vi sätter upp och sköter det tekniska. Ni lägger till innehåll i ett enkelt gränssnitt om och när ni vill.' },
            { q: 'Kan vi använda en egen domän?', a: 'Ja. Vi kopplar en egen webbadress åt föreningen, eller hjälper er flytta en ni redan har.' },
            { q: 'Vad händer när styrelsen byts ut?', a: 'Inloggningar och innehåll följer föreningen, inte enskilda personer. Vi hjälper till vid överlämning.' },
            { q: 'Vad kostar det?', a: 'Det beror på föreningens behov. Boka en genomgång så ger vi ett tydligt förslag utan förpliktelser.' },
          ].map(faq => (
            <div key={faq.q} style={{ borderBottom: '1px solid rgba(15,31,45,0.08)', padding: '16px 0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 500, color: '#0F1F2D', marginBottom: 6 }}>{faq.q}</h3>
              <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
