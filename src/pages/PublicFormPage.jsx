import { useEffect, useRef, useState } from 'react'
import { Building2, Camera } from 'lucide-react'
import ReCAPTCHA from 'react-google-recaptcha'
import { Link, useParams } from 'react-router-dom'
import { firebaseReady } from '../firebase/config'
import { submitDemand } from '../services/demandsService'
import { serializeImages } from '../utils/imageUtils'
import { isTestMode } from '../utils/testMode'

const MAX_FILES = 5
const MAX_FILE_SIZE_MB = 5
const RATE_LIMIT_MS = 60000
const RATE_LIMIT_KEY = 'vereador-last-submit-ts'

const initialForm = {
  voterName: '',
  voterPhone: '',
  voterAddress: '',
  description: '',
  consent: false,
}

export default function PublicFormPage() {
  const { slug } = useParams()
  const slugValue = slug || import.meta.env.VITE_PUBLIC_LINK_SLUG || 'ortigueira'
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
  const recaptchaRef = useRef(null)

  const [formData, setFormData] = useState(initialForm)
  const [files, setFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [honeypot, setHoneypot] = useState('')
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  function handleFieldChange(event) {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleFilesChange(event) {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length > MAX_FILES) {
      setFeedback({ type: 'error', message: `Voce pode enviar ate ${MAX_FILES} fotos por demanda.` })
      return
    }
    setFiles(selectedFiles)
    setPreviewUrls((current) => {
      current.forEach((url) => URL.revokeObjectURL(url))
      return selectedFiles.map((file) => URL.createObjectURL(file))
    })
    setFeedback({ type: '', message: '' })
  }

  function validateForm() {
    if (!firebaseReady && !isTestMode) {
      return 'Firebase nao configurado. Ajuste o arquivo .env.local antes de testar.'
    }
    if (!formData.voterName.trim()) return 'Informe o nome completo.'
    if (!formData.voterPhone.trim()) return 'Informe um telefone para retorno.'
    if (!formData.voterAddress.trim()) return 'Informe o endereco completo da ocorrencia.'
    if (!formData.description.trim()) return 'Descreva a demanda.'
    if (!formData.consent) return 'Voce precisa aceitar o tratamento dos dados para enviar a demanda.'
    if (!isTestMode && recaptchaSiteKey && !recaptchaToken) return 'Confirme o reCAPTCHA para continuar.'
    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (sending) return
    if (honeypot) {
      setFeedback({ type: 'success', message: 'Recebemos sua solicitacao. Obrigado pelo contato.' })
      return
    }
    const validationMessage = validateForm()
    if (validationMessage) {
      setFeedback({ type: 'error', message: validationMessage })
      return
    }
    const lastSubmitTs = Number(localStorage.getItem(RATE_LIMIT_KEY) || 0)
    const elapsed = Date.now() - lastSubmitTs
    if (elapsed < RATE_LIMIT_MS) {
      const secondsLeft = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000)
      setFeedback({ type: 'error', message: `Aguarde ${secondsLeft}s antes de enviar uma nova demanda.` })
      return
    }
    try {
      setSending(true)
      setFeedback({ type: '', message: '' })
      const attachments = await serializeImages(files, { maxFiles: MAX_FILES, maxFileSizeMb: MAX_FILE_SIZE_MB })
      if (isTestMode) {
        await new Promise((resolve) => { window.setTimeout(resolve, 280) })
      } else {
        await submitDemand({
          voterName: formData.voterName.trim(),
          voterPhone: formData.voterPhone.trim(),
          voterAddress: formData.voterAddress.trim(),
          description: formData.description.trim(),
          attachments,
          sourceSlug: slugValue,
          consentGivenAt: new Date().toISOString(),
          recaptchaValidated: Boolean(recaptchaToken),
        })
      }
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
      setFormData(initialForm)
      setFiles([])
      setPreviewUrls((current) => { current.forEach((url) => URL.revokeObjectURL(url)); return [] })
      setRecaptchaToken('')
      recaptchaRef.current?.reset()
      setFeedback({
        type: 'success',
        message: isTestMode
          ? 'Modo teste: demanda simulada com sucesso.'
          : 'Demanda enviada com sucesso. A equipe do vereador vai analisar seu pedido.',
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Nao foi possivel enviar a demanda. Tente novamente.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Top bar */}
      <header className="flex-none flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 shadow-sm z-30">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-brand-600 shadow-[0_0_0_4px_rgba(34,160,112,0.2)]" aria-hidden="true" />
          <div className="leading-tight">
            <strong className="text-sm font-semibold text-slate-900">Gabinete Digital Ortigueira</strong>
            <span className="block text-xs text-slate-400">Canal oficial para demandas dos eleitores</span>
          </div>
        </div>
        <Link className="text-xs text-slate-500 hover:text-brand-700 font-medium transition-colors" to="/painel/login">
          Acesso administrativo
        </Link>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <aside
          className="hidden lg:flex flex-col w-[420px] xl:w-[480px] flex-none relative overflow-hidden"
          style={{ backgroundImage: "url('/CIDADE pagina form.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/90 via-brand-950/40 to-brand-950/90" />

          {/* brand badge */}
          <div className="relative z-10 flex items-center gap-2.5 p-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/90">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">Gabinete Digital</span>
          </div>

          {/* bottom content */}
          <div className="relative z-10 mt-auto p-8">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-3">Atendimento do vereador</p>
            <h1 className="text-white font-heading text-3xl font-bold leading-tight mb-4">
              Registre sua<br />demanda em<br />poucos minutos
            </h1>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Este canal permite enviar solicitacoes, anexar fotos e acompanhar o encaminhamento junto ao gabinete.
            </p>

            <ul className="space-y-2 mb-6">
              {[
                'Envio simples pelo celular com fotos da ocorrencia',
                'Triagem e encaminhamento com status atualizado',
                'Registro historico para transparencia do atendimento',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-white/80">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-400 flex-none" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 mb-5">
              <p className="text-white/50 text-xs font-medium mb-0.5">Link publico ativo</p>
              <p className="text-white text-sm font-mono">/atendimento/{slugValue}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Canal', value: '24h' },
                { label: 'Anexos', value: '5 fotos' },
                { label: 'Fluxo', value: '5 status' },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 text-center">
                  <span className="block text-white/50 text-xs mb-0.5">{m.label}</span>
                  <strong className="block text-white text-sm font-bold">{m.value}</strong>
                </div>
              ))}
            </div>

            {isTestMode && (
              <p className="mt-4 text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                Modo teste ativo: envio simulado para facilitar a revisao.
              </p>
            )}
            {!firebaseReady && !isTestMode && (
              <p className="mt-4 text-xs text-red-300 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                Firebase ainda nao configurado. Preencha o .env.local.
              </p>
            )}
            {!recaptchaSiteKey && !isTestMode && (
              <p className="mt-4 text-xs text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                reCAPTCHA nao configurado. Defina VITE_RECAPTCHA_SITE_KEY.
              </p>
            )}
          </div>
        </aside>

        {/* Right form panel */}
        <section className="flex-1 overflow-y-auto bg-white border-l border-slate-100">
          <div className="max-w-lg mx-auto px-6 py-10">
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-1">Abrir solicitacao</h2>
            <p className="text-sm text-slate-500 mb-8">Preencha os campos abaixo para registrar sua demanda.</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* honeypot */}
              <div className="hidden" aria-hidden="true">
                <input
                  id="website" type="text" value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  autoComplete="off" tabIndex={-1}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="voterName">Nome completo</label>
                <input id="voterName" name="voterName" type="text" value={formData.voterName} onChange={handleFieldChange} required maxLength={120}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="voterPhone">Telefone para contato</label>
                <input id="voterPhone" name="voterPhone" type="tel" value={formData.voterPhone} onChange={handleFieldChange} required maxLength={30}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="voterAddress">Endereco completo</label>
                <input id="voterAddress" name="voterAddress" type="text" value={formData.voterAddress} onChange={handleFieldChange} required maxLength={180}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="description">Descricao da demanda</label>
                <textarea id="description" name="description" rows={5} value={formData.description} onChange={handleFieldChange} required maxLength={1800}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:bg-white transition-colors resize-none" />
              </div>

              <div>
                <input id="attachments" name="attachments" type="file" accept="image/*" multiple onChange={handleFilesChange} className="sr-only" />
                <label
                  htmlFor="attachments"
                  className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    files.length > 0
                      ? 'border-brand-700/40 bg-brand-50 py-5'
                      : 'border-slate-300 bg-slate-50 py-10 hover:border-brand-600/50 hover:bg-brand-50/50'
                  }`}
                >
                  {files.length === 0 ? (
                    <>
                      <Camera size={38} strokeWidth={1.3} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">Adicionar fotos</span>
                      <span className="text-xs text-slate-400">
                        Clique para selecionar &middot; ate {MAX_FILES} fotos &middot; {MAX_FILE_SIZE_MB}&nbsp;MB cada
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-5 gap-1.5 px-3">
                        {previewUrls.map((url) => (
                          <img key={url} src={url} alt="Preview do anexo" className="w-full aspect-square object-cover rounded-lg" />
                        ))}
                      </div>
                      <span className="text-xs text-brand-700 font-medium mt-1">
                        {files.length} de {MAX_FILES} foto{files.length !== 1 ? 's' : ''} selecionada{files.length !== 1 ? 's' : ''} &middot; clique para alterar
                      </span>
                    </>
                  )}
                </label>
              </div>

              <label className="flex items-start gap-3 cursor-pointer" htmlFor="consent">
                <input id="consent" name="consent" type="checkbox" checked={formData.consent} onChange={handleFieldChange}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-brand-700" />
                <span className="text-xs text-slate-600 leading-relaxed">
                  Autorizo o uso dos meus dados para atendimento da solicitacao, conforme aviso de privacidade do gabinete.
                </span>
              </label>

              {recaptchaSiteKey ? (
                <div>
                  <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaSiteKey} onChange={(token) => setRecaptchaToken(token || '')} />
                </div>
              ) : null}

              {feedback.message ? (
                <p className={`text-sm px-4 py-3 rounded-xl ${
                  feedback.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {feedback.message}
                </p>
              ) : null}

              <button
                type="submit" disabled={sending}
                className="w-full py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              >
                {sending ? 'Enviando demanda...' : 'Enviar demanda'}
              </button>

            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
