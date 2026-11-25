import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router-dom'
import { Camera, Clock, Mail, MapPin, Menu, MessageCircle, MessagesSquare, Phone, UserRound, X } from 'lucide-react'
import { linkWhatsapp, useSite } from './SiteContext'
import { BotaoTema, Logotipo, useTema } from './tema'

// O lucide-react 1.x já não tem ícones de marcas: usamos ícones genéricos para o Facebook e o Instagram.
const Facebook = MessagesSquare
const Instagram = Camera

const ABAS = [
  { para: '/', rotulo: 'Início', fim: true },
  { para: '/viaturas', rotulo: 'Showroom' },
  { para: '/empresa', rotulo: 'Empresa' },
  { para: '/intermediacao', rotulo: 'Intermediação' },
  { para: '/compramos', rotulo: 'Compramos' },
  { para: '/contactos', rotulo: 'Contactos' },
]

/** Botão fixo «Fale connosco» com WhatsApp, telefone e Facebook (conforme os contactos configurados). */
function FaleConnosco() {
  const { site } = useSite()
  const [aberto, setAberto] = useState(false)
  const c = site.config
  const wa = linkWhatsapp(c.whatsapp, `Olá ${c.nome ?? ''}, gostaria de mais informações.`)
  const opcoes = [
    wa && { href: wa, rotulo: 'WhatsApp', icone: MessageCircle },
    c.telefone && { href: `tel:${c.telefone.replace(/\s/g, '')}`, rotulo: c.telefone, icone: Phone },
    c.facebook && { href: c.facebook, rotulo: 'Facebook', icone: Facebook },
  ].filter(Boolean) as { href: string; rotulo: string; icone: typeof Phone }[]
  if (!opcoes.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {aberto && opcoes.map(({ href, rotulo, icone: I }) => (
        <a key={rotulo} href={href} target="_blank" rel="noreferrer"
          className="vidro flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-tinta shadow-lg transition hover:border-tinta/25">
          <I className="h-4 w-4 text-acento-claro" /> {rotulo}
        </a>
      ))}
      <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}
        className="flex items-center gap-2 rounded-full bg-acento px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-branco shadow-[0_12px_30px_-8px_rgb(224_38_47/0.75)] transition hover:bg-acento-claro">
        {aberto ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />} Fale connosco
      </button>
    </div>
  )
}

export default function LayoutPublico() {
  const { site } = useSite()
  const [menu, setMenu] = useState(false)
  const [tema, mudarTema] = useTema()
  const { pathname } = useLocation()
  const noShowroom = useMatch('/viaturas/:id')
  const c = site.config

  useEffect(() => {
    if (c.nome) document.title = `${c.nome} · Viaturas em Luanda`
  }, [c.nome])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])



  const ligacao = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors after:absolute after:inset-x-3 after:-bottom-[17px] after:h-0.5 after:transition ${
      isActive ? 'text-tinta after:bg-acento' : 'text-tinta/55 after:bg-transparent hover:text-tinta'}`

  return (
    <div className={`tema-${tema} flex min-h-screen flex-col bg-base-950 text-tinta/80 transition-colors duration-300`}>
      <header className="sticky top-0 z-30 border-b border-tinta/[0.06] bg-base-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-8">
          <Logotipo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {ABAS.map((a) => <NavLink key={a.para} to={a.para} end={a.fim} className={ligacao}>{a.rotulo}</NavLink>)}
          </nav>
          <div className="flex items-center gap-2">
            {c.telefone && (
              <a href={`tel:${c.telefone.replace(/\s/g, '')}`} className="hidden items-center gap-2 px-3 text-sm font-semibold text-tinta/70 hover:text-tinta xl:flex">
                <Phone className="h-4 w-4 text-acento-claro" />{c.telefone}
              </a>
            )}
            <BotaoTema tema={tema} onMudar={mudarTema} />
            <Link to="/login" aria-label="Área reservada" title="Área reservada"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-tinta/15 text-tinta/75 transition hover:border-tinta/40 hover:text-tinta">
              <UserRound className="h-[18px] w-[18px]" />
            </Link>
            <button type="button" onClick={() => setMenu((v) => !v)} aria-label="Menu" aria-expanded={menu}
              className="flex h-10 w-10 items-center justify-center rounded-full text-tinta/80 hover:bg-tinta/5 lg:hidden">
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-tinta/[0.06] px-4 py-3 lg:hidden" aria-label="Principal">
            {ABAS.map((a) => (
              <NavLink key={a.para} to={a.para} end={a.fim} onClick={() => setMenu(false)}
                className={({ isActive }) => `flex items-center justify-between border-b border-tinta/[0.04] px-2 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.16em] last:border-0 ${isActive ? 'text-tinta' : 'text-tinta/55'}`}>
                {({ isActive }) => <>{a.rotulo}{isActive && <span className="h-1.5 w-1.5 rounded-full bg-acento" />}</>}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-tinta/[0.06] bg-base-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <Logotipo grande />
            {c.slogan && <p className="mt-6 max-w-sm text-sm leading-relaxed text-tinta/50">{c.slogan}</p>}
            <div className="mt-6 flex gap-2">
              {c.facebook && <a href={c.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-tinta/10 text-tinta/60 hover:border-tinta/30 hover:text-tinta"><Facebook className="h-4 w-4" /></a>}
              {c.instagram && <a href={c.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-tinta/10 text-tinta/60 hover:border-tinta/30 hover:text-tinta"><Instagram className="h-4 w-4" /></a>}
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <p className="mb-5 font-display text-xs font-semibold uppercase tracking-[0.28em] text-tinta">Contactos</p>
            {c.morada && <p className="flex gap-3 text-tinta/55"><MapPin className="h-4 w-4 shrink-0 text-acento-claro" />{c.morada}</p>}
            {c.telefone && <p className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-acento-claro" /><a href={`tel:${c.telefone.replace(/\s/g, '')}`} className="text-tinta/55 hover:text-tinta">{c.telefone}</a></p>}
            {c.email && <p className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-acento-claro" /><a href={`mailto:${c.email}`} className="text-tinta/55 hover:text-tinta">{c.email}</a></p>}
            {c.horario && <p className="flex gap-3 text-tinta/55"><Clock className="h-4 w-4 shrink-0 text-acento-claro" />{c.horario}</p>}
          </div>
          <div className="text-sm">
            <p className="mb-5 font-display text-xs font-semibold uppercase tracking-[0.28em] text-tinta">Navegação</p>
            <div className="grid grid-cols-2 gap-3">
              {ABAS.map((a) => <Link key={a.para} to={a.para} className="text-tinta/55 hover:text-tinta">{a.rotulo}</Link>)}
            </div>
          </div>
        </div>
        <div className="border-t border-tinta/[0.06]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-tinta/35 lg:px-8">
            <p>© {new Date().getFullYear()} {c.nome || 'Stand Automóvel'} · Luanda, Angola</p>
            <Link to="/login" className="hover:text-tinta/70">Área reservada</Link>
          </div>
        </div>
      </footer>

      {!noShowroom && <FaleConnosco />}
    </div>
  )
}
