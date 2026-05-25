import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, firebaseReady } from '../firebase/config'

const DEMANDS_COLLECTION = 'demands'

function ensureFirebase() {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não configurado. Confira as variáveis de ambiente.')
  }
}

export async function submitDemand(demandData) {
  ensureFirebase()

  const payload = {
    ...demandData,
    status: 'Nova',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    statusHistory: [
      {
        status: 'Nova',
        changedAt: new Date().toISOString(),
        changedBy: 'eleitor',
      },
    ],
  }

  const docRef = await addDoc(collection(db, DEMANDS_COLLECTION), payload)
  return docRef.id
}

export function subscribeDemands(tenantSlug, onData, onError) {
  ensureFirebase()

  const constraints = tenantSlug
    ? [where('tenantSlug', '==', tenantSlug), orderBy('createdAt', 'desc')]
    : [orderBy('createdAt', 'desc')]

  const q = query(collection(db, DEMANDS_COLLECTION), ...constraints)

  return onSnapshot(
    q,
    (snapshot) => {
      const demands = snapshot.docs.map((item) => {
        const data = item.data()

        return {
          id: item.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() ?? null,
          updatedAt: data.updatedAt?.toDate?.() ?? null,
        }
      })

      onData(demands)
    },
    onError,
  )
}

export async function updateDemandStatus({ demandId, status, changedBy }) {
  ensureFirebase()

  const demandRef = doc(db, DEMANDS_COLLECTION, demandId)
  await updateDoc(demandRef, {
    status,
    updatedAt: serverTimestamp(),
    statusHistory: arrayUnion({
      status,
      changedAt: new Date().toISOString(),
      changedBy,
    }),
  })
}

// Busca demandas pelo CPF ou telefone do eleitor dentro de um gabinete
export async function queryDemandsByVoter(tenantSlug, { cpf, phone }) {
  ensureFirebase()
  const base = collection(db, DEMANDS_COLLECTION)
  const field = cpf ? 'voterCpf' : 'voterPhone'
  const value = cpf || phone
  const q = query(base, where('tenantSlug', '==', tenantSlug), where(field, '==', value))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.() ?? null }
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
