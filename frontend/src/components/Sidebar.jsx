import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import axios from 'axios'

const NAV = [
  { path: '/dashboard',     label: 'Dashboard',     icon: '📊' },
  { path: '/leads',         label: 'Leads',          icon: '👥' },
  { path: '/conversations', label: 'Conversations',  icon: '💬' },
  { path: '/contacts',      label: 'Contacts',       icon: '📋' },
  { path: '/analytics',     label: 'Analytics',      icon: '📈' },
  { path: '/bot-control',   label: 'Bot Control',    icon: '🤖' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true })
    } catch {}
    navigate('/login')
  }

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: '#1a5c3a',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: '#c9a84c', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Safe Assets
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>
          Insurance Advisor
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 24px',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #c9a84c' : '3px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px 0',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>⏻</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
