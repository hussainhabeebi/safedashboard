import React, { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import axios from 'axios'

export default function ProtectedRoute() {
  const [state, setState] = useState('loading') // loading | ok | fail

  useEffect(() => {
    axios.get('/api/me', { withCredentials: true })
      .then(() => setState('ok'))
      .catch(() => setState('fail'))
  }, [])

  if (state === 'loading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f0f2f5'
      }}>
        <div style={{ color: '#1a5c3a', fontSize: 18 }}>Loading...</div>
      </div>
    )
  }

  if (state === 'fail') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
