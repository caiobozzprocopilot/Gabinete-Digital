import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, firebaseReady } from '../firebase/config'
import { AuthContext } from './auth-context'

function mapAuthError(error) {
  const code = error?.code || ''

  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Email ou senha invalidos.'
  }

  if (code.includes('too-many-requests')) {
    return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
  }

  if (code.includes('network-request-failed')) {
    return 'Falha de rede ao autenticar. Verifique sua conexão.'
  }

  return 'Não foi possível autenticar agora. Tente novamente.'
}

async function fetchProfile(user) {
  if (!db || !user) {
    return null
  }

  const profileRef = doc(db, 'adminUsers', user.uid)
  const profileSnapshot = await getDoc(profileRef)

  if (!profileSnapshot.exists()) {
    return {
      role: 'operator',
      displayName: user.email,
      email: user.email,
    }
  }

  return {
    role: 'operator',
    displayName: user.email,
    email: user.email,
    ...profileSnapshot.data(),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(firebaseReady && Boolean(auth))

  useEffect(() => {
    if (!firebaseReady || !auth) {
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const nextProfile = await fetchProfile(nextUser)
        setProfile(nextProfile)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const login = useCallback(async ({ email, password }) => {
    if (!auth) {
      throw new Error('Firebase Auth não configurado. Confira as variáveis de ambiente.')
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw new Error(mapAuthError(error), { cause: error })
    }
  }, [])

  const logout = useCallback(async () => {
    if (!auth) {
      return
    }

    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      userProfile: profile,
      loading,
      login,
      logout,
      firebaseReady,
    }),
    [login, logout, profile, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
