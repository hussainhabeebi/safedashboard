import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

export default function Conversations() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [handingOver, setHandingOver] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    axios.get('/api/conversations', { withCredentials: true })
      .then(res => {
        const items = res.data?.data?.payload ?? res.data?.payload ?? res.data ?? []
        setConversations(Array.isArray(items) ? items : [])
      })
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true)
    axios.get(`/api/conversations/${selected.id}/messages`, { withCredentials: true })
      .then(res => {
        const msgs = res.data?.payload ?? res.data ?? []
        setMessages(Array.isArray(msgs) ? msgs.sort((a, b) => a.created_at - b.created_at) : [])
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
  }, [selected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleHandover(id) {
    setHandingOver(true)
    try {
      await axios.post(`/api/conversations/${id}/handover`, {}, { withCredentials: true })
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, meta: { ...c.meta, assignee: { name: 'Rasi' } } } : c
      ))
      if (selected?.id === id) {
        setSelected(prev => ({ ...prev, meta: { ...prev.meta, assignee: { name: 'Rasi' } } }))
      }
    } catch {}
    setHandingOver(false)
  }

  const isHuman = c => !!(c?.meta?.assignee)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100vh' }}>
        {/* Conversation List */}
        <div style={{
          width: 320, flexShrink: 0, borderRight: '1px solid #e8e8e8',
          background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a5c3a' }}>Conversations</h2>
            <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>WhatsApp threads</p>
          </div>
          {loadingList ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>No conversations</div>
          ) : conversations.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f5f5f5',
                cursor: 'pointer',
                background: selected?.id === c.id ? '#f0f7f3' : 'transparent',
                borderLeft: selected?.id === c.id ? '3px solid #1a5c3a' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>
                  {c.meta?.sender?.name || 'Unknown'}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                  background: isHuman(c) ? '#fff3cd' : '#e8f5e9',
                  color: isHuman(c) ? '#856404' : '#1a5c3a',
                }}>
                  {isHuman(c) ? 'Human' : 'Bot'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.meta?.sender?.phone_number || ''}
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                {c.last_activity_at ? new Date(c.last_activity_at * 1000).toLocaleDateString('en-IN') : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f2f5', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <div>Select a conversation</div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{
                padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e8e8e8',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.meta?.sender?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{selected.meta?.sender?.phone_number}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                    background: isHuman(selected) ? '#fff3cd' : '#e8f5e9',
                    color: isHuman(selected) ? '#856404' : '#1a5c3a',
                  }}>
                    {isHuman(selected) ? '👤 Human handling' : '🤖 Bot active'}
                  </span>
                  {!isHuman(selected) && (
                    <button
                      onClick={() => handleHandover(selected.id)}
                      disabled={handingOver}
                      style={{
                        padding: '8px 16px',
                        background: handingOver ? '#ccc' : '#1a5c3a',
                        color: '#fff', border: 'none', borderRadius: 8,
                        fontSize: 13, fontWeight: 600, cursor: handingOver ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {handingOver ? 'Assigning...' : 'Hand to Rasi'}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: 40 }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: 40 }}>No messages</div>
                ) : messages.map(msg => {
                  const incoming = msg.message_type === 'incoming' || msg.message_type === 0
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: incoming ? 'flex-start' : 'flex-end' }}>
                      <div style={{
                        maxWidth: '68%',
                        padding: '10px 14px',
                        borderRadius: incoming ? '2px 14px 14px 14px' : '14px 2px 14px 14px',
                        background: incoming ? '#fff' : '#dcf8c6',
                        color: '#222',
                        fontSize: 14,
                        lineHeight: 1.5,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      }}>
                        {msg.content || '(media)'}
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4, textAlign: 'right' }}>
                          {msg.created_at ? new Date(msg.created_at * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
