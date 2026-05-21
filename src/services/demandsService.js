import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
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

export function subscribeDemands(onData, onError) {
  ensureFirebase()

  const q = query(collection(db, DEMANDS_COLLECTION), orderBy('createdAt', 'desc'))

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
