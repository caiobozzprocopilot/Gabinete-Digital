import { useEffect, useMemo, useState } from 'react'
import {
  BarChart2, Bell, Building2, Calendar, CalendarCheck,
  CheckCircle, ClipboardList, LogOut, Mail, MessageSquare, Settings, Zap,
} from 'lucide-react'
import { DEMAND_STATUS } from '../constants/demandStatus'
import { firebaseReady } from '../firebase/config'
import { useAuth } from '../context/useAuth'
import { subscribeDemands, updateDemandStatus } from '../services/demandsService'
import { isTestMode } from '../utils/testMode'
import { exportBatchDemandPdf, exportSingleDemandPdf } from '../utils/pdfUtils'
import StatusBadge from '../components/StatusBadge'

const PAGE_SIZE = 8

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
      description: 'Solicitacao de troca de lampada em poste com falha ha mais de 10 dias.',
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
      description: 'Demanda para manutencao de ponto de onibus sem cobertura.',
      status: 'Encaminhada', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 10),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 7),
      attachments: [{ name: 'ponto.jpg', type: 'image/jpeg', base64: MOCK_IMAGE }],
    },
    {
      id: 'TST-1004', voterName: 'Ronaldo Vieira', voterPhone: '(42) 99711-6672',
      voterAddress: 'Rua do Campo, 88 - Vila Nova',
      description: 'Acompanhamento de solicitacao ja atendida na semana anterior.',
      status: 'Resolvida', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 28),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 9), attachments: [],
    },
    {
      id: 'TST-1005', voterName: 'Patricia Gomes', voterPhone: '(42) 99801-4588',
      voterAddress: 'Rua das Flores, 312 - Jardim Planalto',
      description: 'Pedido de avaliacao para limpeza de area com acumulo de entulho.',
      status: 'Arquivada', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 52),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 30), attachments: [],
    },
  ]
}

export default function DashboardPage() {
  const { user, userProfile, logout } = useAuth()

  const [demands, setDemands] = useState(() => (isTestMode ? buildMockDemands() : []))
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

  useEffect(() => {
    if (isTestMode || !firebaseReady) return undefined
    const unsubscribe = subscribeDemands(
      (items) => { setDemands(items); setError(''); setLoading(false) },
      (nextError) => { setError(nextError?.message || 'Falha ao carregar demandas do painel.'); setLoading(false) },
    )
    return unsubscribe
  }, [])

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
          <button className="flex items-center justify-center w-10 h-10 rounded-xl text-white bg-white/20" type="button" title="Demandas">
            <ClipboardList size={20} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all" type="button" title="Relatorios">
            <BarChart2 size={20} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all" type="button" title="Calendario">
            <Calendar size={20} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all" type="button" title="Mensagens">
            <MessageSquare size={20} />
          </button>
        </nav>
        <div className="flex flex-col items-center gap-1 pb-4">
          <button className="flex items-center justify-center w-10 h-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all" type="button" title="Configuracoes">
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
            <span className="text-xs text-slate-400">Painel de demandas &middot; {activeRole}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" type="button" title="Notificacoes">
              <Bell size={18} />
            </button>
            <button className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" type="button" title="Mensagens">
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
              Modo teste ativo: o painel usa dados simulados para facilitar navegacao e revisao visual.
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
                    <label className="text-xs font-medium text-slate-500" htmlFor="endDate">Ate</label>
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
                        <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Acoes</th>
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
                  <span className="text-xs text-slate-500">Pagina {safeCurrentPage} de {totalPages}</span>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors" type="button"
                    disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>
                    Proxima &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Status distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-heading text-sm font-semibold text-slate-900 mb-4">Distribuicao por status</h3>
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
                          { label: 'Endereco', value: activeDemand.voterAddress },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-2">
                            <dt className="text-xs font-semibold text-slate-400 w-20 flex-none">{label}</dt>
                            <dd className="text-xs text-slate-700 break-all">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Descricao</h4>
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
        </div>
      </div>
    </div>
  )
}
