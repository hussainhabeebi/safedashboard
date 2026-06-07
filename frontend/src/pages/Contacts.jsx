import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)
  const [convos, setConvos] = useState({})
  const [loadingConvos, setLoadingConvos] = useState(null)
  const navigate = useNavigate()

  const fetchContacts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page })
    if (search) params.set('search', search)
    axios.get(`/api/conversations/contacts?${params}`, { withCredentials: true })
      .then(res => {
        const items = res.data?.payload ?? res.data?.contacts ?? res.data ?? []
        setContacts(Array.isArray(items) ? items : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { setPage(1) }, [search])

  async function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!convos[id]) {
      setLoadingConvos(id)
      try {
        const res = await axios.get(`/api/conversations/contacts/${id}/conversations`, { withCredentials: true })
        const items = res.data?.payload ?? res.data ?? []
        setConvos(prev => ({ ...prev, [id]: Array.isArray(items) ? items : [] }))
      } catch {}
      setLoadingConvos(null)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a5c3a' }}>Contacts</h1>
          <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>All Chatwoot contacts</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', width: 280 }}
          />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Name', 'Phone', 'Email', 'Location', 'Conversations', 'Created', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</td></tr>
                ) : contacts.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#888' }}>No contacts found</td></tr>
                ) : contacts.map(c => (
                  <React.Fragment key={c.id}>
                    <tr
                      style={{ borderTop: '1px solid #f0f0f0', cursor: 'pointer' }}
                      onClick={() => toggleExpand(c.id)}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {c.thumbnail ? (
                            <img src={c.thumbnail} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#1a5c3a', fontWeight: 700 }}>
                              {(c.name || '?')[0].toUpperCase()}
                            </div>
                          )}
                          {c.name || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{c.phone_number || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{c.email || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{c.location || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{c.conversations_count ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>
                        {c.created_at ? new Date(c.created_at * 1000).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#1a5c3a' }}>
                        {expanded === c.id ? '▲' : '▼'}
                      </td>
                    </tr>
                    {expanded === c.id && (
                      <tr style={{ background: '#f9fafb', borderTop: '1px solid #f0f0f0' }}>
                        <td colSpan={7} style={{ padding: '16px 24px' }}>
                          {loadingConvos === c.id ? (
                            <div style={{ color: '#888', fontSize: 13 }}>Loading conversations...</div>
                          ) : (convos[c.id] || []).length === 0 ? (
                            <div style={{ color: '#888', fontSize: 13 }}>No conversations</div>
                          ) : (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>Conversations</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(convos[c.id] || []).map(conv => (
                                  <div
                                    key={conv.id}
                                    onClick={() => navigate('/conversations')}
                                    style={{
                                      display: 'flex', gap: 16, alignItems: 'center',
                                      padding: '8px 12px', background: '#fff', borderRadius: 8,
                                      border: '1px solid #e8e8e8', cursor: 'pointer', fontSize: 13,
                                    }}
                                  >
                                    <span style={{ color: '#1a5c3a', fontWeight: 600 }}>#{conv.id}</span>
                                    <span style={{ color: '#555', flex: 1 }}>{conv.meta?.channel || 'WhatsApp'}</span>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                                      background: conv.status === 'open' ? '#e8f5e9' : '#f3f4f6',
                                      color: conv.status === 'open' ? '#1a5c3a' : '#6b7280',
                                    }}>
                                      {conv.status}
                                    </span>
                                    <span style={{ color: '#aaa', fontSize: 12 }}>
                                      {conv.last_activity_at ? new Date(conv.last_activity_at * 1000).toLocaleDateString('en-IN') : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#888' }}>Page {page}</span>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              Previous
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={contacts.length < 15}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: contacts.length < 15 ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
