import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import useIsMobile from '../hooks/useIsMobile'

// n8n shapes convs: { id:'C-123', rawId:123, contactName, contactPhone, status, unread, lastTs, preview, assigned }
// assigned is null or first-name string e.g. 'rasi'

const STATUS_STYLE = {
  open:     { bg: '#e8f5e9', color: '#1a5c3a', label: 'Open' },
  resolved: { bg: '#f3f4f6', color: '#6b7280', label: 'Resolved' },
  pending:  { bg: '#fff3cd', color: '#856404', label: 'Pending' },
}
const FILTERS = ['all', 'open', 'resolved', 'pending', 'bot', 'human']

export default function Conversations() {
  const [conversations, setConversations] = useState([])
  const [filtered, setFiltered] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [msgsError, setMsgsError] = useState(null)
  const [handingOver, setHandingOver] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [mobileView, setMobileView] = useState('list')
  const messagesEndRef = useRef(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    axios.get('/api/conversations', { withCredentials: true })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : []
        setConversations(items)
      })
      .catch(err => setListError(err.response?.data?.error || 'Failed to load conversations'))
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    let list = [...conversations]
    if (filter === 'bot')        list = list.filter(c => !c.assigned)
    else if (filter === 'human') list = list.filter(c => !!c.assigned)
    else if (filter !== 'all')   list = list.filter(c => c.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        (c.contactName || '').toLowerCase().includes(q) ||
        (c.contactPhone || '').includes(q)
      )
    }
    setFiltered(list)
  }, [conversations, filter, search])

  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true)
    setMsgsError(null)
    setMessages([])
    axios.get(`/api/conversations/${selected.id}/messages`, { withCredentials: true })
      .then(res => {
        const msgs = res.data?.payload ?? res.data ?? []
        const arr = Array.isArray(msgs) ? msgs : []
        setMessages(arr.sort((a, b) => a.created_at - b.created_at))
      })
      .catch(err => setMsgsError(err.response?.data?.error || 'Failed to load messages'))
      .finally(() => setLoadingMsgs(false))
  }, [selected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectConversation(c) {
    setSelected(c)
    if (isMobile) setMobileView('thread')
  }

  async function handleHandover(id) {
    setHandingOver(true)
    try {
      await axios.post(`/api/conversations/${id}/handover`, {}, { withCredentials: true })
      setConversations(prev => prev.map(c => c.id === id ? { ...c, assigned: 'rasi' } : c))
      setSelected(prev => prev?.id === id ? { ...prev, assigned: 'rasi' } : prev)
    } catch {}
    setHandingOver(false)
  }

  async function handleSend() {
    if (!reply.trim() || !selected) return
    setSending(true)
    const content = reply.trim()
    setReply('')
    const tempMsg = { id: Date.now(), content, message_type: 'outgoing', created_at: Math.floor(Date.now() / 1000) }
    setMessages(prev => [...prev, tempMsg])
    try {
      await axios.post(`/api/conversations/${selected.id}/messages`, { content }, { withCredentials: true })
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setReply(content)
    }
    setSending(false)
  }

  const sStyle = c => STATUS_STYLE[c.status] || STATUS_STYLE.open
  const showList   = !isMobile || mobileView === 'list'
  const showThread = !isMobile || mobileView === 'thread'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100vh', paddingTop: isMobile ? 52 : 0 }}>

        {showList && (
          <div style={{ width: isMobile ? '100%' : 320, flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid #e8e8e8', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a5c3a' }}>Conversations</h2>
                <span style={{ fontSize: 12, background: '#e8f5e9', color: '#1a5c3a', borderRadius: 10, padding: '2px 8px', fontWeight: 600 }}>{conversations.length}</span>
              </div>
              <input placeholder="Search name or phone..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: 14, outline: 'none', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '3px 9px', borderRadius: 12, border: 'none',
                    background: filter === f ? '#1a5c3a' : '#f0f0f0',
                    color: filter === f ? '#fff' : '#555',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
                  }}>{f}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>Loading...</div>
              ) : listError ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#ef4444', fontSize: 12 }}>⚠️ {listError}</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No conversations</div>
              ) : filtered.map(c => (
                <div key={c.id} onClick={() => selectConversation(c)} style={{
                  padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                  background: selected?.id === c.id ? '#f0f7f3' : 'transparent',
                  borderLeft: selected?.id === c.id ? '3px solid #1a5c3a' : '3px solid transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#222' }}>{c.contactName || 'Unknown'}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: sStyle(c).bg, color: sStyle(c).color, fontWeight: 600 }}>{sStyle(c).label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{c.contactPhone || ''}</div>
                  {c.preview && (
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.preview}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: c.assigned ? '#fff3cd' : '#e8f5e9', color: c.assigned ? '#856404' : '#1a5c3a' }}>
                      {c.assigned ? `👤 ${c.assigned}` : '🤖 Bot'}
                    </span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{c.lastTs || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showThread && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f2f5', overflow: 'hidden', width: isMobile ? '100%' : 'auto' }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <div>Select a conversation</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isMobile && (
                      <button onClick={() => { setSelected(null); setMobileView('list') }}
                        style={{ background: 'none', border: 'none', color: '#1a5c3a', fontSize: 22, cursor: 'pointer', fontWeight: 700, padding: '0 4px' }}>
                        ←
                      </button>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.contactName || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{selected.contactPhone}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: selected.assigned ? '#fff3cd' : '#e8f5e9', color: selected.assigned ? '#856404' : '#1a5c3a' }}>
                      {selected.assigned ? `👤 ${selected.assigned}` : '🤖 Bot'}
                    </span>
                    {!selected.assigned && (
                      <button onClick={() => handleHandover(selected.id)} disabled={handingOver} style={{
                        padding: '6px 12px', background: '#1a5c3a', color: '#fff', border: 'none',
                        borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: handingOver ? 'not-allowed' : 'pointer',
                      }}>{handingOver ? '...' : 'Hand to Rasi'}</button>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {loadingMsgs ? (
                    <div style={{ textAlign: 'center', color: '#888', paddingTop: 40 }}>Loading messages...</div>
                  ) : msgsError ? (
                    <div style={{ textAlign: 'center', color: '#ef4444', paddingTop: 40, fontSize: 13 }}>⚠️ {msgsError}</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#aaa', paddingTop: 40 }}>No messages</div>
                  ) : messages.map(msg => {
                    const incoming = msg.message_type === 'incoming' || msg.message_type === 0
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: incoming ? 'flex-start' : 'flex-end' }}>
                        <div style={{
                          maxWidth: isMobile ? '82%' : '65%', padding: '9px 13px',
                          borderRadius: incoming ? '2px 14px 14px 14px' : '14px 2px 14px 14px',
                          background: incoming ? '#fff' : '#dcf8c6', fontSize: 14, lineHeight: 1.5,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
                        }}>
                          {msg.content || <em style={{ color: '#aaa' }}>(media)</em>}
                          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 3 }}>
                            {msg.created_at ? new Date(msg.created_at * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #e8e8e8', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                  <textarea value={reply} onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Type a reply..." rows={2}
                    style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={handleSend} disabled={sending || !reply.trim()} style={{
                    padding: '10px 16px', background: reply.trim() && !sending ? '#1a5c3a' : '#ccc',
                    color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700,
                    cursor: reply.trim() && !sending ? 'pointer' : 'not-allowed', flexShrink: 0,
                  }}>➤</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
