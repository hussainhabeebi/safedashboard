import React from 'react'

export default function StatCard({ title, value, icon, color = '#1a5c3a' }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      <div style={{
        position: 'absolute', top: 16, right: 16,
        fontSize: 28, opacity: 0.15,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 12, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color, marginTop: 6, lineHeight: 1 }}>
        {value ?? '—'}
      </div>
    </div>
  )
}
