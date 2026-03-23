import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://brfinfo.se'
  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/sok`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/claima`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    ...['stockholm', 'goteborg', 'malmo', 'uppsala', 'linkoping', 'orebro', 'vasteras', 'helsingborg', 'norrkoping', 'jonkoping', 'umea', 'lund'].map(c => ({
      url: `${base}/stad/${c}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8,
    })),
  ]
  try {
    const { data } = await supabase
      .from('foretag').select('slug')
      .eq('juridisk_form', 'Bostadsrättsföreningar')
      .eq('status', 'AKTIV')
      .not('slug', 'is', null)
      .limit(50000)
    const brfPages: MetadataRoute.Sitemap = (data ?? []).map((r: any) => ({
      url: `${base}/brf/${r.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6,
    }))
    return [...statics, ...brfPages]
  } catch {
    return statics
  }
}
