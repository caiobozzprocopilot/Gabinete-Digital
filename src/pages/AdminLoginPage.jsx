import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getTenant } from '../services/tenantsService'
import { isTestMode } from '../utils/testMode'

function mapAuthError(error) {
  const code = error?.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'E-mail ou senha incorretos. Tente novamente.'
  }
  if (code.includes('invalid-email')) return 'E-mail inválido. Verifique o endereço digitado.'
  if (code.includes('user-disabled')) return 'Esta conta foi desativada. Contate o administrador.'
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (code.includes('network-request-failed')) return 'Falha de rede. Verifique sua conexão.'
  return 'Não foi possível entrar agora. Tente novamente.'
}

export default function AdminLoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState(null)
  const [notice, setNotice]       = useState(null)
  const [resetting, setResetting] = useState(false)
  const [tenantData, setTenantData] = useState(null)
  const navigate                  = useNavigate()
  const [searchParams]            = useSearchParams()

  const gabinete = searchParams.get('gabinete')
  const painelPath = gabinete ? `/painel?gabinete=${gabinete}` : '/painel'

  useEffect(() => {
    if (gabinete) {
      getTenant(gabinete).then(setTenantData).catch(() => {})
    }
  }, [gabinete])

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)
    try {
      if (isTestMode) {
        navigate(painelPath)
        return
      }
      await signInWithEmailAndPassword(auth, email, password)
      navigate(painelPath)
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword() {
    setError(null)
    setNotice(null)

    if (!email.trim()) {
      setError('Informe seu e-mail acima para receber o link de recuperação.')
      return
    }

    if (isTestMode) {
      setNotice('Modo teste: e-mail de recuperação simulado.')
      return
    }

    setResetting(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setNotice('Enviamos um link de recuperação para o seu e-mail.')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left panel: city photo ── */}
      <div
        className="hidden lg:flex w-1/2 relative flex-col justify-between p-10"
        style={{ backgroundImage: `url(${tenantData?.loginPhotoUrl || '/magnific_isometric-town-with-tall-_gJazdvHSXO.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* green top-to-bottom overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/55 via-brand-900/70 to-brand-950/90" />

        {/* brand badge */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-heading text-lg font-bold tracking-wide">Gabinete Digital</span>
        </div>

        {/* caption */}
        <div className="relative z-10">
          <p className="text-brand-100 text-sm font-medium mb-1">
            {tenantData ? `Município de ${tenantData.cityName}${tenantData.state ? `, ${tenantData.state}` : ''}` : 'Painel administrativo'}
          </p>
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

          <h1 className="text-2xl font-heading font-bold text-slate-900 mb-1">
            {tenantData?.vereadorName ? `Olá, ${tenantData.vereadorName}` : 'Bem-vindo de volta'}
          </h1>
          <p className="text-sm text-slate-500 mb-8">Acesse o painel administrativo</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {notice}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-brand-700 focus:outline-none pb-2 pl-6 text-slate-900 text-sm placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-brand-700 focus:outline-none pb-2 pl-6 pr-8 text-slate-900 text-sm placeholder:text-slate-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetting}
                className="text-xs text-slate-400 hover:text-brand-700 transition-colors disabled:opacity-60"
              >
                {resetting ? 'Enviando...' : 'Esqueceu a senha?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
