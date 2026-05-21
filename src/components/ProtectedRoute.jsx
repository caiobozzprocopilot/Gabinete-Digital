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
      <div className="screen-center">
        <p>Validando acesso...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/painel/login" state={{ from: location.pathname }} replace />
  }

  if (allowedRoles.length && !allowedRoles.includes(userProfile?.role)) {
    return (
      <div className="screen-center">
        <div className="card narrow">
          <h2>Acesso restrito</h2>
          <p>Seu usuário não possui permissão para acessar esta área.</p>
        </div>
      </div>
    )
  }

  return children
}
