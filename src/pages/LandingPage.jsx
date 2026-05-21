import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, MessagesSquare, CheckCircle2, ChevronDown } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="landing-nav-dot" />
          <span className="landing-nav-name">Gabinete Digital</span>
          <span className="landing-nav-city">Ortigueira</span>
        </div>
        <ul className="landing-nav-links">
          <li><a href="#sobre">Sobre</a></li>
          <li><a href="#servicos">Serviços</a></li>
          <li><Link to="/formulario">Enviar demanda</Link></li>
        </ul>
        <Link className="landing-nav-cta" to="/painel/login">
          Acesso restrito
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <p className="landing-eyebrow">
            <MapPin size={13} />
            Vereador · Ortigueira, PR
          </p>
          <h1 className="landing-headline">
            Sua voz,<br />
            sua cidade,<br />
            <em>seu vereador.</em>
          </h1>
          <p className="landing-sub">
            Registre suas demandas e acompanhe o andamento. Transparência e
            agilidade no atendimento ao cidadão de Ortigueira.
          </p>
          <div className="landing-ctas">
            <Link className="landing-cta-primary" to="/formulario">
              Enviar demanda <ArrowRight size={16} />
            </Link>
            <a className="landing-cta-ghost" href="#sobre">
              Saiba mais
            </a>
          </div>
        </div>

        <a className="landing-scroll-hint" href="#stats">
          <ChevronDown size={20} />
        </a>
      </section>

      {/* ── Stats strip ── */}
      <section className="landing-stats" id="stats">
        <div className="landing-stat">
          <strong>247+</strong>
          <span>Demandas registradas</span>
        </div>
        <div className="landing-stat-divider" />
        <div className="landing-stat">
          <strong>89%</strong>
          <span>Taxa de resolução</span>
        </div>
        <div className="landing-stat-divider" />
        <div className="landing-stat">
          <strong>3 dias</strong>
          <span>Tempo médio de resposta</span>
        </div>
        <div className="landing-stat-divider" />
        <div className="landing-stat">
          <strong>5 anos</strong>
          <span>Servindo Ortigueira</span>
        </div>
      </section>

      {/* ── About section ── */}
      <section className="landing-about" id="sobre">
        <div className="landing-about-text">
          <p className="landing-section-eyebrow">Sobre o gabinete</p>
          <h2>Compromisso com o cidadão de Ortigueira</h2>
          <p>
            O Gabinete Digital é uma iniciativa para aproximar o vereador dos
            cidadãos, permitindo o registro de demandas, acompanhamento em tempo
            real e maior transparência no trabalho legislativo.
          </p>
          <Link className="landing-cta-primary" to="/formulario">
            Registrar minha demanda <ArrowRight size={16} />
          </Link>
        </div>
        <div className="landing-about-cards">
          <div className="landing-feature-card">
            <div className="landing-feature-icon"><MessagesSquare size={22} /></div>
            <h3>Atendimento direto</h3>
            <p>Envie sua demanda e receba resposta diretamente do gabinete.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon"><CheckCircle2 size={22} /></div>
            <h3>Acompanhamento</h3>
            <p>Acompanhe o status de cada demanda em tempo real com protocolo único.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon"><MapPin size={22} /></div>
            <h3>Presença local</h3>
            <p>Atuação em todos os bairros e distritos do município de Ortigueira.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>© 2026 Gabinete Digital · Ortigueira, PR</span>
        <Link to="/painel/login">Acesso do vereador</Link>
      </footer>
    </div>
  )
}
