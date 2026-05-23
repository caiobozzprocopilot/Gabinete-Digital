const STATUS_CONFIG = {
  'Nova':        'bg-blue-50 text-blue-700 border-blue-200',
  'Em análise':  'bg-amber-50 text-amber-700 border-amber-200',
  'Encaminhada': 'bg-slate-100 text-slate-600 border-slate-200',
  'Resolvida':   'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Arquivada':   'bg-gray-50 text-gray-500 border-gray-200',
}

export default function StatusBadge({ status }) {
  const classes = STATUS_CONFIG[status] || 'bg-slate-50 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {status}
    </span>
  )
}
