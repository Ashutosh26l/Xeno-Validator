export default function SummaryCard({ label, value, icon: Icon, color = 'var(--accent)' }) {
  return (
    <div className="glass-card animate-fade-in" style={{
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flex: '1 1 200px',
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: 12,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: color
      }}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>
          {value}
        </div>
      </div>
    </div>
  )
}
