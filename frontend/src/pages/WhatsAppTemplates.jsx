import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import useIsMobile from '../hooks/useIsMobile'

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION']
const LANGUAGES = [
  { value: 'en_US', label: 'English' },
  { value: 'en_IN', label: 'English (India)' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'hi', label: 'Hindi' },
]
const STATUS_STYLE = {
  APPROVED: { bg: '#e8f5e9', color: '#1a5c3a' },
  PENDING: { bg: '#fff3cd', color: '#856404' },
  REJECTED: { bg: '#fef2f2', color: '#ef4444' },
}
const LEAD_STATUSES = ['New', 'Warm', 'Quoted', 'Closed', 'Not Interested']

export default function WhatsAppTemplates() {
  const isMobile = useIsMobile()
  const [tab, setTab] = useState('templates')
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', category: 'MARKETING', language: 'en_US', body: '' })
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState(null)
  const [templateError, setTemplateError] = useState(null)

  // Bulk send state
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [leads, setLeads] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState(['New', 'Warm'])
  const [selectedPhones, setSelectedPhones] = useState([])
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResults, setBulkResults] = useState(null)
  const [bulkProgress, setBulkProgress] = useState(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoadingTemplates(true)
    setTemplateError(null)
    try {
      const res = await axios.get('/api/whatsapp/templates', { withCredentials: true })
      const items = res.data?.data ?? res.data ?? []
      setTemplates(Array.isArray(items) ? items : [])
    } catch (err) {
      setTemplateError(err.response?.data?.error || 'Failed to load templates')
    }
    setLoadingTemplates(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!/^[a-z0-9_]+$/.test(createForm.name)) {
      setCreateResult({ ok: false, text: 'Name must be lowercase letters, numbers, underscores only' })
      return
    }
    setCreating(true)
    setCreateResult(null)
    try {
      await axios.post('/api/whatsapp/templates', {
        name: createForm.name,
        category: createForm.category,
        language: createForm.language,
        components: [{ type: 'BODY', text: createForm.body }]
      }, { withCredentials: true })
      setCreateResult({ ok: true, text: 'Template submitted for approval. Check status in a few minutes.' })
      setCreateForm({ name: '', category: 'MARKETING', language: 'en_US', body: '' })
      fetchTemplates()
    } catch (err) {
      setCreateResult({ ok: false, text: err.response?.data?.error || 'Failed to create template' })
    }
    setCreating(false)
  }

  async function loadLeads() {
    setLoadingLeads(true)
    try {
      const params = new URLSearchParams({ limit: 1000 })
      const all = []
      if (selectedStatuses.length && selectedStatuses.length < LEAD_STATUSES.length) {
        for (const s of selectedStatuses) {
          const res = await axios.get(`/api/leads?${params}&filter=${s}`, { withCredentials: true })
          const rows = res.data?.list ?? res.data?.records ?? []
          all.push(...(Array.isArray(rows) ? rows : []))
        }
      } else {
        const res = await axios.get(`/api/leads?${params}`, { withCredentials: true })
        const rows = res.data?.list ?? res.data?.records ?? []
        all.push(...(Array.isArray(rows) ? rows : []))
      }
      setLeads(all)
      // select all phones by default
      setSelectedPhones(all.filter(l => l.phone || l['Phone Number']).map(l => l.phone || l['Phone Number']))
    } catch {}
    setLoadingLeads(false)
  }

  async function handleBulkSend() {
    if (!selectedTemplate || !selectedPhones.length) return
    setBulkSending(true)
    setBulkResults(null)
    setBulkProgress(`Sending to ${selectedPhones.length} contacts...`)
    // Build lead objects for n8n (it builds template vars from name/state/degree etc.)
    const selectedLeads = leads
      .filter(l => selectedPhones.includes(l.phone || l['Phone Number']))
      .map(l => ({
        slno:    l.id || l['SL NO'] || '',
        name:    l.name || l.Name || '',
        phone:   l.phone || l['Phone Number'] || '',
        state:   l.state || l.State || '',
        degree:  l.degree || l.Degree || '',
        is_gulf: l.gulf || l.Is_Gulf || '',
      }))
    try {
      const tpl = templates.find(t => t.name === selectedTemplate)
      const res = await axios.post('/api/whatsapp/bulk', {
        leads: selectedLeads,
        templateName: selectedTemplate,
        language: tpl?.language || 'en_US',
      }, { withCredentials: true })
      setBulkResults(res.data)
      setBulkProgress(null)
    } catch (err) {
      setBulkProgress(null)
      setBulkResults({ error: err.response?.data?.error || 'Failed to send' })
    }
    setBulkSending(false)
  }

  function togglePhone(phone) {
    setSelectedPhones(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone])
  }

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED')
  const selectedTemplateObj = templates.find(t => t.name === selectedTemplate)
  // n8n shapes templates with top-level `body` field
  const templateBody = selectedTemplateObj?.body || selectedTemplateObj?.components?.find(c => c.type === 'BODY')?.text || ''

  return (
    <Layout>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a5c3a' }}>WhatsApp Marketing</h1>
          <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Manage templates and send bulk campaigns</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '2px solid #f0f0f0' }}>
          {[{ id: 'templates', label: '📄 Templates' }, { id: 'bulk', label: '📤 Bulk Send' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 24px', border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? '#1a5c3a' : '#888',
              borderBottom: tab === t.id ? '2px solid #1a5c3a' : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── TEMPLATES TAB ── */}
        {tab === 'templates' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#888' }}>{templates.length} templates · {approvedTemplates.length} approved</div>
              <button onClick={() => setShowCreate(!showCreate)} style={{
                padding: '9px 18px', background: '#1a5c3a', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                {showCreate ? '✕ Cancel' : '+ Create Template'}
              </button>
            </div>

            {/* Create Form */}
            {showCreate && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24, border: '1px solid #e8f5e9' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a5c3a', marginBottom: 16 }}>New Template</div>
                <form onSubmit={handleCreate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>NAME (lowercase, underscores)</label>
                      <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                        required placeholder="e.g. welcome_message"
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: 14, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>CATEGORY</label>
                      <select value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: 14, outline: 'none', background: '#fff' }}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>LANGUAGE</label>
                      <select value={createForm.language} onChange={e => setCreateForm(p => ({ ...p, language: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: 14, outline: 'none', background: '#fff' }}>
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>MESSAGE BODY</label>
                    <textarea value={createForm.body} onChange={e => setCreateForm(p => ({ ...p, body: e.target.value }))}
                      required rows={5} placeholder="Hi {{1}}, this is Safe Assets. We have a special offer on health insurance plans for your family..."
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Use {'{{1}}'}, {'{{2}}'} etc. for variable placeholders</div>
                  </div>
                  {createResult && (
                    <div style={{ padding: '10px 14px', borderRadius: 7, marginBottom: 12, background: createResult.ok ? '#e8f5e9' : '#fef2f2', color: createResult.ok ? '#1a5c3a' : '#ef4444', fontSize: 13 }}>
                      {createResult.text}
                    </div>
                  )}
                  <button type="submit" disabled={creating} style={{
                    padding: '10px 24px', background: creating ? '#aaa' : '#1a5c3a', color: '#fff',
                    border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer',
                  }}>{creating ? 'Submitting...' : 'Submit for Approval'}</button>
                </form>
              </div>
            )}

            {/* Templates Table */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              {loadingTemplates ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading templates...</div>
              ) : templateError ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>⚠️ {templateError}</div>
              ) : templates.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No templates found. Create one above.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                      {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>}
                      {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Language</th>}
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => {
                      const body = t.body || t.components?.find(c => c.type === 'BODY')?.text || '—'
                      const ss = STATUS_STYLE[t.status] || { bg: '#f3f4f6', color: '#888' }
                      return (
                        <tr key={t.id || t.name} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{t.name}</td>
                          {!isMobile && <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{t.category}</td>}
                          {!isMobile && <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{t.language}</td>}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color }}>{t.status}</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#555', maxWidth: 300 }}>
                            <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {body.length > 100 ? body.slice(0, 100) + '…' : body}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── BULK SEND TAB ── */}
        {tab === 'bulk' && (
          <div style={{ maxWidth: isMobile ? '100%' : 900 }}>
            {/* Step 1: Choose Template */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a5c3a', marginBottom: 14 }}>Step 1 — Choose Template</div>
              {approvedTemplates.length === 0 ? (
                <div style={{ color: '#888', fontSize: 13 }}>No approved templates yet. Go to Templates tab to create one.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {approvedTemplates.map(t => {
                    const body = t.components?.find(c => c.type === 'BODY')?.text || ''
                    return (
                      <label key={t.name} style={{
                        display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${selectedTemplate === t.name ? '#1a5c3a' : '#e8e8e8'}`,
                        background: selectedTemplate === t.name ? '#f0f7f3' : '#fff',
                      }}>
                        <input type="radio" name="template" value={t.name} checked={selectedTemplate === t.name}
                          onChange={() => setSelectedTemplate(t.name)} style={{ marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{body.slice(0, 120)}{body.length > 120 ? '…' : ''}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Choose Recipients */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a5c3a', marginBottom: 14 }}>Step 2 — Choose Recipients</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>FILTER BY STATUS</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {LEAD_STATUSES.map(s => (
                      <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" checked={selectedStatuses.includes(s)}
                          onChange={() => setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={loadLeads} disabled={loadingLeads || !selectedStatuses.length} style={{
                  padding: '9px 18px', background: '#1a5c3a', color: '#fff',
                  border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                  cursor: loadingLeads ? 'not-allowed' : 'pointer', alignSelf: 'flex-end',
                }}>
                  {loadingLeads ? 'Loading...' : 'Load Contacts'}
                </button>
              </div>

              {leads.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#888' }}>{selectedPhones.length} of {leads.filter(l => l.phone || l['Phone Number']).length} selected</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setSelectedPhones(leads.filter(l => l.phone || l['Phone Number']).map(l => l.phone || l['Phone Number']))}
                        style={{ padding: '5px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Select All</button>
                      <button onClick={() => setSelectedPhones([])}
                        style={{ padding: '5px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Deselect All</button>
                    </div>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
                        <tr>
                          {['', 'Name', 'Phone', 'Status'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {leads.filter(l => l.phone || l['Phone Number']).map((lead, i) => {
                          const lphone = lead.phone || lead['Phone Number']
                          return (
                          <tr key={lead.id || lead['SL NO'] || i} style={{ borderTop: '1px solid #f5f5f5', background: selectedPhones.includes(lphone) ? '#f8fff8' : 'transparent' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <input type="checkbox" checked={selectedPhones.includes(lphone)} onChange={() => togglePhone(lphone)} />
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 13 }}>{lead.name || lead.Name || '—'}</td>
                            <td style={{ padding: '8px 12px', fontSize: 13, fontFamily: 'monospace' }}>{lphone}</td>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: '#888' }}>{lead.stage || lead.Stage || '—'}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Preview & Send */}
            {selectedTemplate && leads.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a5c3a', marginBottom: 14 }}>Step 3 — Preview & Send</div>
                {templateBody && (
                  <div style={{ background: '#e8f5e9', borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                    {templateBody}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                  Will send to <strong style={{ color: '#1a5c3a' }}>{selectedPhones.length} contacts</strong>
                </div>
                <button onClick={handleBulkSend} disabled={bulkSending || !selectedPhones.length || !selectedTemplate} style={{
                  padding: '12px 28px', background: bulkSending ? '#aaa' : '#1a5c3a', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: bulkSending ? 'not-allowed' : 'pointer',
                }}>
                  {bulkSending ? '⏳ Sending...' : `📤 Send to ${selectedPhones.length} Contacts`}
                </button>
                {bulkProgress && <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>{bulkProgress}</div>}
              </div>
            )}

            {/* Results */}
            {bulkResults && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a5c3a', marginBottom: 12 }}>Send Results</div>
                {bulkResults.error ? (
                  <div style={{ color: '#ef4444', fontSize: 13 }}>{bulkResults.error}</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                      <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '10px 20px', fontSize: 14 }}>
                        <strong style={{ color: '#1a5c3a', fontSize: 20 }}>{bulkResults.sent}</strong><br />
                        <span style={{ color: '#888', fontSize: 12 }}>Sent</span>
                      </div>
                      <div style={{ background: '#fef2f2', borderRadius: 8, padding: '10px 20px', fontSize: 14 }}>
                        <strong style={{ color: '#ef4444', fontSize: 20 }}>{bulkResults.failed}</strong><br />
                        <span style={{ color: '#888', fontSize: 12 }}>Failed</span>
                      </div>
                    </div>
                    {bulkResults.results?.filter(r => r.status === 'failed').length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>FAILED NUMBERS</div>
                        {bulkResults.results.filter(r => r.status === 'failed').map((r, i) => (
                          <div key={i} style={{ fontSize: 13, color: '#ef4444', marginBottom: 4 }}>
                            {r.phone} — {r.error}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
    </Layout>
  )
}
