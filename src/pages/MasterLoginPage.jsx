import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function mapAuthError(error) {
  const code = error?.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'E-mail ou senha incorretos.'
  }
  if (code.includes('invalid-email')) return 'E-mail inválido.'
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (code.includes('network-request-failed')) return 'Falha de rede. Verifique sua conexão.'
  return 'Não foi possível entrar agora. Tente novamente.'
}

export default function MasterLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      const snap = await getDoc(doc(db, 'adminUsers', cred.user.uid))

      if (!snap.exists() || snap.data().role !== 'master') {
        await signOut(auth)
        setError('Esta conta não tem permissão de acesso master.')
        return
      }

      navigate('/master')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
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
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="master@email.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-10 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-400 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
