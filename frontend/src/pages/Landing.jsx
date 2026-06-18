import { useNavigate } from 'react-router-dom'
import {
  Upload, History, ShieldCheck, FileSpreadsheet,
  ArrowRight, Zap, BarChart3, Download, CheckCircle2,
  Database
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleAction = (path) => {
    if (token) {
      navigate(path)
    } else {
      navigate('/login')
    }
  }

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 60%)',
      }}>
        {/* Floating orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '5%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(165,94,234,0.08), transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', borderRadius: 999,
            background: 'var(--accent-glow)', border: '1px solid var(--border-accent)',
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)',
            marginBottom: '1.5rem',
          }}>
            <Zap size={14} /> Automated CSV Validation
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 50%, #a55eea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Validate Your Transaction
            <br />Data in Seconds
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--text-secondary)',
            maxWidth: 560,
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}>
            Upload your CSV files and get instant validation with detailed error reports,
            quality scores, and clean data exports.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex', gap: '1rem',
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <button
              id="hero-upload-btn"
              className="btn-primary"
              onClick={() => handleAction('/upload')}
              style={{
                fontSize: '1.05rem', padding: '0.95rem 2.2rem',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
              }}
            >
              <Upload size={20} /> Upload CSV
              <ArrowRight size={18} style={{ marginLeft: '0.25rem' }} />
            </button>
            <button
              id="hero-history-btn"
              className="btn-secondary"
              onClick={() => handleAction('/history')}
              style={{
                fontSize: '1.05rem', padding: '0.95rem 2.2rem',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
              }}
            >
              <History size={20} /> View History
            </button>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────── */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
      }}>
        <div className="animate-fade-in-delay" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            marginBottom: '0.75rem',
          }}>
            Everything You Need
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            maxWidth: 480,
            margin: '0 auto',
          }}>
            Powerful validation pipeline built for transaction data accuracy
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {[
            {
              icon: <FileSpreadsheet size={26} />,
              title: 'Smart Column Mapping',
              desc: 'Auto-detects your CSV columns and suggests intelligent mappings for mismatched headers.',
              color: '#6366f1',
            },
            {
              icon: <ShieldCheck size={26} />,
              title: 'Multi-Rule Validation',
              desc: 'Validates dates, amounts, emails, duplicates, and custom business rules in one pass.',
              color: '#10b981',
            },
            {
              icon: <BarChart3 size={26} />,
              title: 'Quality Scoring',
              desc: 'Get an instant quality score with detailed breakdowns per field and validation rule.',
              color: '#f59e0b',
            },
            {
              icon: <Download size={26} />,
              title: 'Clean Data Export',
              desc: 'Download clean rows, invalid rows, and error reports separately or as a ZIP bundle.',
              color: '#ec4899',
            },
            {
              icon: <Database size={26} />,
              title: 'Upload History',
              desc: 'Track all past validations with timestamps, file sizes, and quality scores.',
              color: '#8b5cf6',
            },
            {
              icon: <CheckCircle2 size={26} />,
              title: 'Detailed Error Reports',
              desc: 'Row-by-row error breakdown with severity levels, filterable and downloadable.',
              color: '#06b6d4',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: '1.75rem',
                cursor: 'default',
                animation: `fadeIn 0.5s ease-out ${0.1 * i}s both`,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${feature.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: feature.color,
                marginBottom: '1rem',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.05rem', fontWeight: 700,
                marginBottom: '0.5rem',
              }}>
                {feature.title}
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.55,
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--bg-secondary)',
        padding: '4rem 1.5rem',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800,
              marginBottom: '0.75rem',
            }}>
              How It Works
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
            }}>
              Three simple steps to clean, validated data
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
          }}>
            {[
              {
                step: '01',
                title: 'Upload CSV',
                desc: 'Drag & drop or browse to upload your transaction CSV file.',
                icon: <Upload size={24} />,
              },
              {
                step: '02',
                title: 'Auto Validate',
                desc: 'Our engine runs 10+ validation rules across every row and column.',
                icon: <ShieldCheck size={24} />,
              },
              {
                step: '03',
                title: 'Get Results',
                desc: 'View dashboard with quality scores, download clean & error files.',
                icon: <BarChart3 size={24} />,
              },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                animation: `fadeIn 0.5s ease-out ${0.15 * i}s both`,
              }}>
                <div style={{
                  fontSize: '2.5rem', fontWeight: 900,
                  background: 'linear-gradient(135deg, var(--accent), #a55eea)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.75rem',
                }}>
                  {item.step}
                </div>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'var(--accent-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)',
                  margin: '0 auto 1rem',
                }}>
                  {item.icon}
                </div>
                <h3 style={{
                  fontSize: '1.1rem', fontWeight: 700,
                  marginBottom: '0.5rem',
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section style={{
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}>
        <div className="glass-card" style={{
          maxWidth: 700, margin: '0 auto',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, var(--glass-bg), rgba(99,102,241,0.05))',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
            fontWeight: 800,
            marginBottom: '0.75rem',
          }}>
            Ready to Validate Your Data?
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
            fontSize: '1rem',
          }}>
            Start uploading your CSV files and get instant quality insights.
          </p>
          <button
            id="cta-get-started-btn"
            className="btn-primary"
            onClick={() => handleAction('/upload')}
            style={{
              fontSize: '1.05rem', padding: '0.95rem 2.5rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            }}
          >
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
      }}>
        © {new Date().getFullYear()} Xeno Validator — Built for data accuracy
      </footer>
    </div>
  )
}
