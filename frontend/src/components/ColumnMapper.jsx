import { useState } from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'

export default function ColumnMapper({ extraColumns, missingColumns, suggestedMappings, onSubmit, loading }) {
  const [localMappings, setLocalMappings] = useState(suggestedMappings || {})

  const handleMap = (missingField, csvHeader) => {
    setLocalMappings(prev => {
      if (!csvHeader) {
        const next = { ...prev }
        delete next[missingField]
        return next
      }
      return { ...prev, [missingField]: csvHeader }
    })
  }

  const allMapped = missingColumns.every(f => !!localMappings[f])

  return (
    <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 600 }}>Map Unrecognised Columns</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Your CSV contains columns we didn't recognise, and is missing some required fields. 
        Please map the extra columns to the missing fields below.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {missingColumns.map(field => {
          const isMapped = !!localMappings[field]
          const isSuggested = suggestedMappings && suggestedMappings[field] === localMappings[field]

          return (
            <div key={field} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem', background: 'var(--bg-input)', borderRadius: '8px',
              border: `1px solid ${isMapped ? 'var(--success)' : 'var(--border)'}`,
              transition: 'all 0.3s ease'
            }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{field}</strong>
                {!isMapped ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <AlertTriangle size={12} /> Missing required field
                  </span>
                ) : isSuggested ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Sparkles size={12} /> Auto-suggested
                  </span>
                ) : null}
              </div>
              <select
                value={localMappings[field] || ''}
                onChange={(e) => handleMap(field, e.target.value)}
                style={{
                  padding: '0.6rem', borderRadius: '6px',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  border: `1px solid ${isMapped ? 'var(--success)' : 'var(--border)'}`,
                  minWidth: '220px', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="">-- Select Column --</option>
                {extraColumns.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn-primary"
          onClick={() => onSubmit(localMappings)}
          disabled={!allMapped || loading}
          style={{ opacity: (!allMapped || loading) ? 0.5 : 1 }}
        >
          {loading ? 'Saving...' : 'Confirm & Validate'}
        </button>
      </div>
    </div>
  )
}
