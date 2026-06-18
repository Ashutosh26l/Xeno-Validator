import { useState, useEffect } from 'react'
import { getErrors } from '../services/api.js'

const TYPES = ['all', 'phone', 'date', 'payment', 'integrity', 'duplicate', 'missing', 'corrected']

export default function ErrorTable({ uploadId }) {
  const [errors, setErrors] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchErrors()
  }, [page, type])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      const res = await getErrors(uploadId, { type, page, limit: 50 })
      const d = res.data.data
      setErrors(d.errors)
      setTotal(d.total)
      setTotalPages(d.totalPages)
    } catch (err) {
      console.error('Failed to fetch errors:', err)
    } finally {
      setLoading(false)
    }
  }

  const badgeColor = (t) => {
    const map = {
      phone: 'var(--info)', date: 'var(--warning)', payment: 'var(--error)',
      integrity: 'var(--error)', duplicate: 'var(--warning)', missing: 'var(--error)',
      corrected: 'var(--success)',
    }
    return map[t] || 'var(--text-secondary)'
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          Error Log <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({total} total)</span>
        </h3>
      </div>

      {/* Filter tabs */}
      <div className="tab-filter" style={{ marginBottom: '1rem' }}>
        {TYPES.map(t => (
          <button key={t} className={type === t ? 'active' : ''} onClick={() => { setType(t); setPage(1) }}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Row #</th>
              <th>Field</th>
              <th>Type</th>
              <th>Original Value</th>
              <th>Message</th>
              <th>Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </td></tr>
            ) : errors.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No errors found.
              </td></tr>
            ) : errors.map((e, i) => (
              <tr key={e.id || i}>
                <td style={{ fontWeight: 600 }}>{e.row_number}</td>
                <td><code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 6, fontSize: '0.85rem' }}>{e.field_name}</code></td>
                <td><span className="badge" style={{ background: `${badgeColor(e.error_type)}20`, color: badgeColor(e.error_type) }}>{e.error_type}</span></td>
                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.original_value}</td>
                <td style={{ maxWidth: 250, fontSize: '0.85rem' }}>{e.error_message}</td>
                <td style={{ maxWidth: 200, fontSize: '0.85rem', color: 'var(--success)' }}>{e.suggestion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
