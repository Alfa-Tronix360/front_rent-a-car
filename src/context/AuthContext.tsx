import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  api,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../lib/api'
import type { Usuario } from '../types'

interface AuthContextValue {
  usuario: Usuario | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(getStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const perfil = await api.auth.profile()
        if (ativo) {
          setUsuario(perfil)
          setStoredUser(perfil)
        }
      } catch {
        if (ativo) {
          setUsuario(null)
          setStoredUser(null)
          setToken(null)
        }
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  async function login(email: string, password: string) {
    const resposta = await api.auth.login(email, password)
    setToken(resposta.access_token)
    setStoredUser(resposta.usuario)
    setUsuario(resposta.usuario)
  }

  function logout() {
    setToken(null)
    setStoredUser(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return contexto
}
