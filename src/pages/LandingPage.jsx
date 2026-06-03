import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, CheckCircle2, MapPin, MessagesSquare } from 'lucide-react'
import { getTenant } from '../services/tenantsService'

export default function LandingPage() {
  const { slug } = useParams()
  const [tenantData, setTenantData] = useState(null)

  useEffect(() => {
    if (slug) getTenant(slug).then(setTenantData).catch(() => {})
  }, [slug])

  const formSlug = slug || 'ortigueira'
  const cityLabel = tenantData ? `${tenantData.cityName}${tenantData.state ? `, ${tenantData.state}` : ''}` : 'Ortigueira, PR'
  const vereadorName = tenantData?.vereadorName || 'Vereador'
  const heroPhoto = tenantData?.heroPhotoUrl || '/cidade.jpeg'

  const FEATURES = [
    {
      icon: MessagesSquare,
      title: 'Canal direto com o gabinete',
      desc: 'Envie sua demanda pelo celular ou computador, com foto da ocorrencia, sem burocracia.',
    },
    {
      icon: CheckCircle2,
      title: 'Acompanhamento transparente',
      desc: 'Cada solicitacao recebe um protocolo e fluxo de status: Nova, Em analise, Encaminhada, Resolvida.',
    },
    {
      icon: MapPin,
      title: `Foco em ${tenantData?.cityName || 'seu município'}`,
      desc: 'Sistema desenvolvido para a realidade local — zona rural, estradas, iluminacao e muito mais.',
    },
  ]

  const STATS = [
    { value: '247+', label: 'Demandas atendidas' },
    { value: '89%', label: 'Taxa de resolucao' },
    { value: '3 dias', label: 'Tempo medio de resposta' },
    { value: '5 anos', label: 'Experiencia no mandato' },
  ]

  return (
    <div className="min-h-screen bg-[#0b1a12] text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 h-16 bg-brand-950/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-sm tracking-wide">Gabinete Digital</span>
        </div>
        <div className="hidden md:flex items-center gap-7 text-sm text-white/60">
          <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
          <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
        </div>
        <Link
          to={`/atendimento/${formSlug}`}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
        >
          Enviar demanda
        </Link>
      </nav>

      {/* Hero */}
      <section
        className="relative flex items-center min-h-screen pt-16"
        style={{ backgroundImage: `url(${heroPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-950/80 to-brand-950/40" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/20 border border-brand-600/30 text-brand-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            {cityLabel}
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-bold leading-tight mb-6 max-w-2xl">
            Sua voz chega direto ao gabinete
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-lg mb-10">
            Registre solicitacoes, anexe fotos e acompanhe o andamento das suas demandas. Simples, rapido e transparente.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/atendimento/${formSlug}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold transition-all shadow-lg shadow-brand-900/40"
            >
              Registrar uma demanda
            </Link>
            <a
              href="#sobre"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold transition-all"
            >
              Saiba mais
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-brand-900 py-14">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-brand-900 px-6 py-8 text-center">
                <div className="text-3xl font-heading font-bold text-white mb-1">{value}</div>
                <div className="text-sm text-white/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="sobre" className="bg-[#0f2417] py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-3">Sobre o sistema</p>
              <h2 className="text-3xl font-heading font-bold leading-tight mb-5">
                Tecnologia a servico da comunidade
              </h2>
              <p className="text-white/60 leading-relaxed mb-5">
                O Gabinete Digital foi criado para aproximar o vereador dos moradores de {tenantData?.cityName || 'Ortigueira'}. Cada demanda e registrada, triada e encaminhada com agilidade — garantindo transparencia e rastreabilidade.
              </p>
              <p className="text-white/60 leading-relaxed">
                Seja uma solicitacao de manutenção de estrada rural, iluminacao publica ou atendimento social, o sistema garante que sua voz seja ouvida.
              </p>
            </div>

            {/* Feature cards */}
            <div id="funcionalidades" className="space-y-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
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
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Pronto para registrar sua demanda?</h2>
          <p className="text-white/60 mb-8">Leva menos de 2 minutos. Sem cadastro, sem burocracia.</p>
          <Link
            to={`/atendimento/${formSlug}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold transition-all shadow-lg shadow-brand-950/40 text-lg"
          >
            Enviar minha demanda
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-950 py-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Gabinete Digital</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Gabinete Digital &middot; {cityLabel}</span>
          <Link to={`/painel/login?gabinete=${formSlug}`} className="hover:text-white/60 transition-colors">Acesso administrativo</Link>
        </div>
      </footer>
    </div>
  )
}
