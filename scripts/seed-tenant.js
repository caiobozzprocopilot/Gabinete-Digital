/**
 * Script para criar ou atualizar um gabinete no Firestore + fazer upload das
 * fotos diretamente para o Firebase Storage.
 *
 * Pré-requisito:
 *   1. Firebase Console → Project Settings → Service accounts
 *      → Generate new private key → salve como "service-account.json" na raiz
 *      (já está no .gitignore)
 *
 * Uso:
 *   node scripts/seed-tenant.js
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { randomUUID } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { extname, resolve } from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── CONFIGURAÇÃO DO GABINETE ─────────────────────────────────────────────
const TENANT = {
  slug:         'ortigueira',        // ← identificador único na URL
  cityName:     'Ortigueira',        // ← nome da cidade
  state:        'PR',                // ← sigla do estado (2 letras)
  vereadorName: 'Nome do Vereador',  // ← nome completo do vereador

  // Caminhos para arquivos locais (deixe '' para pular o upload)
  formPhotoFile:  '',  // ex: 'C:/Users/lamog/fotos/formulario.jpg'
  loginPhotoFile: '',  // ex: 'C:/Users/lamog/fotos/login.jpg'
  heroPhotoFile:  '',  // ex: 'C:/Users/lamog/fotos/hero.jpg'
}
// ─────────────────────────────────────────────────────────────────────────

const serviceAccountPath = resolve(__dirname, '../service-account.json')

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
} catch {
  console.error('❌  service-account.json não encontrado.')
  console.error('   Baixe em: Firebase Console → Project Settings → Service accounts')
  process.exit(1)
}

const BUCKET_NAME = `${serviceAccount.project_id}.firebasestorage.app`

initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET_NAME })

const db     = getFirestore()
const bucket = getStorage().bucket()

/**
 * Faz upload de um arquivo local para o Firebase Storage e retorna a URL
 * permanente de download (mesmo formato gerado pelo SDK do cliente).
 */
async function uploadPhoto(localPath, remoteName) {
  if (!localPath) return ''

  const abs = resolve(localPath)
  if (!existsSync(abs)) {
    console.warn(`  ⚠  Arquivo não encontrado, pulando: ${abs}`)
    return ''
  }

  const ext        = extname(abs)                                          // ex: '.jpg'
  const remotePath = `tenant-photos/${TENANT.slug}/${remoteName}${ext}`
  const token      = randomUUID()

  await bucket.upload(abs, {
    destination: remotePath,
    metadata: {
      contentType: `image/${ext.slice(1).replace('jpg', 'jpeg')}`,
      cacheControl: 'public,max-age=31536000',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  })

  // Constrói a URL permanente (mesmo formato do getDownloadURL() no cliente)
  const encoded = remotePath.replace(/\//g, '%2F')
  const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encoded}?alt=media&token=${token}`

  console.log(`  ✓ ${remoteName}: ${url}`)
  return url
}

async function main() {
  console.log(`\n⏳  Processando tenant "${TENANT.slug}"...\n`)

  const [formPhotoUrl, loginPhotoUrl, heroPhotoUrl] = await Promise.all([
    uploadPhoto(TENANT.formPhotoFile,  'form'),
    uploadPhoto(TENANT.loginPhotoFile, 'login'),
    uploadPhoto(TENANT.heroPhotoFile,  'hero'),
  ])

  await db.collection('tenants').doc(TENANT.slug).set(
    {
      tenantSlug:    TENANT.slug,
      cityName:      TENANT.cityName,
      state:         TENANT.state,
      vereadorName:  TENANT.vereadorName,
      ...(formPhotoUrl  && { formPhotoUrl }),
      ...(loginPhotoUrl && { loginPhotoUrl }),
      ...(heroPhotoUrl  && { heroPhotoUrl }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  const host = 'https://gabinete-digital-vereador.web.app'
  console.log(`\n✅  Tenant "${TENANT.slug}" salvo!\n`)
  console.log(`   📋  Formulário : ${host}/atendimento/${TENANT.slug}`)
  console.log(`   🏠  Landing    : ${host}/vereador/${TENANT.slug}`)
  console.log(`   🔐  Login      : ${host}/painel/login?gabinete=${TENANT.slug}\n`)

  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Erro:', err.message)
  process.exit(1)
})
