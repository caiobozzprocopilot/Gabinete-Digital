import { STATUS_BADGE_CLASS, STATUS_LABELS } from '../constants/demandStatus'

export default function StatusBadge({ status }) {
  const className = STATUS_BADGE_CLASS[status] || 'badge badge-neutral'
  const label = STATUS_LABELS[status] || status

  return <span className={className}>{label}</span>
}
