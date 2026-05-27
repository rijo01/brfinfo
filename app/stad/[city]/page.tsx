import type { Metadata } from 'next'
import Link from 'next/link'
import { getBRFsByCity } from '@/lib/supabase'
import BRFCard from '@/components/BRFCard'
import SearchBox from '@/components/SearchBox'

type Props = { params: Promise<{ city: string }> }

const META: Record<string, { name: string; count: number; desc: string; areas: string[] }> = {
  stockholm: { name: 'Stockholm', count: 8421, desc: 'Hitta alla BRF:er i Stockholm med styrelseinfo och avgifter.', areas: ['Södermalm', 'Östermalm', 'Vasastan', 'Kungsholmen', 'Lidingö', 'Nacka', 'Solna', 'Sundbyberg'] },
  goteborg: { name: 'Göteborg', count: 4218, desc: 'BRF:er i Göteborg — jämför avgifter och hitta styrelseinfo.', areas: ['Hisingen', 'Majorna', 'Linnéstaden', 'Centrum', 'Örgryte', 'Angered', 'Askim', 'Mölndal'] },
  malmo: { name: 'Malmö', count: 2876, desc: 'Sök bland BRF:er i Malmö med styrelseinfo och kontakt.', areas: ['Möllevången', 'Limhamn', 'Husie', 'Centrum', 'Hyllie', 'Rosengård', 'Oxie', 'Kirseberg'] },
  uppsala: { name: 'Uppsala', count: 1543, desc: 'BRF:er i Uppsala med komplett registerinfo.', areas: ['Fålhagen', 'Luthagen', 'Kungsängen', 'Centrum', 'Eriksberg', 'Gottsunda', 'Sävja', 'Bälinge'] },
  linkoping: { name: 'Linköping', count: 987, desc: 'Sök BRF:er i Linköping med styrelseinfo.', areas: ['Centrum', 'Ryd', 'Ekholmen', 'Lambohov', 'Gottfridsberg', 'Skäggetorp', 'Åby', 'Vikingstad'] },
  orebro: { name: 'Örebro', count: 742, desc: 'Hitta BRF:er i Örebro med kontakt och styrelseinfo.', areas: ['Centrum', 'Brickebacken', 'Varberga', 'Adolfsberg', 'Mellringe', 'Hovsta', 'Längbro', 'Sörbyängen'] },
  vasteras: { name: 'Västerås', count: 698, desc: 'BRF:er i Västerås — 698 registrerade föreningar.', areas: ['Centrum', 'Hamre', 'Skallberget', 'Viksäng', 'Bäckby', 'Rönnby', 'Tillberga', 'Irsta'] },
  helsingborg: { name: 'Helsingborg', count: 621, desc: 'BRF:er i Helsingborg med org.nr och styrelseinfo.', areas: ['Centrum', 'Drottninghög', 'Fredriksdal', 'Olympia', 'Råå', 'Rydebäck', 'Mörarp', 'Allerum'] },
  norrkoping: { name: 'Norrköping', count: 544, desc: 'Sök BRF:er i Norrköping med styrelseinfo.', areas: ['Centrum', 'Ljura', 'Hageby', 'Vilbergen', 'Navestad', 'Åby', 'Kvillinge', 'Kimstad'] },
  jonkoping: { name: 'Jönköping', count: 487, desc: 'BRF:er i Jönköping — register med styrelseinfo.', areas: ['Centrum', 'Huskvarna', 'Råslätt', 'Österängen', 'Barnarp', 'Sandseryd', 'Norrahammar', 'Bankeryd'] },
  gavle: { name: 'Gävle', count: 389, desc: 'Hitta BRF:er i Gävle med styrelseinfo, avgifter och kontaktuppgifter. Register över 389 bostadsrättsföreningar.', areas: ['Centrum', 'Bomhus', 'Sätra', 'Stigslund', 'Hemlingby', 'Strömsbro', 'Hille', 'Valbo'] },
  boras: { name: 'Borås', count: 341, desc: 'BRF:er i Borås — jämför avgifter och styrelseinfo för 341 bostadsrättsföreningar.', areas: ['Centrum', 'Hässleholmen', 'Norrby', 'Göta', 'Brämhult', 'Sandared', 'Dalsjöfors', 'Fristad'] },
  eskilstuna: { name: 'Eskilstuna', count: 298, desc: 'Sök bland BRF:er i Eskilstuna med org.nr, styrelseinfo och avgiftsuppgifter.', areas: ['Centrum', 'Fröslunda', 'Skiftinge', 'Råbergstorp', 'Hageby', 'Lagersberg', 'Torshälla', 'Kjula'] },
  karlstad: { name: 'Karlstad', count: 412, desc: 'Hitta BRF:er i Karlstad vid Klarälven. Register med styrelseinfo och avgifter för 412 bostadsrättsföreningar.', areas: ['Centrum', 'Norrstrand', 'Sydöstra', 'Färjestad', 'Kronoparken', 'Rud', 'Viken', 'Grums'] },
  lulea: { name: 'Luleå', count: 267, desc: 'BRF:er i Luleå – styrelseinfo och avgifter för 267 bostadsrättsföreningar i Norrbotten.', areas: ['Centrum', 'Björkskatan', 'Bergnäset', 'Råneå', 'Gammelstad', 'Hertsön', 'Kronan', 'Porsön'] },
  sundsvall: { name: 'Sundsvall', count: 334, desc: 'Hitta BRF:er i Sundsvall med styrelseinfo och kontaktuppgifter. 334 föreningar i Medelpads residensstad.', areas: ['Centrum', 'Sidsjö', 'Norrmalm', 'Bosvedjan', 'Kovland', 'Timrå', 'Skönsmon', 'Alnö'] },
  trollhattan: { name: 'Trollhättan', count: 287, desc: 'Sök BRF:er i Trollhättan med styrelseinfo och avgifter. 287 bostadsrättsföreningar i Västra Götaland.', areas: ['Centrum', 'Lextorp', 'Sjuntorp', 'Eriksborg', 'Vänersborg', 'Väne-Ryr', 'Väne-Åsaka', 'Frändefors'] },
  halmstad: { name: 'Halmstad', count: 312, desc: 'Hitta BRF:er i Halmstad med kontakt och styrelseinfo. 312 föreningar i Hallands residensstad.', areas: ['Centrum', 'Söder', 'Frennarp', 'Oskarström', 'Harplinge', 'Getinge', 'Simlångsdalen', 'Kvibille'] },
  ostersund: { name: 'Östersund', count: 224, desc: 'Hitta BRF:er i Östersund med styrelseinfo och avgifter. 224 bostadsrättsföreningar vid Storsjön.', areas: ['Centrum', 'Odenslund', 'Hornsberg', 'Lugnvik', 'Fältjägaren', 'Odensala', 'Lit', 'Brunflo'] },
  falun: { name: 'Falun', count: 198, desc: 'BRF:er i Falun – 198 föreningar i Dalarnas residensstad. Styrelseinfo och avgifter.', areas: ['Centrum', 'Hälsinggården', 'Hosjö', 'Kvarnsveden', 'Grycksbo', 'Vika', 'Järna', 'Enviken'] },
  vaxjo: { name: 'Växjö', count: 243, desc: 'Sök bland BRF:er i Växjö med org.nr och styrelseinfo. 243 bostadsrättsföreningar i Kronoberg.', areas: ['Centrum', 'Araby', 'Dalbo', 'Öjaby', 'Toftaholm', 'Lammhult', 'Braås', 'Rottne'] },
  umea: { name: 'Umeå', count: 412, desc: 'Hitta BRF:er i Umeå med komplett registerdata.', areas: ['Centrum', 'Ålidhem', 'Haga', 'Mariehem', 'Tomtebo', 'Carlshem', 'Teg', 'Ersboda'] },
  lund: { name: 'Lund', count: 389, desc: 'BRF:er i Lund med styrelseinfo och avgifter.', areas: ['Centrum', 'Norra Fäladen', 'Klostergården', 'Kobjer', 'Linero', 'Väster', 'Brunnshög', 'Stångby'] },
  borlange: { name: 'Borlänge', count: 312, desc: 'Hitta BRF:er i Borlänge med styrelseinfo och avgifter. 312 bostadsrättsföreningar i Dalarnas industristjärna.', areas: ['Centrum', 'Tjärna Ängar', 'Jakobsgårdarna', 'Kvarnsveden', 'Hagalund', 'Vad', 'Smedjebacken', 'Stora Tuna'] },
  sodertalje: { name: 'Södertälje', count: 487, desc: 'Sök BRF:er i Södertälje med org.nr och styrelseinfo. 487 bostadsrättsföreningar i Stockholms mest industririka grannstad.', areas: ['Centrum', 'Ronna', 'Fornhöjden', 'Geneta', 'Hovsö', 'Pershagen', 'Järna', 'Enhörna'] },
  kalmar: { name: 'Kalmar', count: 378, desc: 'Hitta BRF:er i Kalmar vid Kalmarsund. 378 bostadsrättsföreningar i Smålands historiska residensstad.', areas: ['Centrum', 'Oxhagen', 'Norrliden', 'Söder', 'Berga', 'Fredriksskans', 'Ljungbyholm', 'Trekanten'] },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const m = META[city]
  const name = m?.name ?? city
  return {
    title: `BRF i ${name} — ${m?.count ?? ''} bostadsrättsföreningar | BRFinfo.se`,
    description: m?.desc ?? `Hitta BRF:er i ${name} med styrelseinfo och kontaktuppgifter.`,
    alternates: { canonical: `https://brfinfo.se/stad/${city}` },
  }
}

