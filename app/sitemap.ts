import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://brfinfo.se'

  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/sok`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/claima`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/forvaltare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/forvaltare-partner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/energideklaration`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/energiklass/stockholm`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/kontakt`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/integritet`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...['stockholm','goteborg','malmo','uppsala','linkoping','orebro','vasteras','helsingborg','norrkoping','jonkoping','umea','lund'].map(c => ({
      url: `${base}/stad/${c}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8,
    })),
  ]

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key || !url.startsWith('http')) return statics

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key)
    const { data, error } = await supabase
      .from('foretag').select('slug')
      .eq('juridisk_form', 'Bostadsrättsföreningar')
      .not('slug', 'is', null)
      .limit(50000)
    
    if (error) console.error('Sitemap Supabase error:', error)

    const brfPages: MetadataRoute.Sitemap = (data ?? []).map((r: any) => ({
      url: `${base}/brf/${r.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6,
    }))
    return [...statics, ...brfPages]
  } catch {
    return statics
  }
}
