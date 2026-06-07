import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import useIsMobile from '../hooks/useIsMobile'

const STATUS_COLORS = {
  New: '#3b82f6', Warm: '#f59e0b', Quoted: '#10b981',
  Closed: '#6b7280', 'Not Interested': '#ef4444', Unknown: '#d1d5db',
}

const LANG_LABELS = { ml: 'Malayalam', en: 'English', ta: 'Tamil', hi: 'Hindi', te: 'Telugu', kn: 'Kannada', mix: 'Mixed', Unknown: 'Unknown' }

function BarChart({ data, colorMap, title }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (!entries.length) return <div style={{ color: '#aaa', fontSize: 13 }}>No data</div>
  return (
    <div>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#1a5c3a', marginBottom: 12 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map(([key, val]) => {
          const pct = total > 0 ? Math.round((val / total) * 100) : 0
          const color = colorMap?.[key] || '#1a5c3a'
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: '#444' }}>{LANG_LABELS[key] || key}</span>
                <span style={{ color: '#888', fontWeight: 600 }}>{val} <span style={{ color: '#bbb' }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SparkBars({ data }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
  const max = Math.max(...entries.map(([, v]) => v), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
      {entries.map(([date, val]) => (
        <div key={date} title={`${date}: ${val}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', background: val > 0 ? '#1a5c3a' : '#e8e8e8',
            height: `${Math.max(4, (val / max) * 64)}px`,
            borderRadius: '3px 3px 0 0', transition: 'height 0.3s',
          }} />
          {entries.length <= 14 && (
            <div style={{ fontSize: 9, color: '#aaa', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: 2 }}>
              {date.slice(5)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    axios.get('/api/analytics', { withCredentials: true })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ color: '#888' }}>Loading analytics...</div>
      </div>
    </Layout>
  )

  const { leadsByStatus = {}, leadsByState = {}, leadsByDegree = {}, totalLeads = 0, eligible = 0, invited = 0, gulf = 0 } = data || {}

  return (
    <Layout>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a5c3a' }}>Analytics</h1>
          <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Lead pipeline & conversation insights</p>
        </div>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Leads', value: totalLeads, color: '#1a5c3a' },
            { label: 'Eligible', value: eligible, color: '#3b82f6' },
            { label: 'Invited', value: invited, color: '#10b981' },
            { label: 'Gulf', value: gulf, color: '#f59e0b' },
          ].map(item => (
            <div key={item.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Lead Pipeline by Stage */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <BarChart data={leadsByStatus} colorMap={STATUS_COLORS} title="Lead Pipeline by Stage" />
          </div>

          {/* By State */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <BarChart data={leadsByState} title="Leads by State" />
          </div>
        </div>

        {/* By Degree */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a5c3a', marginBottom: 16 }}>Leads by Qualification</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(leadsByDegree).sort((a, b) => b[1] - a[1]).map(([deg, count]) => (
              <div key={deg} style={{
                padding: '6px 14px', borderRadius: 20, background: '#e8f5e9',
                color: '#1a5c3a', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {deg}
                <span style={{ background: '#1a5c3a', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{count}</span>
              </div>
            ))}
            {!Object.keys(leadsByDegree).length && <div style={{ color: '#aaa', fontSize: 13 }}>No data</div>}
          </div>
        </div>
    </Layout>
  )
}
