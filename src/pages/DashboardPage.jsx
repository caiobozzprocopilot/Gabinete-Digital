import { useEffect, useMemo, useState } from 'react'
import {
  BarChart2, Bell, Building2, Calendar, CalendarCheck,
  Check, CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Copy, LogOut, Mail, MessageSquare, Settings, Upload, Zap,
} from 'lucide-react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { DEMAND_STATUS } from '../constants/demandStatus'
import { firebaseReady, storage } from '../firebase/config'
import { useAuth } from '../context/useAuth'
import { subscribeDemands, updateDemandStatus } from '../services/demandsService'
import { getTenant, updateTenant } from '../services/tenantsService'
import { isTestMode } from '../utils/testMode'
import { exportBatchDemandPdf, exportSingleDemandPdf } from '../utils/pdfUtils'
import StatusBadge from '../components/StatusBadge'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'

const PAGE_SIZE = 8
const STATUS_PIE_COLORS = ['#2563eb', '#f59e0b', '#8b5cf6', '#16a34a', '#94a3b8']

async function uploadTenantPhoto(slug, slot, file) {
  if (!file || !storage) return ''
  const photoRef = storageRef(storage, `tenant-photos/${slug}/${slot}`)
  await uploadBytes(photoRef, file)
  return getDownloadURL(photoRef)
}

function formatDate(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function parseStartDate(value) {
  if (!value) return null
  return new Date(`${value}T00:00:00`)
}

function parseEndDate(value) {
  if (!value) return null
  return new Date(`${value}T23:59:59`)
}

const MOCK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

function buildMockDemands() {
  const now = new Date()
  return [
    {
      id: 'TST-1001', voterName: 'Ana Souza', voterPhone: '(42) 99911-2233',
      voterAddress: 'Rua das Araucarias, 120 - Centro',
      description: 'Solicitação de troca de lâmpada em poste com falha há mais de 10 dias.',
      status: 'Nova', createdAt: new Date(now.getTime() - 1000 * 60 * 35),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 20),
      attachments: [{ name: 'poste.png', type: 'image/png', base64: MOCK_IMAGE }],
    },
    {
      id: 'TST-1002', voterName: 'Carlos Pereira', voterPhone: '(42) 99877-1020',
      voterAddress: 'Av. Principal, 450 - Bairro Jardim Alegre',
      description: 'Pedido de cascalhamento em trecho com barro e dificil acesso para transporte escolar.',
      status: 'Em análise', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60), attachments: [],
    },
    {
      id: 'TST-1003', voterName: 'Marcia Lima', voterPhone: '(42) 99905-8771',
      voterAddress: 'Comunidade Lagoa Branca, s/n - Zona Rural',
      description: 'Demanda para manutenção de ponto de ônibus sem cobertura.',
      status: 'Encaminhada', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 10),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 7),
      attachments: [{ name: 'ponto.jpg', type: 'image/jpeg', base64: MOCK_IMAGE }],
    },
    {
      id: 'TST-1004', voterName: 'Ronaldo Vieira', voterPhone: '(42) 99711-6672',
      voterAddress: 'Rua do Campo, 88 - Vila Nova',
      description: 'Acompanhamento de solicitação já atendida na semana anterior.',
      status: 'Resolvida', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 28),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 9), attachments: [],
    },
    {
      id: 'TST-1005', voterName: 'Patricia Gomes', voterPhone: '(42) 99801-4588',
      voterAddress: 'Rua das Flores, 312 - Jardim Planalto',
      description: 'Pedido de avaliação para limpeza de área com acúmulo de entulho.',
      status: 'Arquivada', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 52),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 30), attachments: [],
    },
  ]
}

