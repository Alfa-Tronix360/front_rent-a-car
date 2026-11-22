import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Camera, Clock, Mail, MapPin, Menu, MessageCircle, MessagesSquare, Phone, X } from 'lucide-react'

// O lucide-react 1.x já não tem ícones de marcas: usamos ícones genéricos para o Facebook e o Instagram.
const Facebook = MessagesSquare
const Instagram = Camera
import { linkWhatsapp, useSite } from './SiteContext'

const ABAS = [
  { para: '/', rotulo: 'Home', fim: true },
  { para: '/empresa', rotulo: 'Empresa' },
  { para: '/viaturas', rotulo: 'Viaturas' },
  { para: '/intermediacao', rotulo: 'Intermediação' },
  { para: '/compramos', rotulo: 'Compramos' },
  { para: '/contactos', rotulo: 'Contactos' },
]

function Marca({ claro = false }: { claro?: boolean }) {
  const { site } = useSite()
  const nome = site.config.nome || 'Stand Automóvel'
  const [primeira, ...resto] = nome.split(' ')
  return (
    <Link to="/" className="flex items-baseline gap-1.5 leading-none">
      <span className={`text-2xl font-black tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>{primeira}</span>
      <span className={`text-sm font-semibold uppercase tracking-[0.18em] ${claro ? 'text-sky-300' : 'text-sky-700'}`}>{resto.join(' ')}</span>
    </Link>
  )
}

/** Botão fixo «Fale connosco» com WhatsApp, telefone e Facebook (conforme os contactos configurados). */
function FaleConnosco() {
  const { site } = useSite()
  const [aberto, setAberto] = useState(false)
  const c = site.config
  const wa = linkWhatsapp(c.whatsapp, `Olá ${c.nome ?? ''}, gostaria de mais informações.`)
  const opcoes = [
    wa && { href: wa, rotulo: 'WhatsApp', icone: MessageCircle, cor: 'bg-emerald-600' },
    c.telefone && { href: `tel:${c.telefone.replace(/\s/g, '')}`, rotulo: c.telefone, icone: Phone, cor: 'bg-sky-700' },
    c.facebook && { href: c.facebook, rotulo: 'Facebook', icone: Facebook, cor: 'bg-blue-700' },
  ].filter(Boolean) as { href: string; rotulo: string; icone: typeof Phone; cor: string }[]
  if (!opcoes.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {aberto && opcoes.map(({ href, rotulo, icone: I, cor }) => (
        <a key={rotulo} href={href} target="_blank" rel="noreferrer"
          className={`flex items-center gap-2 rounded-full ${cor} px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:opacity-90`}>
          <I className="h-4 w-4" /> {rotulo}
        </a>
      ))}
      <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl ring-4 ring-white/70 hover:bg-slate-800">
        {aberto ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />} Fale connosco
      </button>
    </div>
  )
}

export default function LayoutPublico() {
  const { site } = useSite()
  const [menu, setMenu] = useState(false)
  const c = site.config
  useEffect(() => {
    if (c.nome) document.title = `${c.nome} · Viaturas em Luanda`
  }, [c.nome])
  const ligacao = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
      isActive ? 'text-sky-700' : 'text-slate-600 hover:text-slate-900'}`

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Marca />
          <nav className="hidden items-center gap-1 lg:flex">
            {ABAS.map((a) => <NavLink key={a.para} to={a.para} end={a.fim} className={ligacao}>{a.rotulo}</NavLink>)}
          </nav>
          <button type="button" onClick={() => setMenu((v) => !v)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Menu">
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menu && (
          <nav className="border-t border-slate-200 px-4 py-2 lg:hidden">
            {ABAS.map((a) => (
              <NavLink key={a.para} to={a.para} end={a.fim} onClick={() => setMenu(false)}
                className={({ isActive }) => `block rounded-md px-3 py-2.5 text-sm font-semibold uppercase ${isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-700'}`}>
                {a.rotulo}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3 lg:px-8">
          <div>
            <Marca claro />
            {c.slogan && <p className="mt-4 max-w-xs text-sm text-slate-400">{c.slogan}</p>}
          </div>
          <div className="space-y-2.5 text-sm">
            <p className="mb-3 font-semibold uppercase tracking-wide text-white">Contactos</p>
            {c.morada && <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-sky-400" />{c.morada}</p>}
            {c.telefone && <p className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-sky-400" /><a href={`tel:${c.telefone.replace(/\s/g, '')}`} className="hover:text-white">{c.telefone}</a></p>}
            {c.email && <p className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-sky-400" /><a href={`mailto:${c.email}`} className="hover:text-white">{c.email}</a></p>}
            {c.horario && <p className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-sky-400" />{c.horario}</p>}
          </div>
          <div className="text-sm">
            <p className="mb-3 font-semibold uppercase tracking-wide text-white">Navegação</p>
            <div className="grid grid-cols-2 gap-2">
              {ABAS.map((a) => <Link key={a.para} to={a.para} className="hover:text-white">{a.rotulo}</Link>)}
            </div>
            <div className="mt-5 flex gap-3">
              {c.facebook && <a href={c.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Facebook className="h-4 w-4" /></a>}
              {c.instagram && <a href={c.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Instagram className="h-4 w-4" /></a>}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 lg:px-8">
            <p>© {new Date().getFullYear()} {c.nome || 'Stand Automóvel'} · Luanda, Angola</p>
            <Link to="/login" className="hover:text-slate-300">Área reservada</Link>
          </div>
        </div>
      </footer>

      <FaleConnosco />
    </div>
  )
}
