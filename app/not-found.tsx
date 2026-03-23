import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 24px' }}>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 64, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-2px', marginBottom: 16 }}>404</h1>
      <p style={{ fontSize: 18, color: '#6A8090', marginBottom: 32 }}>Sidan hittades inte.</p>
      <Link href="/" style={{ background: '#1B7C6E', color: 'white', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Tillbaka till startsidan</Link>
    </div>
  )
}
