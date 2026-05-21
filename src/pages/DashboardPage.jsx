import { useEffect, useMemo, useState } from 'react'
import {
  BarChart2,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle,
  ClipboardList,
  LogOut,
  Mail,
  MessageSquare,
  Settings,
  Zap,
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
  if (!value) {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseStartDate(value) {
  if (!value) {
    return null
  }

  return new Date(`${value}T00:00:00`)
}

function parseEndDate(value) {
  if (!value) {
    return null
  }

  return new Date(`${value}T23:59:59`)
}

const MOCK_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

function buildMockDemands() {
  const now = new Date()

  return [
    {
      id: 'TST-1001',
      voterName: 'Ana Souza',
      voterPhone: '(42) 99911-2233',
      voterAddress: 'Rua das Araucarias, 120 - Centro',
      description: 'Solicitacao de troca de lampada em poste com falha ha mais de 10 dias.',
      status: 'Nova',
      createdAt: new Date(now.getTime() - 1000 * 60 * 35),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 20),
      attachments: [{ name: 'poste.png', type: 'image/png', base64: MOCK_IMAGE }],
    },
    {
      id: 'TST-1002',
      voterName: 'Carlos Pereira',
      voterPhone: '(42) 99877-1020',
      voterAddress: 'Av. Principal, 450 - Bairro Jardim Alegre',
      description: 'Pedido de cascalhamento em trecho com barro e dificil acesso para transporte escolar.',
      status: 'Em análise',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60),
      attachments: [],
    },
    {
      id: 'TST-1003',
      voterName: 'Marcia Lima',
      voterPhone: '(42) 99905-8771',
      voterAddress: 'Comunidade Lagoa Branca, s/n - Zona Rural',
      description: 'Demanda para manutenção de ponto de ônibus sem cobertura.',
      status: 'Encaminhada',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 10),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 7),
      attachments: [{ name: 'ponto.jpg', type: 'image/jpeg', base64: MOCK_IMAGE }],
    },
    {
      id: 'TST-1004',
      voterName: 'Ronaldo Vieira',
      voterPhone: '(42) 99711-6672',
      voterAddress: 'Rua do Campo, 88 - Vila Nova',
      description: 'Acompanhamento de solicitação já atendida na semana anterior.',
      status: 'Resolvida',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 28),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 9),
      attachments: [],
    },
    {
      id: 'TST-1005',
      voterName: 'Patricia Gomes',
      voterPhone: '(42) 99801-4588',
      voterAddress: 'Rua das Flores, 312 - Jardim Planalto',
      description: 'Pedido de avaliacao para limpeza de area com aculo de entulho.',
      status: 'Arquivada',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 52),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 30),
      attachments: [],
    },
  ]
}

