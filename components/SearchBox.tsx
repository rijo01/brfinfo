'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBox({ placeholder = 'Sök BRF-namn, org.nr eller adress...' }: { placeholder?: string }) {
  const [q, setQ] = useState('')
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) router.push(`/sok?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.2)' }}>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', padding: '16px 20px', fontSize: 15, color: '#1A2B38', fontFamily: 'inherit' }}
        />
        <button
          type="submit"
          style={{ background: '#1B7C6E', color: 'white', border: 'none', padding: '0 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          Sök →
        </button>
      </div>
    </form>
  )
}
