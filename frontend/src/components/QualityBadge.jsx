import { Star, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default function QualityBadge({ score }) {
  let grade = 'F'
  let color = 'var(--error)'
  let Icon = XCircle

  if (score >= 90) { grade = 'A'; color = 'var(--success)'; Icon = Star }
  else if (score >= 75) { grade = 'B'; color = 'var(--info)'; Icon = CheckCircle }
  else if (score >= 60) { grade = 'C'; color = 'var(--warning)'; Icon = AlertTriangle }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.35rem 0.8rem',
      borderRadius: 999,
      background: `${color}15`,
      color: color,
      fontWeight: 700,
      fontSize: '0.85rem'
    }}>
      <Icon size={14} /> Grade {grade} ({score}%)
    </div>
  )
}
