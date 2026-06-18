import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Upload as UploadIcon } from 'lucide-react'
import DropZone from '../components/DropZone.jsx'
import ColumnMapper from '../components/ColumnMapper.jsx'
import { uploadCSV, confirmMapping, validateUpload } from '../services/api.js'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [step, setStep] = useState('select')       // select | uploading | mapping | validating | done | error
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [uploadId, setUploadId] = useState(null)
  const [extraColumns, setExtraColumns] = useState([])
  const [missingColumns, setMissingColumns] = useState([])
  const [suggestedMappings, setSuggestedMappings] = useState({})
  const navigate = useNavigate()

  const handleUpload = async () => {
    if (!file) return
    setError('')
    setStep('uploading')
    setProgress('Uploading CSV...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadCSV(formData)
      const data = res.data.data

      setUploadId(data.uploadId)

      if (data.needsMapping) {
        setExtraColumns(data.extraColumns)
        setMissingColumns(data.missingColumns || [])
        setSuggestedMappings(data.suggestedMappings || {})
        setStep('mapping')
        return
      }

      // Columns OK — proceed to validation
      await runValidation(data.uploadId)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.')
      setStep('error')
    }
  }

  const handleMappingSubmit = async (mapping) => {
    setStep('uploading')
    setProgress('Saving column mapping...')
    try {
      await confirmMapping(uploadId, mapping)
      await runValidation(uploadId)
    } catch (err) {
      setError(err.response?.data?.error || 'Mapping failed.')
      setStep('error')
    }
  }

  const runValidation = async (id) => {
    setStep('validating')
    setProgress('Running validation pipeline — this may take a moment...')
    try {
      await validateUpload(id)
      setStep('done')
      setTimeout(() => navigate(`/dashboard/${id}`), 500)
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed.')
      setStep('error')
    }
  }

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 640, margin: '2rem auto' }}>
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Upload & Validate
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Upload your transaction CSV to run automated validation
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="animate-fade-in" style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            color: 'var(--error)', padding: '1rem 1.25rem',
            borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <AlertTriangle size={18} /> {error}
            <button onClick={() => { setStep('select'); setError('') }}
              style={{ marginLeft: '1rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Try again
            </button>
          </div>
        )}

        {/* Step: Select file */}
        {step === 'select' || step === 'error' ? (
          <div className="animate-fade-in">
            <DropZone onFileSelected={setFile} disabled={false} />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={handleUpload} disabled={!file}
                style={{ fontSize: '1.05rem', padding: '0.9rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadIcon size={18} /> Upload & Validate
              </button>
            </div>
          </div>
        ) : null}

        {/* Step: Uploading / Validating */}
        {(step === 'uploading' || step === 'validating') && (
          <div className="glass-card animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 1.5rem' }}></div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {step === 'uploading' ? 'Uploading...' : 'Validating...'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{progress}</div>
            <div className="progress-bar" style={{ marginTop: '1.5rem' }}>
              <div className="progress-bar-fill animate-shimmer" style={{ width: step === 'validating' ? '70%' : '35%' }}></div>
            </div>
          </div>
        )}

        {/* Step: Column Mapping */}
        {step === 'mapping' && (
          <ColumnMapper
            extraColumns={extraColumns}
            missingColumns={missingColumns}
            suggestedMappings={suggestedMappings}
            onSubmit={handleMappingSubmit}
            loading={false}
          />
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="glass-card animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--success)', marginBottom: '1rem' }}>
              <CheckCircle size={48} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Validation Complete!
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>Redirecting to dashboard...</div>
          </div>
        )}
      </div>
    </div>
  )
}
