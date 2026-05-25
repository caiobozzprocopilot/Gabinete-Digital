import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, firebaseReady } from '../firebase/config'

const TENANTS_COLLECTION = 'tenants'

function ensureFirebase() {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não configurado.')
  }
}

export async function slugExists(slug) {
  ensureFirebase()
  const ref = doc(db, TENANTS_COLLECTION, slug)
  const snapshot = await getDoc(ref)
  return snapshot.exists()
}

export async function createTenant({ slug, cityName, state, vereadorName, formPhotoUrl, loginPhotoUrl, heroPhotoUrl }) {
  ensureFirebase()
  await setDoc(doc(db, TENANTS_COLLECTION, slug), {
    tenantSlug: slug,
    cityName,
    state: state || '',
    vereadorName,
    formPhotoUrl: formPhotoUrl || '',
    loginPhotoUrl: loginPhotoUrl || '',
    heroPhotoUrl: heroPhotoUrl || '',
    createdAt: serverTimestamp(),
  })
}

export async function updateTenant(slug, fields) {
  ensureFirebase()
  await setDoc(doc(db, TENANTS_COLLECTION, slug), fields, { merge: true })
}

export async function getTenant(slug) {
  if (!firebaseReady || !db || !slug) return null
  try {
    const ref = doc(db, TENANTS_COLLECTION, slug)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return null
    return snapshot.data()
  } catch {
    return null
  }
}

export async function listAllTenants() {
  ensureFirebase()
  const snapshot = await getDocs(collection(db, TENANTS_COLLECTION))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}
