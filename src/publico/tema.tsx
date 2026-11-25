import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useSite } from './SiteContext'

/** Tema claro (branco e vermelho) / escuro, partilhado pelo site público e pelo ecrã de login. */
export type Tema = 'claro' | 'escuro'
const CHAVE_TEMA = 'site-tema'

/** Tema escolhido pelo visitante (guardado no navegador); sem escolha, o modo claro. */
function temaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(CHAVE_TEMA)
    if (guardado === 'claro' || guardado === 'escuro') return guardado
  } catch { /* armazenamento indisponível: usa o modo claro */ }
  return 'claro'
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(temaInicial)
  function mudar() {
    const novo: Tema = tema === 'escuro' ? 'claro' : 'escuro'
    setTema(novo)
    try { localStorage.setItem(CHAVE_TEMA, novo) } catch { /* sem armazenamento: vale só nesta visita */ }
  }
  return [tema, mudar]
}

export function BotaoTema({ tema, onMudar }: { tema: Tema; onMudar: () => void }) {
  const proximo = tema === 'escuro' ? 'claro' : 'escuro'
  return (
    <button type="button" onClick={onMudar} aria-label={`Mudar para o modo ${proximo}`} title={`Modo ${proximo}`}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-tinta/15 text-tinta/75 transition hover:border-tinta/40 hover:text-tinta">
      {tema === 'escuro' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  )
}

/** Logótipo da AV Stand Automóvel: versão original no modo claro, texto a branco no modo escuro. */
export function Logotipo({ grande = false }: { grande?: boolean }) {
  const { site } = useSite()
  const nome = site.config.nome || 'AV Stand Automóvel'
  const altura = grande ? 'h-16' : 'h-11'
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label={`${nome} — início`}>
      <img src="/marca/logo-av-claro.png" alt={nome} width={220} height={69} className={`mostrar-claro ${altura} w-auto`} />
      <img src="/marca/logo-av-escuro.png" alt={nome} width={220} height={69} className={`mostrar-escuro ${altura} w-auto`} />
    </Link>
  )
}
