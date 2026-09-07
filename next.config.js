/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },

  // 301 på plattformsnivå: utvärderas före routing, så det blir ETT hopp utan
  // mellansteg. permanentRedirect() i en sida ger 308 — även det permanent, men
  // här går det att sätta 301 exakt, och utan att ens nå funktionen.
  async redirects() {
    return [
      // /energiklass/<stad> byggde på tabellen energideklarationer. Den är tom
      // (0 rader, 0 matchade) → harEnergiData() svarar false för alla fyra
      // kuraterade städer → varje sida 404:ar. /energiklass/stockholm låg
      // dessutom i sidfoten på VARJE sida, så crawlers gick på den oavbrutet:
      // 108 av 1341 loggade 404-händelser under mätfönstret. Sidfotslänken är
      // borttagen och URL:erna pekas till den sida som faktiskt täcker ämnet.
      //
      // Kommer energidatan tillbaka: ta bort raderna här, så serverar routen
      // städerna igen. Listan är medvetet explicit (inte /energiklass/:stad*)
      // så att en ny stad inte tyst hamnar under en permanent redirect.
      ...['stockholm', 'goteborg', 'malmo', 'uppsala'].map(stad => ({
        source: `/energiklass/${stad}`,
        destination: '/energideklaration',
        statusCode: 301,
      })),
    ]
  },
}
module.exports = nextConfig
