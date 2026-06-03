import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2, Copy, Check, ExternalLink, LogOut,
  Plus, RefreshCw, ShieldCheck, Users,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { listAllTenants } from '../services/tenantsService'

const BASE_URL = 'https://gabinete-digital-vereador.web.app'

function TenantCard({ tenant }) {
  const [copiedKey, setCopiedKey] = useState('')

  const slug = tenant.id
  const links = {
    landing: `${BASE_URL}/vereador/${slug}`,
    form:    `${BASE_URL}/atendimento/${slug}`,
    login:   `${BASE_URL}/painel/login?gabinete=${slug}`,
  }

  function copyLink(key, url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo strip */}
      <div
        className="h-24 bg-slate-100 relative"
        style={
          tenant.heroPhotoUrl
            ? { backgroundImage: `url(${tenant.heroPhotoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <p className="text-white font-heading font-semibold text-sm leading-tight">
              {tenant.vereadorName || '—'}
            </p>
            <p className="text-white/70 text-xs">
              {tenant.cityName || slug}{tenant.state ? `, ${tenant.state}` : ''}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-black/40 text-white/80 text-[10px] font-mono">
            {slug}
          </span>
        </div>
      </div>

      {/* Links */}
      <div className="p-4 space-y-2">
        {[
          { key: 'landing', label: 'Página pública', path: `/vereador/${slug}` },
          { key: 'form',    label: 'Formulário',     path: `/atendimento/${slug}` },
          { key: 'login',   label: 'Login painel',   path: `/painel/login?gabinete=${slug}` },
        ].map(({ key, label, path }) => (
          <div key={key} className="flex items-center gap-2">
            <Link
              to={path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-600 hover:text-slate-900"
            >
              <ExternalLink size={12} className="flex-none text-slate-400" />
              {label}
            </Link>
            <button
              onClick={() => copyLink(key, links[key])}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Copiar link"
            >
              {copiedKey === key
                ? <Check size={13} className="text-emerald-500" />
                : <Copy size={13} />}
            </button>
          </div>
        ))}

        {/* Dashboard direct link (opens in new tab since it requires tenant auth) */}
        <div className="pt-1 border-t border-slate-100">
          <a
            href={`${BASE_URL}/painel/login?gabinete=${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
          >
            <Building2 size={13} />
            Abrir painel do gabinete
          </a>
        </div>
      </div>
    </div>
  )
}

export default function MasterDashboardPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function loadTenants() {
    setLoading(true)
    setError('')
    listAllTenants()
      .then(setTenants)
      .catch((err) => setError(err?.message || 'Erro ao carregar gabinetes.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadTenants, [])

  async function handleLogout() {
    try {
      await signOut(auth)
    } finally {
      navigate('/master/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-950 border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-white font-heading font-bold text-base">Painel Master</span>
              <span className="text-slate-500 text-xs ml-2">Gabinete Digital</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTenants}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 text-xs transition-colors"
            >
              <RefreshCw size={13} />
              Atualizar
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 text-xs transition-colors"
            >
              <LogOut size={13} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats + actions row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Users size={16} className="text-brand-600" />
              <span className="text-sm font-semibold text-slate-700">
                {loading ? '—' : tenants.length} gabinete{tenants.length !== 1 ? 's' : ''} cadastrado{tenants.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/cadastro"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={15} />
              Novo gabinete
            </Link>
          </div>
        </div>

        {/* Navigation cards (system pages) */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Páginas do sistema</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cadastro de gabinete', path: '/cadastro', color: 'bg-violet-50 border-violet-200 text-violet-700' },
              { label: 'Página inicial (demo)', path: '/vereador/corbelia', color: 'bg-slate-50 border-slate-200 text-slate-600' },
              { label: 'Formulário (demo)', path: '/atendimento/corbelia', color: 'bg-slate-50 border-slate-200 text-slate-600' },
              { label: 'Login do painel (demo)', path: '/painel/login?gabinete=corbelia', color: 'bg-slate-50 border-slate-200 text-slate-600' },
            ].map(({ label, path, color }) => (
              <Link
                key={path}
                to={path}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80 ${color}`}
              >
                <ExternalLink size={13} className="flex-none opacity-60" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tenants grid */}
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Gabinetes cadastrados</h2>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-slate-400 text-sm">Carregando...</div>
            </div>
          )}

          {error && !loading && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && tenants.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm">Nenhum gabinete cadastrado ainda.</p>
              <Link to="/cadastro" className="mt-3 text-brand-600 hover:text-brand-700 text-sm font-semibold transition-colors">
                Criar o primeiro →
              </Link>
            </div>
          )}

          {!loading && tenants.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
