import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY || ''

export default function MasterLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (password === MASTER_KEY) {
      sessionStorage.setItem('master_auth', '1')
      navigate('/master')
    } else {
      setError('Senha incorreta.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4 shadow-lg shadow-brand-900/40">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white font-heading text-2xl font-bold mb-1">Acesso Master</h1>
          <p className="text-slate-400 text-sm">Painel exclusivo do administrador do sistema</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Senha de acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold transition-all"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
