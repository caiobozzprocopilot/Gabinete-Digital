import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { isTestMode } from '../utils/testMode'

export default function AdminLoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState(null)
  const navigate                  = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (isTestMode) {
        navigate('/painel')
        return
      }
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/painel')
    } catch (err) {
      setError('E-mail ou senha incorretos. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left panel: city photo ── */}
      <div
        className="hidden lg:flex w-1/2 relative flex-col justify-between p-10"
        style={{ backgroundImage: "url('/cidade login.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/80 via-brand-900/60 to-brand-800/70" />

        {/* brand badge */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-heading text-lg font-bold tracking-wide">Gabinete Digital</span>
        </div>

        {/* caption */}
        <div className="relative z-10">
          <p className="text-brand-100 text-sm font-medium mb-1">Municipio de Ortigueira, PR</p>
          <h2 className="text-white font-heading text-3xl font-bold leading-tight mb-3">
            Gestao inteligente<br />do mandato
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Acompanhe demandas, gerencie atendimentos e impacte positivamente a sua comunidade.
          </p>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">

          {/* mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-700">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-base font-bold text-brand-900">Gabinete Digital</span>
          </div>

          <h1 className="text-2xl font-heading font-bold text-slate-900 mb-1">Bem-vindo de volta</h1>
          <p className="text-sm text-slate-500 mb-8">Acesse o painel administrativo</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-brand-700 focus:outline-none pb-2 text-slate-900 text-sm placeholder:text-slate-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-brand-700 focus:outline-none pb-2 text-slate-900 text-sm placeholder:text-slate-400 transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-[14px] bg-[#1b2d5b] hover:bg-[#243974] active:scale-[0.98] text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
