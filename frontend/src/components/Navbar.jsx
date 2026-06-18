import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon, Database } from 'lucide-react'
import { useTheme } from './ThemeContext.jsx'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  // Hide on login/register only
  if (['/login', '/register'].includes(location.pathname)) return null

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(20px)',
    }}>
      {/* Left — Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <Database size={24} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          Xeno Validator
        </span>
      </Link>

      {/* Center — Nav links */}
      {token && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to="/upload"
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: 999,
              fontSize: '0.9rem',
              fontWeight: isActive('/upload') ? 600 : 400,
              color: isActive('/upload') ? '#fff' : 'var(--text-secondary)',
              background: isActive('/upload') ? 'var(--accent)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
          >Upload</Link>
          <Link
            to="/history"
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: 999,
              fontSize: '0.9rem',
              fontWeight: isActive('/history') || isActive('/report') || isActive('/dashboard') ? 600 : 400,
              color: isActive('/history') || isActive('/report') || isActive('/dashboard') ? '#fff' : 'var(--text-secondary)',
              background: isActive('/history') || isActive('/report') || isActive('/dashboard') ? 'var(--accent)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
          >History</Link>
        </div>
      )}

      {/* Right — User + Theme + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={toggleTheme} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {token && user ? (
          <>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                color: 'var(--text-secondary)', textDecoration: 'none',
                fontSize: '0.9rem', fontWeight: 500,
                transition: 'color 0.3s ease',
              }}
            >Sign In</Link>
            <Link
              to="/register"
              className="btn-primary"
              style={{
                padding: '0.45rem 1.1rem', fontSize: '0.85rem',
                textDecoration: 'none',
              }}
            >Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
