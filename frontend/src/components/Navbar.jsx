import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeContext.jsx'

export default function Navbar() {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left — Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <span style={{
          fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          Xeno<span style={{ color: 'var(--accent)' }}>Validator</span>
        </span>
      </Link>

      {/* Center — Nav links */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[
          { to: '/upload', label: 'Upload' },
          { to: '/history', label: 'History' },
        ].map(({ to, label }) => {
          const active = to === '/history'
            ? isActive('/history') || isActive('/report') || isActive('/dashboard')
            : isActive(to)
          return (
            <Link
              key={to}
              to={to}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 6,
                fontSize: '0.88rem',
                fontWeight: active ? 600 : 450,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-subtle)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >{label}</Link>
          )
        })}
      </div>

      {/* Right — Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 6, padding: '0.35rem',
          cursor: 'pointer', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Toggle Theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </nav>
  )
}
