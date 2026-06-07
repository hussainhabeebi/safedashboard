import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import useIsMobile from '../hooks/useIsMobile'

const STATUS_COLOR = {
  New: '#3b82f6', Warm: '#f59e0b', Quoted: '#10b981',
  Closed: '#6b7280', 'Not Interested': '#ef4444',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    Promise.all([
      axios.get('/api/stats', { withCredentials: true }),
      axios.get('/api/leads?limit=10', { withCredentials: true }),
    ]).then(([s, l]) => {
      setStats(s.data)
      const rows = l.data?.list ?? l.data?.records ?? l.data ?? []
      setLeads(Array.isArray(rows) ? rows : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#1a5c3a' }}>Dashboard</h1>
        <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        <StatCard title="New Leads Today"     value={loading ? '...' : stats?.newLeadsToday}    icon="👥" color="#1a5c3a" />
        <StatCard title="Total Contacts"      value={loading ? '...' : stats?.totalContacts}    icon="📋" color="#3b82f6" />
        <StatCard title="Open Conversations"  value={loading ? '...' : stats?.openConversations} icon="💬" color="#8b5cf6" />
        <StatCard title="Handovers Today"     value={loading ? '...' : stats?.handoversToday}   icon="🤝" color="#f59e0b" />
      </div>

      {/* Recent Leads */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 32 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a5c3a' }}>Recent Leads</h2>
          <Link to="/leads" style={{ fontSize: 13, color: '#1a5c3a', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>}
                {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insurance Type</th>}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Contact</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isMobile ? 2 : 5} style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={isMobile ? 2 : 5} style={{ padding: 24, textAlign: 'center', color: '#888' }}>No leads yet</td></tr>
              ) : leads.map((lead, i) => (
                <tr key={lead.Id || i} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{lead.Name || '—'}</td>
                  {!isMobile && <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{lead.Phone || '—'}</td>}
                  {!isMobile && <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{lead.Interest || lead.insurance_type || '—'}</td>}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${STATUS_COLOR[lead.Status] || '#6b7280'}20`,
                      color: STATUS_COLOR[lead.Status] || '#6b7280',
                      borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                    }}>
                      {lead.Status || 'New'}
                    </span>
                  </td>
                  {!isMobile && <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>
                    {lead.UpdatedAt ? new Date(lead.UpdatedAt).toLocaleDateString('en-IN') : '—'}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { to: '/leads', label: 'Manage Leads', icon: '👥', desc: 'View and update all leads' },
          { to: '/conversations', label: 'Conversations', icon: '💬', desc: 'WhatsApp chat threads' },
          { to: '/bot-control', label: 'Bot Settings', icon: '🤖', desc: 'System prompt & controls' },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid transparent',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a5c3a'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,92,58,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, color: '#1a5c3a', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
