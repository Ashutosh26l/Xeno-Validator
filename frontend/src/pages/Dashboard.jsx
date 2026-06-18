import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Funnel as FunnelIcon, CheckCircle, XCircle, Star, FileText, Package, ClipboardList, Activity, Download } from 'lucide-react'
import { getReport, downloadZip, downloadClean, downloadInvalid, downloadErrors, downloadSummary } from '../services/api.js'
import SummaryCard from '../components/SummaryCard.jsx'
import QualityBadge from '../components/QualityBadge.jsx'
import ErrorTable from '../components/ErrorTable.jsx'

const PIE_COLORS = ['#74b9ff', '#fdcb6e', '#ff6b6b', '#e17055', '#ffeaa7', '#d63031']

export default function Dashboard() {
  const { uploadId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    fetchReport()
  }, [uploadId])

  const fetchReport = async () => {
    try {
      const res = await getReport(uploadId)
      setReport(res.data.data)
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (type, fn) => {
    setDownloading(type)
    try {
      const res = await fn(uploadId)
      window.open(res.data.data.downloadUrl, '_blank')
    } catch (err) {
      console.error(`Download ${type} failed:`, err)
      alert(`Download failed: ${err.response?.data?.error || err.message}`)
    } finally {
      setDownloading('')
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Report not found.</p>
      </div>
    )
  }

  const r = report
  const eb = r.errorBreakdown || {}

  // Chart data
  const funnelData = [
    { name: 'Total Uploaded', value: r.totalRows || 0, fill: '#74b9ff' },
    { name: 'Valid & Clean', value: r.validRows || 0, fill: '#55efc4' },
    { name: 'Auto-Fixed', value: eb.correctedCount || 0, fill: '#ffeaa7' },
    { name: 'Dropped/Invalid', value: r.invalidRows || 0, fill: '#ff7675' }
  ].sort((a, b) => b.value - a.value)

  const qb = r.qualityBreakdown || {}

  const radarData = [
    { subject: 'Completeness', A: qb.completeness || 0, fullMark: 100 },
    { subject: 'Accuracy', A: qb.accuracy || 0, fullMark: 100 },
    { subject: 'Consistency', A: qb.consistency || 0, fullMark: 100 },
    { subject: 'Format Validity', A: Math.round(((r.validRows || 0) / (r.totalRows || 1)) * 100), fullMark: 100 },
    { subject: 'AI Fix Rate', A: Math.round(((eb.correctedCount || 0) / ((r.invalidRows || 0) + (eb.correctedCount || 0) || 1)) * 100), fullMark: 100 }
  ];

  const pieData = [
    { name: 'Phone', value: eb.phoneErrors || 0 },
    { name: 'Date', value: eb.dateErrors || 0 },
    { name: 'Payment', value: eb.paymentErrors || 0 },
    { name: 'Integrity', value: eb.integrityErrors || 0 },
    { name: 'Duplicate', value: eb.duplicateErrors || 0 },
    { name: 'Missing', value: eb.missingErrors || 0 },
  ].filter(d => d.value > 0)


  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>Validation Report</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} /> {r.originalFilename} • Uploaded {new Date(r.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <SummaryCard label="Total Rows" value={r.totalRows?.toLocaleString()} icon={FunnelIcon} color="var(--info)" />
        <SummaryCard label="Valid Rows" value={r.validRows?.toLocaleString()} icon={CheckCircle} color="var(--success)" />
        <SummaryCard label="Invalid Rows" value={r.invalidRows?.toLocaleString()} icon={XCircle} color="var(--error)" />
        <SummaryCard label="Quality Score" value={<QualityBadge score={r.qualityScore} />} icon={Star} color="var(--accent)" />
      </div>

      {/* Quality Breakdown & Radar */}
      <div className="glass-card animate-fade-in-delay" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Quality Matrix</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          {/* Progress Bars side */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { label: 'Completeness', value: qb.completeness, color: 'var(--success)' },
              { label: 'Accuracy', value: qb.accuracy, color: 'var(--info)' },
              { label: 'Consistency', value: qb.consistency, color: 'var(--accent)' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: item.color }}>{item.value ?? 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${item.value ?? 0}%`, background: item.color }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Radar Chart side */}
          <div style={{ flex: '1 1 300px', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.5} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Funnel Chart */}
        <div className="glass-card animate-fade-in-delay" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Data Processing Pipeline</h3>
          <ResponsiveContainer width="100%" height={280}>
            <FunnelChart>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }} />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                <LabelList position="right" fill="var(--text-primary)" stroke="none" dataKey="name" fontSize={12} />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass-card animate-fade-in-delay" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Error Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={90} innerRadius={45} paddingAngle={3} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              No errors found
            </div>
          )}
        </div>
      </div>



      {/* Downloads */}
      <div className="glass-card animate-fade-in-delay" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={20} /> Downloads
        </h3>
        {r.isChunked && (
          <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
            Clean data split into {r.chunkCount} balanced chunks in ZIP
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => handleDownload('zip', downloadZip)} disabled={downloading === 'zip'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} /> {downloading === 'zip' ? '...' : 'ZIP (All Files)'}
          </button>
          {!r.isChunked && r.validRows > 0 && (
            <button className="btn-secondary" onClick={() => handleDownload('clean', downloadClean)} disabled={downloading === 'clean'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> {downloading === 'clean' ? '...' : 'Clean CSV'}
            </button>
          )}
          <button className="btn-secondary" onClick={() => handleDownload('invalid', downloadInvalid)} disabled={downloading === 'invalid'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={16} /> {downloading === 'invalid' ? '...' : 'Invalid Rows'}
          </button>
          <button className="btn-secondary" onClick={() => handleDownload('errors', downloadErrors)} disabled={downloading === 'errors'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={16} /> {downloading === 'errors' ? '...' : 'Error Report'}
          </button>
          <button className="btn-secondary" onClick={() => handleDownload('summary', downloadSummary)} disabled={downloading === 'summary'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} /> {downloading === 'summary' ? '...' : 'Summary PDF'}
          </button>
        </div>
      </div>

      {/* Error Table */}
      <ErrorTable uploadId={uploadId} />
    </div>
  )
}
