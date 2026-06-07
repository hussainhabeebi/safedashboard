import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'en', label: 'English' },
]

export default function BotControl() {
  const [config, setConfig] = useState({ system_prompt: '', bot_enabled: true, default_language: 'auto' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    axios.get('/api/config', { withCredentials: true })
      .then(res => {
        const d = res.data || {}
        setConfig({
          system_prompt:    d.system_prompt    ?? d.SystemPrompt   ?? '',
          bot_enabled:      d.bot_enabled      ?? d.BotEnabled     ?? true,
          default_language: d.default_language ?? d.DefaultLanguage ?? 'auto',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.patch('/api/config', config, { withCredentials: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  function set(key, val) {
    setConfig(prev => ({ ...prev, [key]: val }))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#888' }}>Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a5c3a' }}>Bot Control</h1>
          <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Configure the AI assistant behaviour</p>
        </div>

        <form onSubmit={handleSave} style={{ maxWidth: 760 }}>
          {/* Bot Enable Toggle */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Bot Enabled</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                When disabled, the bot will not respond to incoming messages
              </div>
            </div>
            <button
              type="button"
              onClick={() => set('bot_enabled', !config.bot_enabled)}
              style={{
                width: 52, height: 28, borderRadius: 14,
                background: config.bot_enabled ? '#1a5c3a' : '#ddd',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: config.bot_enabled ? 27 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Default Language */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20,
          }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
              Default Language
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => set('default_language', l.value)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: `2px solid ${config.default_language === l.value ? '#1a5c3a' : '#ddd'}`,
                    background: config.default_language === l.value ? '#e8f5e9' : '#fff',
                    color: config.default_language === l.value ? '#1a5c3a' : '#555',
                    fontWeight: config.default_language === l.value ? 600 : 400,
                    cursor: 'pointer', fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24,
          }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
              System Prompt
            </label>
            <textarea
              value={config.system_prompt}
              onChange={e => set('system_prompt', e.target.value)}
              rows={20}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.6,
                padding: '14px',
                border: '1.5px solid #ddd',
                borderRadius: 8,
                resize: 'vertical',
                outline: 'none',
                color: '#333',
              }}
              onFocus={e => e.target.style.borderColor = '#1a5c3a'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
              placeholder="Enter the system prompt for the AI bot..."
            />
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 28px',
                background: saving ? '#3a7d5a' : '#1a5c3a',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 15, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <div style={{
                color: '#1a5c3a', fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 18 }}>✓</span> Saved successfully
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