export default function DashboardPage() {
  const { user, userProfile, logout } = useAuth()

  const [demands, setDemands] = useState(() => (isTestMode ? buildMockDemands() : []))
  const [tenantData, setTenantData] = useState(null)
  const [loading, setLoading] = useState(!isTestMode && firebaseReady)
  const [error, setError] = useState(() => {
    if (isTestMode) return ''
    return firebaseReady ? '' : 'Firebase nao configurado. Ajuste o arquivo .env.local para carregar o painel.'
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [busyDemandId, setBusyDemandId] = useState('')
  const [activeDemandId, setActiveDemandId] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [filters, setFilters] = useState({ search: '', status: '', startDate: '', endDate: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedKey, setCopiedKey] = useState('')
  const [view, setView] = useState('demands')
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() } })
  const [calSelectedDay, setCalSelectedDay] = useState(null)
  const [settingsForm, setSettingsForm] = useState({ vereadorName: '', cityName: '', state: '' })
  const [settingsPhotos, setSettingsPhotos] = useState({ hero: null, form: null, login: null })
  const [settingsPreviews, setSettingsPreviews] = useState({ hero: null, form: null, login: null })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    if (!tenantData) return
    setSettingsForm({
      vereadorName: tenantData.vereadorName || '',
      cityName: tenantData.cityName || '',
      state: tenantData.state || '',
    })
    setSettingsPreviews({
      hero: tenantData.heroPhotoUrl || null,
      form: tenantData.formPhotoUrl || null,
      login: tenantData.loginPhotoUrl || null,
    })
  }, [tenantData])

  function handleSettingsPhotoChange(slot, event) {
    const file = event.target.files?.[0]
    if (!file) return
    setSettingsPhotos((prev) => ({ ...prev, [slot]: file }))
    setSettingsPreviews((prev) => ({ ...prev, [slot]: URL.createObjectURL(file) }))
  }

  async function handleSettingsSave() {
    const slug = userProfile?.tenantSlug
    if (!slug) return
    setSettingsSaving(true)
    setSettingsError('')
    setSettingsSaved(false)
    try {
      const [heroPhotoUrl, formPhotoUrl, loginPhotoUrl] = await Promise.all([
        settingsPhotos.hero  ? uploadTenantPhoto(slug, 'hero',  settingsPhotos.hero)  : Promise.resolve(tenantData?.heroPhotoUrl  || ''),
        settingsPhotos.form  ? uploadTenantPhoto(slug, 'form',  settingsPhotos.form)  : Promise.resolve(tenantData?.formPhotoUrl  || ''),
        settingsPhotos.login ? uploadTenantPhoto(slug, 'login', settingsPhotos.login) : Promise.resolve(tenantData?.loginPhotoUrl || ''),
      ])
      const baseUrl = 'https://gabinete-digital-vereador.web.app'
      await updateTenant(slug, {
        vereadorName: settingsForm.vereadorName,
        cityName: settingsForm.cityName,
        state: settingsForm.state,
        heroPhotoUrl,
        formPhotoUrl,
        loginPhotoUrl,
        links: {
          form:    `${baseUrl}/atendimento/${slug}`,
          landing: `${baseUrl}/vereador/${slug}`,
          login:   `${baseUrl}/painel/login?gabinete=${slug}`,
        },
      })
      setTenantData((prev) => ({ ...prev, ...settingsForm, heroPhotoUrl, formPhotoUrl, loginPhotoUrl }))
      setSettingsPhotos({ hero: null, form: null, login: null })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch (err) {
      setSettingsError(err?.message || 'Erro ao salvar configurações.')
    } finally {
      setSettingsSaving(false)
    }
  }

  function copyLink(key, url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 2000)
    })
  }

  useEffect(() => {
    if (isTestMode || !firebaseReady) return undefined
    const tenantSlug = userProfile?.tenantSlug
    if (!tenantSlug) {
      setError('Conta sem gabinete associado. Adicione o campo "tenantSlug" no documento adminUsers do Firebase.')
      setLoading(false)
      return undefined
    }
    getTenant(tenantSlug).then(setTenantData).catch(() => {})
    const unsubscribe = subscribeDemands(
      tenantSlug,
      (items) => { setDemands(items); setError(''); setLoading(false) },
      (nextError) => { setError(nextError?.message || 'Falha ao carregar demandas do painel.'); setLoading(false) },
    )
    return unsubscribe
  }, [userProfile?.tenantSlug])

  const filteredDemands = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase()
    const startDate = parseStartDate(filters.startDate)
    const endDate = parseEndDate(filters.endDate)
    return demands.filter((demand) => {
      if (filters.status && demand.status !== filters.status) return false
      const createdAt = demand.createdAt ? new Date(demand.createdAt) : null
      if (startDate && (!createdAt || createdAt < startDate)) return false
      if (endDate && (!createdAt || createdAt > endDate)) return false
      if (!normalizedSearch) return true
      const haystack = [demand.id, demand.voterName, demand.voterPhone, demand.voterAddress, demand.description]
        .filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [demands, filters])

  const totalPages = Math.max(1, Math.ceil(filteredDemands.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const pageDemands = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredDemands.slice(start, start + PAGE_SIZE)
  }, [safeCurrentPage, filteredDemands])

  const activeDemand = useMemo(() => {
    if (!activeDemandId) return pageDemands[0] || null
    return demands.find((item) => item.id === activeDemandId) || null
  }, [activeDemandId, demands, pageDemands])

  const allPageSelected = pageDemands.length > 0 && pageDemands.every((demand) => selectedIds.includes(demand.id))

  const summary = useMemo(() => {
    const today = new Date().toDateString()
    const total = demands.length
    const active = demands.filter((demand) => !['Resolvida', 'Arquivada'].includes(demand.status)).length
    const resolved = demands.filter((demand) => demand.status === 'Resolvida').length
    const createdToday = demands.filter((demand) => demand.createdAt && new Date(demand.createdAt).toDateString() === today).length
    return { total, active, resolved, createdToday }
  }, [demands])

  const reportStatusData = useMemo(() =>
    DEMAND_STATUS.map((s) => ({ name: s, value: demands.filter((d) => d.status === s).length }))
  , [demands])

  const reportDailyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      const count = demands.filter((item) => {
        if (!item.createdAt) return false
        const c = new Date(item.createdAt)
        return c.getDate() === d.getDate() && c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear()
      }).length
      return { name: `${d.getDate()}/${d.getMonth() + 1}`, count }
    })
  }, [demands])

  const calendarDemandsMap = useMemo(() => {
    const map = {}
    demands.forEach((d) => {
      if (!d.createdAt) return
      const date = new Date(d.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(d)
    })
    return map
  }, [demands])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
    setCurrentPage(1)
  }

  function toggleDemandSelection(demandId) {
    setSelectedIds((current) => current.includes(demandId) ? current.filter((id) => id !== demandId) : [...current, demandId])
  }

  function togglePageSelection() {
    const pageIds = pageDemands.map((demand) => demand.id)
    setSelectedIds((current) => {
      const currentSet = new Set(current)
      if (allPageSelected) { pageIds.forEach((id) => currentSet.delete(id)) }
      else { pageIds.forEach((id) => currentSet.add(id)) }
      return Array.from(currentSet)
    })
  }

  async function handleStatusChange(demand, nextStatus) {
    if (!nextStatus || demand.status === nextStatus) return
    if (isTestMode) {
      setDemands((current) => current.map((item) => item.id === demand.id ? { ...item, status: nextStatus, updatedAt: new Date() } : item))
      setStatusMessage(`Modo teste: status da demanda ${demand.id} alterado para ${nextStatus}.`)
      return
    }
    setBusyDemandId(demand.id)
    setStatusMessage('')
    try {
      const operatorName = userProfile?.displayName || user?.email || 'operador'
      await updateDemandStatus({ demandId: demand.id, status: nextStatus, changedBy: operatorName })
      setStatusMessage(`Status da demanda ${demand.id} atualizado para ${nextStatus}.`)
    } catch (nextError) {
      setStatusMessage(nextError?.message || 'Nao foi possivel atualizar o status agora.')
    } finally {
      setBusyDemandId('')
    }
  }

  function handleBatchPdf() {
    const selectedDemands = demands.filter((demand) => selectedIds.includes(demand.id))
    if (!selectedDemands.length) { setStatusMessage('Selecione ao menos uma demanda para gerar o PDF em lote.'); return }
    exportBatchDemandPdf(selectedDemands)
  }

  function clearFilters() {
    setFilters({ search: '', status: '', startDate: '', endDate: '' })
    setCurrentPage(1)
  }

  const activeUserName = userProfile?.displayName || user?.email || (isTestMode ? 'Demo Assessor' : '-')
  const activeRole = userProfile?.role || (isTestMode ? 'admin' : 'operator')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-400 text-sm">Carregando demandas...</p>
      </div>
    )
  }

  const statCards = [
    { icon: ClipboardList, label: 'Total de demandas', value: summary.total, trend: 'todas as demandas' },
    { icon: Zap, label: 'Ativas', value: summary.active, trend: 'em andamento' },
    { icon: CheckCircle, label: 'Resolvidas', value: summary.resolved, trend: 'concluidas' },
    { icon: CalendarCheck, label: 'Hoje', value: summary.createdToday, trend: 'recebidas hoje' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-16 flex flex-col bg-brand-900 z-40">
        <div className="flex items-center justify-center h-14 text-white">
          <Building2 size={22} />
        </div>
        <nav className="flex flex-col items-center gap-1 flex-1 py-2">
          {[
            { id: 'demands',  icon: ClipboardList, title: 'Demandas' },
            { id: 'reports',  icon: BarChart2,     title: 'Relatórios' },
            { id: 'calendar', icon: Calendar,      title: 'Calendário' },
          ].map(({ id, icon: Icon, title }) => (
            <button key={id}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${view === id ? 'text-white bg-white/20' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              type="button" title={title} onClick={() => setView(id)}>
              <Icon size={20} />
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-1 pb-4">
          <button
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${view === 'settings' ? 'text-white bg-white/20' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            type="button" title="Configurações" onClick={() => setView('settings')}>
            <Settings size={20} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all" type="button" title="Sair" onClick={logout}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-16 flex flex-col flex-1">

        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 shadow-sm">
          <div>
            <strong className="block text-sm font-semibold text-slate-900">Bom dia, {activeUserName.split(' ')[0]}</strong>
            <span className="text-xs text-slate-400">
              {tenantData?.cityName ? `Gabinete de ${tenantData.cityName}` : 'Painel de demandas'} &middot; {activeRole}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${view === 'notifications' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
              type="button" title="Notificações" onClick={() => setView('notifications')}>
              <Bell size={18} />
              {demands.filter((d) => d.status === 'Nova').length > 0 && view !== 'notifications' && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            <button
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${view === 'messages' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
              type="button" title="Mensagens" onClick={() => setView('messages')}>
              <Mail size={18} />
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-700 text-white text-xs font-bold">
              {activeUserName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 p-5 space-y-5">

          {isTestMode && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
              Modo teste ativo: o painel usa dados simulados para facilitar navegação e revisão visual.
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map(({ icon: Icon, label, value, trend }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50">
                    <Icon size={14} className="text-brand-700" />
                  </div>
                  {label}
                </div>
                <div className="text-3xl font-heading font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-400 mt-1">{trend}</div>
              </div>
            ))}
          </div>

          {view === 'demands' && (<>

          {/* Links públicos */}
          {!isTestMode && userProfile?.tenantSlug && (() => {
            const slug = userProfile.tenantSlug
            const base = 'https://gabinete-digital-vereador.web.app'
            const links = [
              { key: 'form',    label: 'Formulário de demandas', url: `${base}/atendimento/${slug}` },
              { key: 'landing', label: 'Página do gabinete',     url: `${base}/vereador/${slug}` },
            ]
            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-500 mb-3">Seus links públicos — compartilhe com eleitores</p>
                <div className="space-y-2">
                  {links.map(({ key, label, url }) => (
                    <div key={key} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
                        <p className="text-xs text-slate-700 font-mono truncate">{url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyLink(key, url)}
                        className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={copiedKey === key
                          ? { backgroundColor: '#d1fae5', color: '#065f46' }
                          : { backgroundColor: '#f1f5f9', color: '#475569' }}
                      >
                        {copiedKey === key
                          ? <><Check size={12} /> Copiado!</>
                          : <><Copy size={12} /> Copiar</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Content grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">

            {/* Demands card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-heading text-base font-semibold text-slate-900">Demandas dos eleitores</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" type="button" onClick={togglePageSelection}>
                    {allPageSelected ? 'Desmarcar' : 'Selecionar pag.'}
                  </button>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-700 hover:bg-brand-800 text-white transition-colors" type="button" onClick={handleBatchPdf}>
                    PDF em lote ({selectedIds.length})
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                    <label className="text-xs font-medium text-slate-500" htmlFor="search">Buscar</label>
                    <input id="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)}
                      placeholder="Nome, telefone, protocolo..."
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500" htmlFor="status">Status</label>
                    <select id="status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600 transition-colors">
                      <option value="">Todos</option>
                      {DEMAND_STATUS.map((status) => (<option key={status} value={status}>{status}</option>))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500" htmlFor="startDate">De</label>
                    <input id="startDate" type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500" htmlFor="endDate">Até</label>
                    <input id="endDate" type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600 transition-colors" />
                  </div>
                  <button className="self-end px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" type="button" onClick={clearFilters}>
                    Limpar
                  </button>
                </div>

                {error ? <p className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-700 border border-red-200">{error}</p> : null}
                {statusMessage ? <p className="text-xs px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">{statusMessage}</p> : null}

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Sel.</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Data</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Nome</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Telefone</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Status</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pageDemands.map((demand) => (
                        <tr key={demand.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <input type="checkbox" checked={selectedIds.includes(demand.id)} onChange={() => toggleDemandSelection(demand.id)}
                              aria-label={`Selecionar demanda ${demand.id}`} className="w-3.5 h-3.5 rounded border-slate-300 accent-brand-700" />
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(demand.createdAt)}</td>
                          <td className="px-3 py-2.5">
                            <button className="text-brand-700 hover:text-brand-900 font-medium hover:underline transition-colors" type="button" onClick={() => setActiveDemandId(demand.id)}>
                              {demand.voterName}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{demand.voterPhone}</td>
                          <td className="px-3 py-2.5">
                            <select value={demand.status || 'Nova'} onChange={(event) => handleStatusChange(demand, event.target.value)}
                              disabled={busyDemandId === demand.id}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-brand-600 disabled:opacity-50 transition-colors">
                              {DEMAND_STATUS.map((status) => (<option key={status} value={status}>{status}</option>))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors" type="button" onClick={() => exportSingleDemandPdf(demand)}>
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!pageDemands.length ? (
                  <p className="text-center py-6 text-sm text-slate-400">Nenhuma demanda encontrada para os filtros atuais.</p>
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors" type="button"
                    disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>
                    &larr; Anterior
                  </button>
                  <span className="text-xs text-slate-500">Página {safeCurrentPage} de {totalPages}</span>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors" type="button"
                    disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>
                    Próxima &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Status distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-heading text-sm font-semibold text-slate-900 mb-4">Distribuição por status</h3>
                <ul className="space-y-2.5">
                  {DEMAND_STATUS.map((status) => {
                    const count = demands.filter((d) => d.status === status).length
                    const pct = demands.length ? Math.round((count / demands.length) * 100) : 0
                    return (
                      <li key={status} className="flex items-center gap-2">
                        <span className="w-20 text-xs text-slate-600 flex-none">{status}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-xs text-slate-500 flex-none">{pct}%</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Detail panel */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-heading text-sm font-semibold text-slate-900">Detalhes</h3>
                  {activeDemand && <StatusBadge status={activeDemand.status} />}
                </div>
                <div className="p-5">
                  {activeDemand ? (
                    <>
                      <dl className="space-y-2 mb-4">
                        {[
                          { label: 'Protocolo', value: activeDemand.id },
                          { label: 'Data', value: formatDate(activeDemand.createdAt) },
                          { label: 'Nome', value: activeDemand.voterName },
                          { label: 'Telefone', value: activeDemand.voterPhone },
                          { label: 'Endereço', value: activeDemand.voterAddress },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-2">
                            <dt className="text-xs font-semibold text-slate-400 w-20 flex-none">{label}</dt>
                            <dd className="text-xs text-slate-700 break-all">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Descrição</h4>
                      <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed mb-4">{activeDemand.description}</p>
                      <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Anexos</h4>
                      {activeDemand.attachments?.length ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          {activeDemand.attachments.map((image, index) => (
                            <img key={index} src={image.base64} alt={`Anexo ${index + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Sem anexos.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Clique em um nome na tabela para ver os detalhes.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          </>)}

          {/* View: Relatórios */}
          {view === 'reports' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* Status distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-heading text-sm font-semibold text-slate-900 mb-4">Distribuição por status</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={reportStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => percent > 0.04 ? `${Math.round(percent * 100)}%` : ''}
                        labelLine={false}>
                        {reportStatusData.map((_, i) => (
                          <Cell key={i} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} demanda(s)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Daily volume */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-heading text-sm font-semibold text-slate-900 mb-4">Volume — últimos 30 dias</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={reportDailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={4} />
                      <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                      <Tooltip formatter={(value) => [`${value} demanda(s)`]} />
                      <Bar dataKey="count" name="Demandas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-heading text-sm font-semibold text-slate-900 mb-4">Resumo por status</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-3 text-slate-500 font-semibold">Status</th>
                        <th className="text-right py-2 px-3 text-slate-500 font-semibold">Qtd.</th>
                        <th className="text-right py-2 px-3 text-slate-500 font-semibold">%</th>
                        <th className="text-left py-2 px-3 text-slate-500 font-semibold">Barra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {DEMAND_STATUS.map((status, i) => {
                        const count = demands.filter((d) => d.status === status).length
                        const pct = demands.length ? Math.round((count / demands.length) * 100) : 0
                        return (
                          <tr key={status}>
                            <td className="py-2.5 px-3 font-medium text-slate-700">{status}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{count}</td>
                            <td className="py-2.5 px-3 text-right text-slate-500">{pct}%</td>
                            <td className="py-2.5 px-3">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-32">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_PIE_COLORS[i] }} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* View: Calendário */}
          {view === 'calendar' && (() => {
            const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay()
            const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate()
            const today = new Date()
            const isCurrentMonth = today.getFullYear() === calMonth.year && today.getMonth() === calMonth.month
            const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
            const monthLabel = `${monthNames[calMonth.month]} ${calMonth.year}`
            const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
            const selectedDayDemands = calSelectedDay
              ? (calendarDemandsMap[`${calMonth.year}-${calMonth.month}-${calSelectedDay}`] || [])
              : []
            return (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <button type="button"
                      onClick={() => { setCalMonth((prev) => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 }); setCalSelectedDay(null) }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <h3 className="font-heading text-sm font-semibold text-slate-900">{monthLabel}</h3>
                    <button type="button"
                      onClick={() => { setCalMonth((prev) => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 }); setCalSelectedDay(null) }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} />
                      const key = `${calMonth.year}-${calMonth.month}-${day}`
                      const dayDemands = calendarDemandsMap[key] || []
                      const isToday = isCurrentMonth && day === today.getDate()
                      const isSelected = calSelectedDay === day
                      return (
                        <button key={day} type="button"
                          onClick={() => setCalSelectedDay(isSelected ? null : day)}
                          className={`flex flex-col items-center justify-center rounded-xl py-2 min-h-[44px] text-xs font-medium transition-colors ${
                            isSelected ? 'bg-brand-700 text-white' :
                            isToday ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-400' :
                            dayDemands.length ? 'hover:bg-slate-100 text-slate-900' :
                            'hover:bg-slate-50 text-slate-400'
                          }`}>
                          <span>{day}</span>
                          {dayDemands.length > 0 && (
                            <span className={`text-[9px] font-bold ${isSelected ? 'text-white/80' : 'text-brand-600'}`}>
                              {dayDemands.length}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {calSelectedDay && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-heading text-sm font-semibold text-slate-900 mb-3">
                      {calSelectedDay} de {monthNames[calMonth.month]} — {selectedDayDemands.length} demanda(s)
                    </h3>
                    {selectedDayDemands.length ? (
                      <div className="space-y-2">
                        {selectedDayDemands.map((d) => (
                          <div key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900">{d.voterName}</p>
                              <p className="text-xs text-slate-500 truncate">{d.description}</p>
                            </div>
                            <StatusBadge status={d.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Nenhuma demanda neste dia.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* View: Notificações */}
          {view === 'notifications' && (() => {
            const todayStr = new Date().toDateString()
            const newDemands = demands.filter((d) => d.status === 'Nova')
            const todayDemands = demands.filter((d) => d.createdAt && new Date(d.createdAt).toDateString() === todayStr)
            return (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-heading text-sm font-semibold text-slate-900 mb-4">
                    Novas demandas — aguardando atenção ({newDemands.length})
                  </h3>
                  {newDemands.length ? (
                    <div className="space-y-2">
                      {newDemands.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-slate-900">{d.voterName}</p>
                              <span className="text-xs text-slate-400">{d.voterPhone}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{d.description}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(d.createdAt)}</p>
                          </div>
                          <StatusBadge status={d.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhuma demanda nova no momento. Tudo em dia!</p>
                  )}
                </div>
                {todayDemands.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-heading text-sm font-semibold text-slate-900 mb-4">
                      Recebidas hoje ({todayDemands.length})
                    </h3>
                    <div className="space-y-2">
                      {todayDemands.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-slate-900">{d.voterName}</p>
                              <span className="text-xs text-slate-400">{d.voterPhone}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{d.description}</p>
                          </div>
                          <StatusBadge status={d.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* View: Configurações */}
          {view === 'settings' && (
            <div className="max-w-2xl space-y-5">
              {/* Dados do gabinete */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-heading text-base font-semibold text-slate-900 mb-4">Dados do gabinete</h3>
                <div className="space-y-3">
                  {[{ id: 'vereadorName', label: 'Nome do vereador', placeholder: 'Nome completo' },
                    { id: 'cityName', label: 'Município', placeholder: 'Nome da cidade' },
                    { id: 'state', label: 'Estado', placeholder: 'PR' },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id}>
                      <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`st-${id}`}>{label}</label>
                      <input
                        id={`st-${id}`}
                        value={settingsForm[id]}
                        onChange={(e) => setSettingsForm((prev) => ({ ...prev, [id]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fotos */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-heading text-base font-semibold text-slate-900 mb-1">Fotos do sistema</h3>
                <p className="text-xs text-slate-400 mb-4">Clique em uma foto para trocar. Máx. 10 MB, formato de imagem.</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{ slot: 'hero', label: 'Capa da página pública' },
                    { slot: 'form', label: 'Foto do formulário' },
                    { slot: 'login', label: 'Foto do login' },
                  ].map(({ slot, label }) => (
                    <div key={slot} className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-slate-500 text-center leading-tight">{label}</span>
                      <input
                        type="file" accept="image/*"
                        id={`st-photo-${slot}`}
                        className="sr-only"
                        onChange={(e) => handleSettingsPhotoChange(slot, e)}
                      />
                      <label
                        htmlFor={`st-photo-${slot}`}
                        className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 overflow-hidden flex items-center justify-center bg-slate-50 transition-colors"
                        style={{ height: 90 }}
                      >
                        {settingsPreviews[slot]
                          ? <img src={settingsPreviews[slot]} alt={label} className="w-full h-full object-cover" />
                          : <div className="flex flex-col items-center gap-1 text-slate-300">
                              <Upload size={18} />
                              <span className="text-[10px]">Adicionar</span>
                            </div>
                        }
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links do gabinete */}
              {(() => {
                const slug = userProfile?.tenantSlug
                if (!slug) return null
                const base = 'https://gabinete-digital-vereador.web.app'
                const links = [
                  { key: 'form',    label: 'Formulário para eleitores', desc: 'Compartilhe com os moradores para receber demandas', url: `${base}/atendimento/${slug}` },
                  { key: 'landing', label: 'Página pública do gabinete', desc: 'Site público com a identidade da cidade',           url: `${base}/vereador/${slug}` },
                  { key: 'login',   label: 'Login do painel',            desc: 'Acesso da equipe com a foto da cidade no fundo',    url: `${base}/painel/login?gabinete=${slug}` },
                ]
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-heading text-base font-semibold text-slate-900 mb-1">Links do gabinete</h3>
                    <p className="text-xs text-slate-400 mb-4">Estes links são salvos automaticamente ao salvar as configurações.</p>
                    <div className="space-y-2">
                      {links.map(({ key, label, desc, url }) => (
                        <div key={key} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 mb-0.5">{label}</p>
                            <p className="text-[10px] text-slate-400 mb-1">{desc}</p>
                            <p className="text-xs text-brand-700 font-mono truncate">{url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyLink(key, url)}
                            className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                            style={copiedKey === key
                              ? { backgroundColor: '#d1fae5', color: '#065f46' }
                              : { backgroundColor: '#f1f5f9', color: '#475569' }}
                          >
                            {copiedKey === key ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Save */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={handleSettingsSave}
                  className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  {settingsSaving ? 'Salvando...' : 'Salvar configurações'}
                </button>
                {settingsSaved && <span className="text-sm text-emerald-600 font-medium">✓ Salvo com sucesso!</span>}
                {settingsError && <span className="text-sm text-red-600">{settingsError}</span>}
              </div>
            </div>
          )}

          {/* View: Mensagens */}
          {view === 'messages' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-heading text-sm font-semibold text-slate-900 mb-1">Contatos dos eleitores</h3>
              <p className="text-xs text-slate-400 mb-4">Clique em "WhatsApp" para abrir uma conversa com o eleitor.</p>
              <div className="space-y-2">
                {demands.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{d.voterName}</p>
                      <p className="text-xs text-slate-500">{d.voterPhone}</p>
                      <p className="text-[10px] text-slate-400 truncate">{d.description}</p>
                    </div>
                    <StatusBadge status={d.status} />
                    <a
                      href={`https://wa.me/55${d.voterPhone.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-none px-3 py-1.5 rounded-lg bg-green-50 border border-green-100 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                      WhatsApp
                    </a>
                  </div>
                ))}
                {!demands.length && (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhuma demanda cadastrada ainda.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
