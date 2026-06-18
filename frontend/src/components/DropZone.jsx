import { useState, useRef } from 'react'
import { UploadCloud, File, CheckCircle, AlertCircle } from 'lucide-react'

export default function DropZone({ onFileSelected, error }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file)
        onFileSelected(file)
      }
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      onFileSelected(e.target.files[0])
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      style={{
        border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '16px',
        padding: '3rem 2rem',
        textAlign: 'center',
        background: dragActive ? 'var(--accent-glow)' : 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      
      {selectedFile ? (
        <>
          <div style={{ color: 'var(--success)', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={48} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{selectedFile.name}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Ready for processing</p>
          </div>
        </>
      ) : (
        <>
          <div style={{ color: 'var(--accent)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <UploadCloud size={48} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Drag & Drop your CSV file here</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>or click to browse from your computer</p>
          </div>
        </>
      )}
    </div>
  )
}
