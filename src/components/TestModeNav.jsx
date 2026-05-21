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
    <aside className="test-nav" aria-label="Navegação de teste">
      <p className="test-nav-title">Modo teste</p>
      <nav className="test-nav-links">
        {TEST_LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'test-nav-link test-nav-link-active' : 'test-nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
