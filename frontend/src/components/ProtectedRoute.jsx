import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getMe } from '../services/api.js'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking') // 'checking' | 'valid' | 'invalid'

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setStatus('invalid')
      return
    }

    // Verify token with backend
    getMe()
      .then(() => setStatus('valid'))
      .catch(() => {
        // Token expired or invalid — clear and redirect
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setStatus('invalid')
      })
  }, [])

  if (status === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (status === 'invalid') {
    return <Navigate to="/login" replace />
  }

  return children
}