export default async function CityPage({ params }: Props) {
  const { city } = await params
  const meta = META[city]
  const cityName = meta?.name ?? city
  const brfs = await getBRFsByCity(cityName, 30)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: `BRF i ${cityName}`, url: `https://brfinfo.se/stad/${city}`,
        breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BRFinfo', item: 'https://brfinfo.se' },
          { '@type': 'ListItem', position: 2, name: `BRF i ${cityName}`, item: `https://brfinfo.se/stad/${city}` },
        ]},
      })}} />

      <div style={{ background: 'white', borderBottom: '1px solid rgba(15,31,45,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px', fontSize: 13, color: '#6A8090' }}>
          <Link href="/" style={{ color: '#1B7C6E', textDecoration: 'none' }}>BRFinfo</Link>{' → '}<span>BRF i {cityName}</span>
        </div>
      </div>

      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(28px,5vw,46px)', fontWeight: 300, color: 'white', letterSpacing: '-1px', marginBottom: 12 }}>
            BRF i <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>{cityName}</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 28, maxWidth: 520, lineHeight: 1.6 }}>{meta?.desc}</p>
          <SearchBox />
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {meta?.areas && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 16 }}>Sök per stadsdel i {cityName}</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {meta.areas.map(area => (
                <Link key={area} href={`/sok?q=${encodeURIComponent(area)}`} style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 8, padding: '8px 14px', fontSize: 13.5, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>{area}</Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D' }}>BRF:er i {cityName}</h2>
          <Link href={`/sok?q=${encodeURIComponent(cityName)}`} style={{ fontSize: 14, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>Sök bland alla →</Link>
        </div>

        {brfs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 48 }}>
            {brfs.map(brf => <BRFCard key={brf.orgnr} brf={brf} />)}
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6A8090', marginBottom: 48 }}>
            <p style={{ marginBottom: 12 }}>Inga BRF:er hittades via direktsökning.</p>
            <Link href={`/sok?q=${encodeURIComponent(cityName)}`} style={{ display: 'inline-block', background: '#1B7C6E', color: 'white', padding: '9px 20px', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Sök på &quot;{cityName}&quot;</Link>
          </div>
        )}

        <section style={{ maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 12 }}>Bostadsrättsföreningar i {cityName}</h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7 }}>
            I {cityName} finns det{meta?.count ? ` ${meta.count.toLocaleString('sv-SE')}` : ' ett stort antal'} registrerade bostadsrättsföreningar. BRFinfo.se samlar alla i ett register med data från Bolagsverket och SCB.
          </p>
        </section>
      </div>
    </>
  )
}