export default function DashboardPage() {
  const { user, userProfile, logout } = useAuth()

  const [demands, setDemands] = useState(() => (isTestMode ? buildMockDemands() : []))
  const [loading, setLoading] = useState(!isTestMode && firebaseReady)
  const [error, setError] = useState(() => {
    if (isTestMode) {
      return ''
    }

    return firebaseReady
      ? ''
      : 'Firebase não configurado. Ajuste o arquivo .env.local para carregar o painel.'
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [busyDemandId, setBusyDemandId] = useState('')
  const [activeDemandId, setActiveDemandId] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (isTestMode) {
      return undefined
    }

    if (!firebaseReady) {
      return undefined
    }

    const unsubscribe = subscribeDemands(
      (items) => {
        setDemands(items)
        setError('')
        setLoading(false)
      },
      (nextError) => {
        setError(nextError?.message || 'Falha ao carregar demandas do painel.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const filteredDemands = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase()
    const startDate = parseStartDate(filters.startDate)
    const endDate = parseEndDate(filters.endDate)

    return demands.filter((demand) => {
      if (filters.status && demand.status !== filters.status) {
        return false
      }

      const createdAt = demand.createdAt ? new Date(demand.createdAt) : null
      if (startDate && (!createdAt || createdAt < startDate)) {
        return false
      }

      if (endDate && (!createdAt || createdAt > endDate)) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        demand.id,
        demand.voterName,
        demand.voterPhone,
        demand.voterAddress,
        demand.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

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
    if (!activeDemandId) {
      return pageDemands[0] || null
    }

    return demands.find((item) => item.id === activeDemandId) || null
  }, [activeDemandId, demands, pageDemands])

  const allPageSelected =
    pageDemands.length > 0 && pageDemands.every((demand) => selectedIds.includes(demand.id))

  const summary = useMemo(() => {
    const today = new Date().toDateString()

    const total = demands.length
    const active = demands.filter(
      (demand) => !['Resolvida', 'Arquivada'].includes(demand.status),
    ).length
    const resolved = demands.filter((demand) => demand.status === 'Resolvida').length
    const createdToday = demands.filter((demand) => {
      if (!demand.createdAt) {
        return false
      }

      return new Date(demand.createdAt).toDateString() === today
    }).length

    return {
      total,
      active,
      resolved,
      createdToday,
    }
  }, [demands])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
    setCurrentPage(1)
  }

  function toggleDemandSelection(demandId) {
    setSelectedIds((current) => {
      if (current.includes(demandId)) {
        return current.filter((id) => id !== demandId)
      }

      return [...current, demandId]
    })
  }

  function togglePageSelection() {
    const pageIds = pageDemands.map((demand) => demand.id)

    setSelectedIds((current) => {
      const currentSet = new Set(current)

      if (allPageSelected) {
        pageIds.forEach((id) => currentSet.delete(id))
      } else {
        pageIds.forEach((id) => currentSet.add(id))
      }

      return Array.from(currentSet)
    })
  }

  async function handleStatusChange(demand, nextStatus) {
    if (!nextStatus || demand.status === nextStatus) {
      return
    }

    if (isTestMode) {
      setDemands((current) =>
        current.map((item) =>
          item.id === demand.id
            ? {
                ...item,
                status: nextStatus,
                updatedAt: new Date(),
              }
            : item,
        ),
      )
      setStatusMessage(`Modo teste: status da demanda ${demand.id} alterado para ${nextStatus}.`)
      return
    }

    setBusyDemandId(demand.id)
    setStatusMessage('')

    try {
      const operatorName = userProfile?.displayName || user?.email || 'operador'
      await updateDemandStatus({
        demandId: demand.id,
        status: nextStatus,
        changedBy: operatorName,
      })
      setStatusMessage(`Status da demanda ${demand.id} atualizado para ${nextStatus}.`)
    } catch (nextError) {
      setStatusMessage(nextError?.message || 'Não foi possível atualizar o status agora.')
    } finally {
      setBusyDemandId('')
    }
  }

  function handleBatchPdf() {
    const selectedDemands = demands.filter((demand) => selectedIds.includes(demand.id))

    if (!selectedDemands.length) {
      setStatusMessage('Selecione ao menos uma demanda para gerar o PDF em lote.')
      return
    }

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
      <div className="screen-center">
        <p>Carregando demandas...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-root">
      {/* Left icon sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo"><Building2 size={22} /></div>
        <nav className="sidebar-nav">
          <button className="sidebar-icon active" type="button" title="Demandas"><ClipboardList size={20} /></button>
          <button className="sidebar-icon" type="button" title="Relatorios"><BarChart2 size={20} /></button>
          <button className="sidebar-icon" type="button" title="Calendário"><Calendar size={20} /></button>
          <button className="sidebar-icon" type="button" title="Mensagens"><MessageSquare size={20} /></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-icon" type="button" title="Configurações"><Settings size={20} /></button>
          <button className="sidebar-icon" type="button" title="Sair" onClick={logout}><LogOut size={20} /></button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="dashboard-main">
        {/* Top header */}
        <header className="dashboard-header">
          <div className="dashboard-greeting">
            <strong>Bom dia, {activeUserName.split(' ')[0]}</strong>
            <span>Painel de demandas · {activeRole}</span>
          </div>
          <div className="dashboard-header-right">
            <button className="header-icon-btn" type="button" title="Notificações"><Bell size={18} /></button>
            <button className="header-icon-btn" type="button" title="Mensagens"><Mail size={18} /></button>
            <div className="header-avatar">
              {activeUserName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="dashboard-body">
          {isTestMode ? (
            <p className="feedback info">
              Modo teste ativo: o painel usa dados simulados para facilitar navegação e revisão visual.
            </p>
          ) : null}

          {/* Stats row */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">
                <div className="stat-card-label-icon"><ClipboardList size={16} /></div>
                Total de demandas
              </div>
              <div className="stat-card-value">{summary.total}</div>
              <div className="stat-card-trend">todas as demandas</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">
                <div className="stat-card-label-icon"><Zap size={16} /></div>
                Ativas
              </div>
              <div className="stat-card-value">{summary.active}</div>
              <div className="stat-card-trend">em andamento</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">
                <div className="stat-card-label-icon"><CheckCircle size={16} /></div>
                Resolvidas
              </div>
              <div className="stat-card-value">{summary.resolved}</div>
              <div className="stat-card-trend">concluídas</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">
                <div className="stat-card-label-icon"><CalendarCheck size={16} /></div>
                Hoje
              </div>
              <div className="stat-card-value">{summary.createdToday}</div>
              <div className="stat-card-trend">recebidas hoje</div>
            </div>
          </div>

          {/* Content grid: table + right panel */}
          <div className="dashboard-content-grid">
            <div className="dashboard-left">
              {/* Demands card */}
              <div className="demands-card">
                <div className="demands-card-header">
                  <h2>Demandas dos eleitores</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="secondary-button small" type="button" onClick={togglePageSelection}>
                      {allPageSelected ? 'Desmarcar' : 'Selecionar pág.'}
                    </button>
                    <button className="primary-button" style={{ padding: '0.44rem 0.8rem', fontSize: '0.82rem' }} type="button" onClick={handleBatchPdf}>
                      PDF em lote ({selectedIds.length})
                    </button>
                  </div>
                </div>

                <div className="demands-card-body">
                  {/* Filters */}
                  <div className="filters-row">
                    <div className="input-group">
                      <label htmlFor="search">Buscar</label>
                      <input
                        id="search"
                        value={filters.search}
                        onChange={(event) => updateFilter('search', event.target.value)}
                        placeholder="Nome, telefone, protocolo..."
                      />
                    </div>
                    <div className="input-group" style={{ flex: '0 0 auto', minWidth: '130px' }}>
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        value={filters.status}
                        onChange={(event) => updateFilter('status', event.target.value)}
                      >
                        <option value="">Todos</option>
                        {DEMAND_STATUS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group" style={{ flex: '0 0 auto', minWidth: '130px' }}>
                      <label htmlFor="startDate">De</label>
                      <input id="startDate" type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} />
                    </div>
                    <div className="input-group" style={{ flex: '0 0 auto', minWidth: '130px' }}>
                      <label htmlFor="endDate">Ate</label>
                      <input id="endDate" type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} />
                    </div>
                    <button className="secondary-button small" type="button" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>
                      Limpar
                    </button>
                  </div>

                  {error ? <p className="feedback error">{error}</p> : null}
                  {statusMessage ? <p className="feedback info">{statusMessage}</p> : null}

                  {/* Table */}
                  <div className="table-wrap">
                    <table className="demand-table">
                      <thead>
                        <tr>
                          <th>Sel.</th>
                          <th>Data</th>
                          <th>Nome</th>
                          <th>Telefone</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageDemands.map((demand) => (
                          <tr key={demand.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(demand.id)}
                                onChange={() => toggleDemandSelection(demand.id)}
                                aria-label={`Selecionar demanda ${demand.id}`}
                              />
                            </td>
                            <td>{formatDate(demand.createdAt)}</td>
                            <td>
                              <button className="link-button" type="button" onClick={() => setActiveDemandId(demand.id)}>
                                {demand.voterName}
                              </button>
                            </td>
                            <td>{demand.voterPhone}</td>
                            <td>
                              <select
                                className="status-select"
                                data-status={demand.status || 'Nova'}
                                value={demand.status || 'Nova'}
                                onChange={(event) => handleStatusChange(demand, event.target.value)}
                                disabled={busyDemandId === demand.id}
                              >
                                {DEMAND_STATUS.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button className="secondary-button small" type="button" onClick={() => exportSingleDemandPdf(demand)}>
                                PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!pageDemands.length ? <p style={{ textAlign: 'center', padding: '1rem 0' }}>Nenhuma demanda encontrada para os filtros atuais.</p> : null}

                  <div className="pagination">
                    <button className="secondary-button small" type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>
                      ← Anterior
                    </button>
                    <span>Página {safeCurrentPage} de {totalPages}</span>
                    <button className="secondary-button small" type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>
                      Próxima →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: detail panel */}
            <div>
              {/* Quick stats */}
              <div className="quick-panel" style={{ marginBottom: '1rem' }}>
                <div className="quick-panel-title">Distribuição por status</div>
                <ul className="quick-stat-list">
                  {DEMAND_STATUS.map((status) => {
                    const count = demands.filter((d) => d.status === status).length
                    const pct = demands.length ? Math.round((count / demands.length) * 100) : 0
                    return (
                      <li key={status} className="quick-stat-item">
                        <span style={{ minWidth: '90px', fontSize: '0.82rem' }}>{status}</span>
                        <div className="quick-stat-bar-wrap">
                          <div className="quick-stat-bar" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="quick-stat-pct">{pct}%</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Detail panel */}
              <div className="detail-panel">
                <div className="detail-panel-header">
                  <h2>Detalhes</h2>
                  {activeDemand && <StatusBadge status={activeDemand.status} />}
                </div>
                <div className="detail-panel-body">
                  {activeDemand ? (
                    <>
                      <dl className="detail-list">
                        <div><dt>Protocolo</dt><dd>{activeDemand.id}</dd></div>
                        <div><dt>Data</dt><dd>{formatDate(activeDemand.createdAt)}</dd></div>
                        <div><dt>Nome</dt><dd>{activeDemand.voterName}</dd></div>
                        <div><dt>Telefone</dt><dd>{activeDemand.voterPhone}</dd></div>
                        <div><dt>Endereço</dt><dd>{activeDemand.voterAddress}</dd></div>
                      </dl>

                      <h3>Descrição</h3>
                      <p className="description-box">{activeDemand.description}</p>

                      <h3>Anexos</h3>
                      {activeDemand.attachments?.length ? (
                        <div className="preview-grid">
                          {activeDemand.attachments.map((image, index) => (
                            <img key={`${activeDemand.id}-${index}`} src={image.base64} alt={`Anexo ${index + 1}`} />
                          ))}
                        </div>
                      ) : (
                        <p>Sem anexos.</p>
                      )}
                    </>
                  ) : (
                    <p>Clique em um nome na tabela para ver os detalhes.</p>
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
