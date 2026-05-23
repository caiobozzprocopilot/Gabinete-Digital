import { NavLink } from 'react-router-dom'
import { isTestMode } from '../utils/testMode'

const TEST_LINKS = [
  { to: '/', label: 'Formulário' },
  { to: '/atendimento/ortigueira', label: 'Link público' },
  { to: '/painel/login', label: 'Login' },
  { to: '/painel', label: 'Painel' },
]

export default function TestModeNav() {
  if (!isTestMode) {
    return null
  }

  return (
    <aside className="fixed bottom-4 left-4 z-50 rounded-2xl bg-slate-900/95 backdrop-blur border border-white/10 px-3 py-2.5" aria-label="Navegacao de teste">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Modo teste</p>
      <nav className="flex flex-col gap-0.5">
        {TEST_LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? 'px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-brand-600/80'
                : 'px-2.5 py-1 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/8 transition-colors'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
