import React from 'react'
import Sidebar from './Sidebar'
import useIsMobile from '../hooks/useIsMobile'

export default function Layout({ children }) {
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: isMobile ? '68px 16px 80px' : '32px 40px',
        overflow: 'auto',
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  )
}
