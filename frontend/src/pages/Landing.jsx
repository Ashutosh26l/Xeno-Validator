import { Link } from 'react-router-dom'
import { ArrowRight, FileText, BarChart2, Download, CheckCircle } from 'lucide-react'

export default function Landing() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        padding: '4rem 1.5rem 3rem',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <div className="animate-fade-in">
          <p style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem',
          }}>
            CSV Validation Tool
          </p>

          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 750,
            lineHeight: 1.2,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
          }}>
            Validate your transaction data, find errors, export clean files.
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '2rem',
            maxWidth: 540,
          }}>
            Upload a CSV and get instant validation — bad dates, invalid phones,
            duplicate entries, missing fields. Download clean data and detailed
            error reports.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/upload"
              className="btn-primary"
              id="hero-upload-btn"
              style={{
                fontSize: '0.95rem', padding: '0.7rem 1.5rem',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              Upload CSV <ArrowRight size={16} />
            </Link>
            <Link
              to="/history"
              className="btn-secondary"
              id="hero-history-btn"
              style={{
                fontSize: '0.95rem', padding: '0.7rem 1.5rem',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              View past uploads
            </Link>
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '0 1.5rem' }} />

      {/* ── What it does ─────────────────────────────────────────── */}
      <section style={{
        padding: '3rem 1.5rem',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 650,
          marginBottom: '1.75rem',
          color: 'var(--text-primary)',
        }}>
          What it does
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {[
            {
              icon: <FileText size={20} />,
              title: 'Smart column detection',
              desc: 'Automatically maps your CSV headers to expected fields. Handles mismatched or extra columns.',
            },
            {
              icon: <CheckCircle size={20} />,
              title: 'Multi-rule validation',
              desc: 'Checks dates, phone numbers, amounts, duplicates, and missing values in a single pass.',
            },
            {
              icon: <BarChart2 size={20} />,
              title: 'Quality scoring',
              desc: 'Gives a quality score with breakdown by completeness, accuracy, and consistency.',
            },
            {
              icon: <Download size={20} />,
              title: 'Export clean data',
              desc: 'Download valid rows, invalid rows, and a detailed error report as separate CSV files or a ZIP.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: '1.25rem',
                animation: `fadeIn 0.3s ease-out ${0.05 * i}s both`,
              }}
            >
              <div style={{
                color: 'var(--accent)',
                marginBottom: '0.75rem',
              }}>
                {item.icon}
              </div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
                color: 'var(--text-primary)',
              }}>
                {item.title}
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.87rem',
                lineHeight: 1.5,
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section style={{
        background: 'var(--bg-secondary)',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 650,
            marginBottom: '1.5rem',
            color: 'var(--text-primary)',
          }}>
            How it works
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { num: '1', text: 'Upload your CSV file — drag and drop or click to browse.' },
              { num: '2', text: 'The system runs validation rules across every row and column.' },
              { num: '3', text: 'View your dashboard — quality scores, error breakdowns, download files.' },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
              }}>
                <span style={{
                  minWidth: 28, height: 28, borderRadius: 6,
                  background: 'var(--accent)',
                  color: '#fff', fontWeight: 650, fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {step.num}
                </span>
                <p style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  paddingTop: '0.15rem',
                }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.82rem',
      }}>
        Xeno Validator
      </footer>
    </div>
  )
}
