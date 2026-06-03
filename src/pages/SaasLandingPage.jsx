import {
  ArrowRight,
  BarChart2,
  Building2,
  CheckCircle2,
  FileText,
  MessagesSquare,
  Shield,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: MessagesSquare,
    title: 'Canal direto com o eleitor',
    desc: 'Formulário público acessível pelo celular, com fotos e descrição da demanda. Sem burocracia.',
  },
  {
    icon: BarChart2,
    title: 'Painel de gestão completo',
    desc: 'Visualize, filtre e atualize o status de cada demanda. Histórico completo de movimentações.',
  },
  {
    icon: FileText,
    title: 'Relatórios em PDF',
    desc: 'Exporte demandas individualmente ou em lote com um clique. Ideal para prestação de contas.',
  },
  {
    icon: Shield,
    title: 'Seguro e isolado',
    desc: 'Cada gabinete tem seu próprio ambiente. Seus dados nunca se misturam com os de outros.',
  },
  {
    icon: Smartphone,
    title: 'Funciona em qualquer dispositivo',
    desc: 'Design responsivo pensado para eleitores que acessam pelo celular na zona rural.',
  },
  {
    icon: Zap,
    title: 'Pronto em minutos',
    desc: 'Cadastro rápido, personalização com sua foto e cidade. Seu link público ativo no mesmo dia.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Seu gabinete entra para o sistema',
    desc: 'Criamos seu ambiente personalizado com o nome do vereador, cidade e fotos.',
  },
  {
    step: '02',
    title: 'Você compartilha o link com os eleitores',
    desc: 'Um link único para divulgar nas redes sociais, grupos de WhatsApp e material impresso.',
  },
  {
    step: '03',
    title: 'Eleitores registram demandas',
    desc: 'Simples como preencher um formulário. Podem anexar fotos da ocorrência.',
  },
  {
    step: '04',
    title: 'Seu time gerencia pelo painel',
    desc: 'Atualiza status, exporta relatórios e mantém o eleitor informado sobre o andamento.',
  },
]

const WHATSAPP_NUMBER = import.meta.env.VITE_CONTACT_WHATSAPP || ''
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || ''

function contactHref() {
  if (WHATSAPP_NUMBER) {
    const msg = encodeURIComponent('Olá! Tenho interesse no Gabinete Digital para meu mandato.')
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`
  }
  if (CONTACT_EMAIL) return `mailto:${CONTACT_EMAIL}?subject=Interesse no Gabinete Digital`
  return '/cadastro'
}

export default function SaasLandingPage() {
  const href = contactHref()
  const isExternal = href.startsWith('http') || href.startsWith('mailto')

  function ContactCta({ className, children }) {
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      )
    }
    return <Link to={href} className={className}>{children}</Link>
  }

  return (
    <div className="min-h-screen bg-[#0b1a12] text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16 bg-brand-950/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-sm tracking-wide">Gabinete Digital</span>
        </div>

        <div className="hidden md:flex items-center gap-7 text-sm text-white/60">
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
        </div>

        <ContactCta className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors">
          Solicitar demonstração
        </ContactCta>
      </nav>

      {/* Hero */}
      <section className="relative flex items-center min-h-screen pt-16 bg-gradient-to-br from-brand-950 via-[#0f2417] to-brand-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/20 border border-brand-600/30 text-brand-400 text-xs font-semibold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Para vereadores e assessorias parlamentares
          </div>

          <h1 className="text-4xl lg:text-6xl font-heading font-bold leading-tight mb-6 max-w-3xl mx-auto">
            O sistema de atendimento do seu gabinete,{' '}
            <em className="not-italic text-brand-400">no digital</em>
          </h1>

          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Canal público para eleitores registrarem demandas, painel de gestão para sua equipe e relatórios prontos para prestação de contas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <ContactCta className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold transition-all shadow-lg shadow-brand-900/40 text-base">
              Quero para meu gabinete <ArrowRight size={16} />
            </ContactCta>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold transition-all text-base"
            >
              Ver como funciona
            </a>
          </div>

          {/* Social proof strip */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-brand-400" />
              Configuração no mesmo dia
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-brand-400" />
              Sem taxa de instalação
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-brand-400" />
              Suporte incluso
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-[#0f2417]">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-3">Como funciona</p>
            <h2 className="text-3xl font-heading font-bold">Pronto em 4 passos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="relative p-6 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                <div className="text-4xl font-heading font-bold text-brand-600/30 mb-4 leading-none">{step}</div>
                <h3 className="text-sm font-heading font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-24 bg-brand-900">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl font-heading font-bold">Tudo que seu gabinete precisa</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                <div className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-600/20 text-brand-400">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-white mb-1">{title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For who */}
      <section className="py-24 bg-[#0f2417]">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-3">Para quem é</p>
              <h2 className="text-3xl font-heading font-bold leading-tight mb-6">
                Ideal para vereadores que querem ser mais presentes no mandato
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Users, text: 'Vereadores em primeiro ou segundo mandato que querem profissionalizar o atendimento' },
                  { icon: Smartphone, text: 'Assessorias que recebem demandas pelo WhatsApp e precisam de organização' },
                  { icon: BarChart2, text: 'Gabinetes que precisam apresentar resultados com transparência' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex gap-4 items-start">
                    <div className="flex-none flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 mt-0.5">
                      <Icon size={16} />
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini preview card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Prévia do painel</p>
              {[
                { label: 'Demanda recebida', status: 'Nova', color: 'bg-blue-500/20 text-blue-300' },
                { label: 'Encaminhada à secretaria', status: 'Encaminhada', color: 'bg-violet-500/20 text-violet-300' },
                { label: 'Calçada reparada — Zona Sul', status: 'Resolvida', color: 'bg-emerald-500/20 text-emerald-300' },
                { label: 'Poda de árvore solicitada', status: 'Em análise', color: 'bg-amber-500/20 text-amber-300' },
              ].map(({ label, status, color }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs text-white/70">{label}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Pronto para modernizar seu atendimento?
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Entre em contato e configure o Gabinete Digital para o seu mandato ainda esta semana.
          </p>
          <ContactCta className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold transition-all shadow-lg shadow-brand-950/40 text-lg">
            Solicitar demonstração <ArrowRight size={18} />
          </ContactCta>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-950 py-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Gabinete Digital</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Gabinete Digital &middot; Sistema para vereadores</span>
          <Link to="/master/login" className="hover:text-white/60 transition-colors">Área restrita</Link>
        </div>
      </footer>
    </div>
  )
}
