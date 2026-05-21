import { useEffect, useRef, useState } from 'react'
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
      setFeedback({
        type: 'error',
        message: `Você pode enviar até ${MAX_FILES} fotos por demanda.`,
      })
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
      return 'Firebase não configurado. Ajuste o arquivo .env.local antes de testar.'
    }

    if (!formData.voterName.trim()) {
      return 'Informe o nome completo.'
    }

    if (!formData.voterPhone.trim()) {
      return 'Informe um telefone para retorno.'
    }

    if (!formData.voterAddress.trim()) {
      return 'Informe o endereço completo da ocorrência.'
    }

    if (!formData.description.trim()) {
      return 'Descreva a demanda.'
    }

    if (!formData.consent) {
      return 'Você precisa aceitar o tratamento dos dados para enviar a demanda.'
    }

    if (!isTestMode && recaptchaSiteKey && !recaptchaToken) {
      return 'Confirme o reCAPTCHA para continuar.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (sending) {
      return
    }

    if (honeypot) {
      setFeedback({
        type: 'success',
        message: 'Recebemos sua solicitacao. Obrigado pelo contato.',
      })
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
      setFeedback({
        type: 'error',
        message: `Aguarde ${secondsLeft}s antes de enviar uma nova demanda.`,
      })
      return
    }

    try {
      setSending(true)
      setFeedback({ type: '', message: '' })

      const attachments = await serializeImages(files, {
        maxFiles: MAX_FILES,
        maxFileSizeMb: MAX_FILE_SIZE_MB,
      })

      if (isTestMode) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 280)
        })
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
      setPreviewUrls((current) => {
        current.forEach((url) => URL.revokeObjectURL(url))
        return []
      })
      setRecaptchaToken('')
      recaptchaRef.current?.reset()
      setFeedback({
        type: 'success',
        message: isTestMode
          ? 'Modo teste: demanda simulada com sucesso.'
          : 'Demanda enviada com sucesso. A equipe do vereador vai analisar seu pedido.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Não foi possível enviar a demanda. Tente novamente.',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="top-bar">
        <div className="brand-area">
          <span className="brand-dot" aria-hidden="true" />
          <div className="brand-meta">
            <strong>Gabinete Digital Ortigueira</strong>
            <span>Canal oficial para demandas dos eleitores</span>
          </div>
        </div>
        <Link className="ghost-link admin-link" to="/painel/login">
          Acesso administrativo
        </Link>
      </header>

      <main className="content-grid">
        <section className="intro-card card">
          <p className="eyebrow">Atendimento do vereador</p>
          <h1>Registre sua demanda em poucos minutos</h1>
          <p>
            Este canal permite enviar solicitações, anexar fotos e acompanhar o
            encaminhamento junto ao gabinete.
          </p>
          <ul className="feature-list">
            <li>Envio simples pelo celular com fotos da ocorrência</li>
            <li>Triagem e encaminhamento com status atualizado</li>
            <li>Registro histórico para transparência do atendimento</li>
          </ul>
          <div className="highlight-box">
            <p className="highlight-title">Link público ativo</p>
            <p>/atendimento/{slugValue}</p>
          </div>
          <div className="hero-metrics">
            <div className="metric-card">
              <span>Canal</span>
              <strong>24h</strong>
            </div>
            <div className="metric-card">
              <span>Anexos</span>
              <strong>5 fotos</strong>
            </div>
            <div className="metric-card">
              <span>Fluxo</span>
              <strong>5 status</strong>
            </div>
          </div>
          {isTestMode && (
            <p className="feedback info">
              Modo teste ativo: esta tela esta operando com envio simulado para facilitar a revisao.
            </p>
          )}
          {!firebaseReady && !isTestMode && (
            <p className="feedback error">
              Firebase ainda não foi configurado. Preencha o arquivo de ambiente
              para ativar o envio real.
            </p>
          )}
          {!recaptchaSiteKey && !isTestMode && (
            <p className="feedback warning">
              reCAPTCHA não configurado. Defina VITE_RECAPTCHA_SITE_KEY para
              habilitar protecao completa no MVP.
            </p>
          )}
        </section>

        <section className="card form-card">
          <form onSubmit={handleSubmit} className="demand-form">
            <div className="form-header">
              <h2>Abrir solicitacao</h2>
              <p>Preencha os campos abaixo para registrar sua demanda.</p>
            </div>

            <div className="input-group hidden-honeypot" aria-hidden="true">
              <label htmlFor="website">Não preencha este campo</label>
              <input
                id="website"
                type="text"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                autoComplete="off"
                tabIndex={-1}
              />
            </div>

            <div className="input-group">
              <label htmlFor="voterName">Nome completo</label>
              <input
                id="voterName"
                name="voterName"
                type="text"
                value={formData.voterName}
                onChange={handleFieldChange}
                required
                maxLength={120}
              />
            </div>

            <div className="input-group">
              <label htmlFor="voterPhone">Telefone para contato</label>
              <input
                id="voterPhone"
                name="voterPhone"
                type="tel"
                value={formData.voterPhone}
                onChange={handleFieldChange}
                required
                maxLength={30}
              />
            </div>

            <div className="input-group">
              <label htmlFor="voterAddress">Endereço completo</label>
              <input
                id="voterAddress"
                name="voterAddress"
                type="text"
                value={formData.voterAddress}
                onChange={handleFieldChange}
                required
                maxLength={180}
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Descrição da demanda</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleFieldChange}
                required
                maxLength={1800}
              />
            </div>

            <div className="input-group">
              <label htmlFor="attachments">
                Fotos (ate {MAX_FILES}, maximo de {MAX_FILE_SIZE_MB} MB cada)
              </label>
              <input
                id="attachments"
                name="attachments"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesChange}
              />
              {previewUrls.length > 0 && (
                <div className="preview-grid">
                  {previewUrls.map((url) => (
                    <img key={url} src={url} alt="Preview do anexo" />
                  ))}
                </div>
              )}
            </div>

            <label className="checkbox-line" htmlFor="consent">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={formData.consent}
                onChange={handleFieldChange}
              />
              <span>
                Autorizo o uso dos meus dados para atendimento da solicitacao,
                conforme aviso de privacidade do gabinete.
              </span>
            </label>

            {recaptchaSiteKey ? (
              <div className="captcha-box">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={recaptchaSiteKey}
                  onChange={(token) => setRecaptchaToken(token || '')}
                />
              </div>
            ) : null}

            {feedback.message ? (
              <p className={`feedback ${feedback.type}`}>{feedback.message}</p>
            ) : null}

            <button className="primary-button full" type="submit" disabled={sending}>
              {sending ? 'Enviando demanda...' : 'Enviar demanda'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
