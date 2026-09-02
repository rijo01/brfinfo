import { MetadataRoute } from 'next'
import { energiklassSlugsMedData } from '@/lib/energi'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://brfinfo.se'

  // Bara energiklass-städer som faktiskt har matchade deklarationer. Tidigare låg
  // /energiklass/stockholm hårdkodad här trots att den renderade en tom sida —
  // vi bjöd alltså in Google till tunt innehåll. Listan fyller sig själv när
  // enrichern läst in data.
  const energiklassUrls: MetadataRoute.Sitemap = (await energiklassSlugsMedData()).map(slug => ({
    url: `${base}/energiklass/${slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7,
  }))

  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/sok`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/claima`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/forvaltare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/forvaltare-partner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/hemsida`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/energideklaration`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/kontakt`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/integritet`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    // Adressen som brfinfo-bots User-Agent pekar på. Webbansvariga som slår upp
    // boten i sin logg ska hitta sidan även via sök, inte bara via UA-strängen.
    { url: `${base}/om-boten`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    // Måste matcha de kuraterade städerna i app/stad/[city]/page.tsx (META) — annars tunna/saknade sidor.
    ...['stockholm','goteborg','malmo','uppsala','linkoping','orebro','vasteras','helsingborg','norrkoping','jonkoping','gavle','boras','eskilstuna','karlstad','lulea','sundsvall','trollhattan','halmstad','ostersund','falun','vaxjo','umea','lund','borlange','sodertalje','kalmar'].map(c => ({
      url: `${base}/stad/${c}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8,
    })),
    ...energiklassUrls,
  ]

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key || !url.startsWith('http')) return statics

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key)

    // Paginera i 1000-batchar tills tomt. En enkel .limit(50000) kapas TYST av
    // PostgREST:s 1000-radstak → tidigare kom bara 1000 av 26795 BRF med i sitemap.
    //
    // ORDER BY krävs för stabil offset-paginering: utan order kör Postgres parallell
    // seq-scan vars radordning skiljer sig mellan de 27 range-requesten → fönstren
    // överlappar/hoppar → ~6400 dubbletter och hål (verifierat). MEN orgnr/slug som
    // primär sortnyckel saknar index över det ofiltrerade jättebordet → full sort →
    // statement timeout (30s). updated_at ÄR indexerad (snabb), och orgnr (unik) som
    // tiebreaker ger total ordning så sidgränserna aldrig kan tappa/dubblera en rad.
    // Verifierat: 26795 rader == 26795 distinkta, 0 hål, 0 dubbletter, ~2,7 s.
    // STRIKT READ-ONLY: enda anropet är .select(slug). Ingen mutation av foretag.
    const slugs: string[] = []
    let offset = 0
    const batchSize = 1000
    while (true) {
      const { data, error } = await supabase
        .from('foretag').select('slug')
        .eq('juridisk_form', 'Bostadsrättsföreningar')
        .not('slug', 'is', null)
        .order('updated_at', { ascending: true, nullsFirst: false })
        .order('orgnr', { ascending: true })
        .range(offset, offset + batchSize - 1)
      if (error) { console.error('Sitemap Supabase error:', error); break }
      if (!data || data.length === 0) break
      for (const r of data as { slug: string }[]) slugs.push(r.slug)
      if (data.length < batchSize) break
      offset += batchSize
    }

    const brfPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
      url: `${base}/brf/${slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6,
    }))
    return [...statics, ...brfPages]
  } catch {
    return statics
  }
}
