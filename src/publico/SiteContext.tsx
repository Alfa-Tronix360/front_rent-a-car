import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { SitePublico } from '../types'

const vazio: SitePublico = { config: {}, imagens: {} }
const Contexto = createContext<{ site: SitePublico; carregado: boolean }>({ site: vazio, carregado: false })

/** Textos, contactos e imagens do site (geridos no admin → Site público), carregados uma vez. */
export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SitePublico>(vazio)
  const [carregado, setCarregado] = useState(false)
  useEffect(() => {
    api.publico.site().then(setSite).catch(() => undefined).finally(() => setCarregado(true))
  }, [])
  return <Contexto.Provider value={{ site, carregado }}>{children}</Contexto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSite = () => useContext(Contexto)

/** Ligação de WhatsApp a partir do número configurado (só dígitos). */
// eslint-disable-next-line react-refresh/only-export-components
export function linkWhatsapp(numero?: string, texto?: string) {
  const n = (numero ?? '').replace(/\D/g, '')
  if (!n) return ''
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
}
