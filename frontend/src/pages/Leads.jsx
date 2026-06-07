import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

const STATUSES = ['All', 'New', 'Warm', 'Quoted', 'Closed', 'Not Interested']
const STATUS_COLOR = {
  New: '#3b82f6', Warm: '#f59e0b', Quoted: '#10b981',
  Closed: '#6b7280', 'Not Interested': '#ef4444',
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(null)
  const LIMIT = 50

  const fetchLeads = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: LIMIT, offset })
    if (search) params.set('search', search)
    if (filter !== 'All') params.set('filter', filter)
    axios.get(`/api/leads?${params}`, { withCredentials: true })
      .then(res => {
        const rows = res.data?.list ?? res.data?.records ?? res.data ?? []
        setLeads(Array.isArray(rows) ? rows : [])
        setTotal(res.data?.pageInfo?.totalRows ?? res.data?.total ?? rows.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, filter, offset])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // Debounce search
  useEffect(() => { setOffset(0) }, [search, filter])

  async function handleStatusChange(id, newStatus) {
    setSaving(id)
    try {
      await axios.patch(`/api/leads/${id}`, { Status: newStatus }, { withCredentials: true })
      setLeads(prev => prev.map(l => l.Id === id ? { ...l, Status: newStatus } : l))
    } catch {}
    setSaving(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a5c3a' }}>Leads</h1>
          <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>{total} total leads</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            placeholder="Search name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: 8,
              fontSize: 14, outline: 'none', width: 260,
            }}
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: 8,
              fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer',
            }}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Name','Phone','Insurance Type','Interest Level','Status','Last Contact',''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#888' }}>No leads found</td></tr>
                ) : leads.map(lead => (
                  <React.Fragment key={lead.Id}>
                    <tr
                      style={{ borderTop: '1px solid #f0f0f0', cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === lead.Id ? null : lead.Id)}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{lead.Name || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{lead.Phone || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{lead.Interest || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{lead.interest_level || '—'}</td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        <select
                          value={lead.Status || 'New'}
                          onChange={e => handleStatusChange(lead.Id, e.target.value)}
                          disabled={saving === lead.Id}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: `1.5px solid ${STATUS_COLOR[lead.Status] || '#6b7280'}`,
                            background: `${STATUS_COLOR[lead.Status] || '#6b7280'}15`,
                            color: STATUS_COLOR[lead.Status] || '#6b7280',
                            fontWeight: 600, fontSize: 12, cursor: 'pointer', outline: 'none',
                          }}
                        >
                          {STATUSES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>
                        {lead.UpdatedAt ? new Date(lead.UpdatedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#1a5c3a' }}>
                        {expanded === lead.Id ? '▲' : '▼'}
                      </td>
                    </tr>
                    {expanded === lead.Id && (
                      <tr style={{ background: '#f9fafb', borderTop: '1px solid #f0f0f0' }}>
                        <td colSpan={7} style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: 13, color: '#555' }}>
                            <strong style={{ color: '#1a5c3a' }}>Notes:</strong>{' '}
                            {lead.Notes || lead.notes || 'No notes available.'}
                          </div>
                          <div style={{ fontSize: 13, color: '#888', marginTop: 8, display: 'flex', gap: 24 }}>
                            <span><strong>Stage:</strong> {lead.Stage || '—'}</span>
                            <span><strong>Language:</strong> {lead.Language || '—'}</span>
                            <span><strong>Location:</strong> {lead.detected_state || '—'}</span>
                            <span><strong>Created:</strong> {lead.CreatedAt ? new Date(lead.CreatedAt).toLocaleDateString('en-IN') : '—'}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, color: '#888' }}>
                {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
              </span>
              <button
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                disabled={offset === 0}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: offset === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + LIMIT)}
                disabled={offset + LIMIT >= total}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: offset + LIMIT >= total ? 'not-allowed' : 'pointer', fontSize: 13 }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
