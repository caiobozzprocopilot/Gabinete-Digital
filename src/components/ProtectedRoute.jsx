import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { isTestMode } from '../utils/testMode'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  if (isTestMode) {
    return children
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-400 text-sm">Validando acesso...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/painel/login" state={{ from: location.pathname }} replace />
  }

  if (allowedRoles.length && !allowedRoles.includes(userProfile?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center">
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-2">Acesso restrito</h2>
          <p className="text-sm text-slate-500">Seu usuario nao possui permissao para acessar esta area.</p>
        </div>
      </div>
    )
  }

  return children
}
