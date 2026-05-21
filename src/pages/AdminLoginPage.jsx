import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { isTestMode } from '../utils/testMode'

export default function AdminLoginPage() {
  const { user, login, loading, firebaseReady } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from || '/painel'

  if (loading) {
    return (
      <div className="screen-center">
        <p>Carregando sessão...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (isTestMode) {
      navigate('/painel', { replace: true })
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      {/* Left photo panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon"><Building2 size={28} /></div>
          <div className="login-brand-name">
            Gabinete Digital<br />Ortigueira
          </div>
        </div>

        <div className="login-photo-caption">
          <h2>Câmara Municipal<br />de Ortigueira</h2>
          <p>Casa do Povo — gestão de demandas com transparência e agilidade.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-right">
        <div className="login-form-container">
          <h1>Login</h1>
          <p className="login-subtitle">
            Acesso exclusivo para o vereador e sua assessoria.
          </p>

          {!firebaseReady && !isTestMode ? (
            <p className="feedback error">
              Firebase não configurado. Ajuste o arquivo .env.local antes de usar o
              login.
            </p>
          ) : null}

          {isTestMode ? (
            <p className="feedback info">
              Modo teste ativo: você pode entrar sem autenticação real.
            </p>
          ) : null}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required={!isTestMode}
              />
            </div>

            <div className="input-group">
              <div className="login-password-row">
                <label htmlFor="password">Senha</label>
                <a className="login-forgot" href="#">Esqueceu a senha?</a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={!isTestMode}
              />
            </div>

            {error ? <p className="feedback error">{error}</p> : null}

            <button
              className="primary-button full"
              disabled={submitting || (!firebaseReady && !isTestMode)}
            >
              {submitting ? 'Entrando...' : 'Entrar no painel'}
            </button>
          </form>

          <p className="login-back-link">
            <Link className="ghost-link" to="/">
              ← Voltar para o formulário público
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
