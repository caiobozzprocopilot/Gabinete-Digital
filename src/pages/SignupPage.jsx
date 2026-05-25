import { useEffect, useRef, useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Building2, Link as LinkIcon, Lock, Mail, MapPin, Upload, User } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, firebaseReady, storage } from '../firebase/config'
import { useAuth } from '../context/useAuth'
import { slugExists } from '../services/tenantsService'

function toSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapAuthError(error) {
  const code = error?.code || ''
  if (code.includes('email-already-in-use')) return 'Este e-mail já está cadastrado.'
  if (code.includes('weak-password')) return 'Senha fraca. Use pelo menos 8 caracteres.'
  if (code.includes('invalid-email')) return 'E-mail inválido.'
  if (code.includes('network-request-failed')) return 'Falha de rede. Verifique sua conexão.'
  return error?.message || 'Erro ao criar conta. Tente novamente.'
}

async function uploadTenantPhoto(slug, slot, file) {
  if (!file || !storage) return ''
  const photoRef = storageRef(storage, `tenant-photos/${slug}/${slot}`)
  await uploadBytes(photoRef, file)
  return getDownloadURL(photoRef)
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const SIGNUP_KEY = import.meta.env.VITE_SIGNUP_KEY
  const keyValid = SIGNUP_KEY && searchParams.get('key') === SIGNUP_KEY

  const [form, setForm] = useState({
    vereadorName: '',
    cityName: '',
    state: '',
    slug: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState({ hero: null, form: null, login: null })
  const [photoPreviews, setPhotoPreviews] = useState({ hero: null, form: null, login: null })
  const slugTimerRef = useRef(null)

  useEffect(() => {
    if (!authLoading && user) navigate('/painel', { replace: true })
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (slugEdited) return
    const combined = `${form.vereadorName} ${form.cityName}`.trim()
    setForm((prev) => ({ ...prev, slug: toSlug(combined) }))
  }, [form.vereadorName, form.cityName, slugEdited])

  useEffect(() => {
    const slug = form.slug
    if (!slug) { setSlugStatus('idle'); return }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) || slug.length < 3) {
      setSlugStatus('invalid')
      return
    }
    setSlugStatus('checking')
    clearTimeout(slugTimerRef.current)
    slugTimerRef.current = setTimeout(async () => {
      try {
        const taken = await slugExists(slug)
        setSlugStatus(taken ? 'taken' : 'available')
      } catch {
        setSlugStatus('idle')
      }
    }, 600)
    return () => clearTimeout(slugTimerRef.current)
  }, [form.slug])

  function handleChange(event) {
    const { name, value } = event.target
    if (name === 'slug') setSlugEdited(true)
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handlePhotoChange(slot, event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotos((prev) => ({ ...prev, [slot]: file }))
    setPhotoPreviews((prev) => ({ ...prev, [slot]: URL.createObjectURL(file) }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!firebaseReady) {
      setError('Firebase não configurado. Verifique o arquivo .env.local.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (slugStatus !== 'available') {
      setError('Escolha um slug disponível e válido antes de continuar.')
      return
    }

    try {
      setSubmitting(true)

      const taken = await slugExists(form.slug)
      if (taken) {
        setError('Este slug foi escolhido por outro gabinete agora mesmo. Tente outro.')
        setSlugStatus('taken')
        return
      }

      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const uid = credential.user.uid

      await updateProfile(credential.user, { displayName: form.vereadorName })

      await setDoc(doc(db, 'adminUsers', uid), {
        role: 'admin',
        displayName: form.vereadorName,
        email: form.email,
        tenantSlug: form.slug,
        createdAt: new Date().toISOString(),
      })

      const [heroPhotoUrl, formPhotoUrl, loginPhotoUrl] = await Promise.all([
        uploadTenantPhoto(form.slug, 'hero',  photos.hero),
        uploadTenantPhoto(form.slug, 'form',  photos.form),
        uploadTenantPhoto(form.slug, 'login', photos.login),
      ])

      const baseUrl = 'https://gabinete-digital-vereador.web.app'
      await setDoc(doc(db, 'tenants', form.slug), {
        tenantSlug: form.slug,
        cityName: form.cityName,
        state: form.state.trim(),
        vereadorName: form.vereadorName,
        formPhotoUrl,
        loginPhotoUrl,
        heroPhotoUrl,
        links: {
          form:    `${baseUrl}/atendimento/${form.slug}`,
          landing: `${baseUrl}/vereador/${form.slug}`,
          login:   `${baseUrl}/painel/login?gabinete=${form.slug}`,
        },
        createdAt: new Date().toISOString(),
      })

      navigate('/painel', { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const slugHelp = {
    idle: null,
    invalid: { text: 'Use apenas letras minúsculas, números e hífens (mín. 3 caracteres).', color: 'text-red-500' },
    checking: { text: 'Verificando disponibilidade...', color: 'text-slate-400' },
    available: { text: '✓ Slug disponível', color: 'text-emerald-600' },
    taken: { text: 'Este slug já está em uso. Escolha outro.', color: 'text-red-500' },
  }[slugStatus]

  if (!keyValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-200 mx-auto mb-4">
            <Building2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">Página não encontrada.</p>
          <Link to="/" className="text-xs text-brand-700 hover:underline mt-2 inline-block">Voltar ao início</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-700">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-slate-900 font-semibold text-base">Gabinete Digital</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-1">Criar seu gabinete</h1>
          <p className="text-sm text-slate-500 mb-8">Configure o canal de atendimento em minutos.</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="vereadorName">Nome do vereador</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input id="vereadorName" name="vereadorName" type="text" required maxLength={80}
                  value={form.vereadorName} onChange={handleChange} placeholder="Nome completo"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-600 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="cityName">Município</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input id="cityName" name="cityName" type="text" required maxLength={80}
                  value={form.cityName} onChange={handleChange} placeholder="Nome da cidade"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-600 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="state">Estado</label>
              <input id="state" name="state" type="text" required maxLength={2} minLength={2}
                value={form.state} onChange={handleChange} placeholder="PR"
                className="w-28 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-600 transition-colors uppercase" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="slug">
                Slug do gabinete
                <span className="ml-1 font-normal text-slate-400">(identificador único na URL)</span>
              </label>
              <div className="relative">
                <LinkIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input id="slug" name="slug" type="text" required maxLength={60}
                  value={form.slug} onChange={handleChange} placeholder="joao-silva-corbelia"
                  className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none transition-colors ${
                    slugStatus === 'available' ? 'border-emerald-400 focus:border-emerald-500'
                    : slugStatus === 'taken' || slugStatus === 'invalid' ? 'border-red-300 focus:border-red-400'
                    : 'border-slate-200 focus:border-brand-600'
                  }`} />
              </div>
              {slugHelp && <p className={`text-xs mt-1.5 ${slugHelp.color}`}>{slugHelp.text}</p>}
              {form.slug && slugStatus === 'available' && (
                <p className="text-xs text-slate-400 mt-1 font-mono truncate">
                  gabinete-digital-vereador.web.app/atendimento/{form.slug}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">
                Fotos do sistema
                <span className="ml-1 font-normal text-slate-400 italic">— opcional, pode adicionar depois</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { slot: 'hero',  label: 'Capa da página pública' },
                  { slot: 'form',  label: 'Foto do formulário' },
                  { slot: 'login', label: 'Foto do login' },
                ].map(({ slot, label }) => (
                  <div key={slot}>
                    <input
                      id={`photo-${slot}`}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handlePhotoChange(slot, e)}
                    />
                    <label
                      htmlFor={`photo-${slot}`}
                      className="cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50 hover:bg-brand-50 transition-colors overflow-hidden"
                      style={{ height: 80 }}>
                      {photoPreviews[slot] ? (
                        <img src={photoPreviews[slot]} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 p-2">
                          <Upload size={16} className="text-slate-300" />
                          <span className="text-[10px] text-slate-400 text-center leading-tight">{label}</span>
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="email">E-mail de acesso</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input id="email" name="email" type="email" required
                  value={form.email} onChange={handleChange} placeholder="seu@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-600 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="password">Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input id="password" name="password" type="password" required minLength={8}
                    value={form.password} onChange={handleChange} placeholder="Mín. 8 caracteres"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-600 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="confirmPassword">Confirmar</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input id="confirmPassword" name="confirmPassword" type="password" required
                    value={form.confirmPassword} onChange={handleChange} placeholder="Repita a senha"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-600 transition-colors" />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-700 border border-red-200">{error}</p>
            )}

            <button type="submit" disabled={submitting || slugStatus !== 'available'}
              className="w-full py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg mt-2">
              {submitting ? 'Criando gabinete...' : 'Criar meu gabinete'}
            </button>
          </form>

          <p className="text-xs text-center text-slate-400 mt-6">
            Já tem conta?{' '}
            <Link to="/painel/login" className="text-brand-700 hover:underline font-medium">Entrar no painel</Link>
          </p>
        </div>

        <p className="text-xs text-center text-slate-400 mt-4">
          Ao criar sua conta, você concorda com os termos de uso do serviço.
        </p>
      </div>
    </div>
  )
}
