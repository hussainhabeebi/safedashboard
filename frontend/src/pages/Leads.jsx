import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import useIsMobile from '../hooks/useIsMobile'

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
  const isMobile = useIsMobile()
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
  useEffect(() => { setOffset(0) }, [search, filter])

  async function handleStatusChange(id, newStatus) {
    setSaving(id)
    try {
      await axios.patch(`/api/leads/${id}`, { Stage: newStatus }, { withCredentials: true })
      setLeads(prev => prev.map(l => (l.id || l.Id) === id ? { ...l, stage: newStatus, Stage: newStatus } : l))
    } catch {}
    setSaving(null)
  }

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#1a5c3a' }}>Leads</h1>
        <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>{total} total leads</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
        <input
          placeholder="Search name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: 8,
            fontSize: 14, outline: 'none', width: isMobile ? '100%' : 260,
          }}
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: 8,
            fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Phone</th>
                {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Insurance Type</th>}
                {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Interest Level</th>}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Status</th>
                {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Last Contact</th>}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isMobile ? 4 : 7} style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={isMobile ? 4 : 7} style={{ padding: 32, textAlign: 'center', color: '#888' }}>No leads found</td></tr>
              ) : leads.map(lead => {
                const lid = lead.id || lead['SL NO'] || lead.Id
                const lname = lead.name || lead.Name || '—'
                const lphone = lead.phone || lead['Phone Number'] || lead.Phone || '—'
                const lstage = lead.stage || lead.Stage || lead.Status || 'New'
                const ldegree = lead.degree || lead.Degree || lead.Interest || ''
                const llang = lead.language || lead.Language || ''
                const lstate = lead.state || lead.State || lead.detected_state || ''
                const lgulf = lead.gulf || lead.Is_Gulf || ''
                return (
                <React.Fragment key={lid}>
                  <tr
                    style={{ borderTop: '1px solid #f0f0f0', cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === lid ? null : lid)}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{lname}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{lphone}</td>
                    {!isMobile && <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{ldegree || '—'}</td>}
                    {!isMobile && <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{lgulf ? `Gulf: ${lgulf}` : lstate || '—'}</td>}
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <select
                        value={lstage}
                        onChange={e => handleStatusChange(lid, e.target.value)}
                        disabled={saving === lid}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: `1.5px solid ${STATUS_COLOR[lstage] || '#6b7280'}`,
                          background: `${STATUS_COLOR[lstage] || '#6b7280'}15`,
                          color: STATUS_COLOR[lstage] || '#6b7280',
                          fontWeight: 600, fontSize: 12, cursor: 'pointer', outline: 'none',
                        }}
                      >
                        {STATUSES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    {!isMobile && <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>—</td>}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#1a5c3a' }}>
                      {expanded === lid ? '▲' : '▼'}
                    </td>
                  </tr>
                  {expanded === lid && (
                    <tr style={{ background: '#f9fafb', borderTop: '1px solid #f0f0f0' }}>
                      <td colSpan={isMobile ? 4 : 7} style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 4, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                          <span><strong>Stage:</strong> {lstage}</span>
                          <span><strong>Language:</strong> {llang || '—'}</span>
                          <span><strong>State:</strong> {lstate || '—'}</span>
                          <span><strong>Gulf:</strong> {lgulf || '—'}</span>
                          <span><strong>Eligible:</strong> {lead.eligible || lead.Eligible || '—'}</span>
                          <span><strong>Invite Sent:</strong> {lead.inviteSent || lead.Invite_Sent || '—'}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                )})}
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
    </Layout>
  )
}
