import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader, Clock, XCircle, FolderOpen } from 'lucide-react'
import { getHistory } from '../services/api.js'

export default function History() {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await getHistory()
      setUploads(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoading(false)
    }
  }

  const avgScore = uploads.length > 0
    ? (uploads.reduce((sum, u) => sum + (u.quality_score || 0), 0) / uploads.length).toFixed(1)
    : 0

  const statusBadge = (status) => {
    const map = {
      completed:  { class: 'badge-success', label: 'Completed', icon: CheckCircle },
      processing: { class: 'badge-info',    label: 'Processing', icon: Loader },
      pending:    { class: 'badge-warning',  label: 'Pending', icon: Clock },
      failed:     { class: 'badge-error',    label: 'Failed', icon: XCircle },
    }
    const b = map[status] || { class: 'badge-info', label: status, icon: Clock }
    const Icon = b.icon
    return (
      <span className={`badge ${b.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Icon size={12} /> {b.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>Upload History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {uploads.length} total uploads • Avg quality score: {avgScore}%
        </p>
      </div>

      {uploads.length === 0 ? (
        <div className="glass-card animate-fade-in" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <FolderOpen size={48} />
          </div>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No uploads yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload your first CSV to get started</p>
          <button className="btn-primary" onClick={() => navigate('/upload')}>Go to Upload</button>
        </div>
      ) : (
        <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Upload Date</th>
                  <th>Total Rows</th>
                  <th>Quality Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.original_filename}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(u.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>{u.total_rows?.toLocaleString() || '—'}</td>
                    <td>
                      {u.quality_score != null ? (
                        <span style={{
                          color: u.quality_score >= 90 ? 'var(--success)' : u.quality_score >= 75 ? 'var(--info)' : u.quality_score >= 50 ? 'var(--warning)' : 'var(--error)',
                          fontWeight: 600,
                        }}>{u.quality_score}%</span>
                      ) : '—'}
                    </td>
                    <td>{statusBadge(u.status)}</td>
                    <td>
                      {u.status === 'completed' ? (
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                          onClick={() => navigate(`/report/${u.id}`)}>
                          View Report
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
