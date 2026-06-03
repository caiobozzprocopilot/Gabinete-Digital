import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function MasterRoute({ children }) {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <p className="text-slate-400 text-sm">Validando acesso...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/master/login" replace />

  if (userProfile?.role !== 'master') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-sm w-full text-center">
          <h2 className="font-heading text-lg font-bold text-white mb-2">Acesso restrito</h2>
          <p className="text-sm text-slate-400">Sua conta não possui permissão de acesso master.</p>
        </div>
      </div>
    )
  }

  return children
}
