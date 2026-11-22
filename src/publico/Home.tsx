import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, HandCoins, Handshake, MessageCircle, Search } from 'lucide-react'
import { api } from '../lib/api'
import { reduzida } from '../lib/cloudinary'
import type { Filtros, ViaturaPublica } from '../types'
import { linkWhatsapp, useSite } from './SiteContext'
import { CartaoViatura, botaoPub } from './componentes'

const selectPesquisa =
  'w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20'

/** Caixa «Pesquisa de viaturas»: marca → modelos dessa marca → combustível. */
export function Pesquisa({ filtros, inicial = {} }: { filtros: Filtros | null; inicial?: Record<string, string> }) {
  const navigate = useNavigate()
  const [marca, setMarca] = useState(inicial.marca ?? '')
  const [modelo, setModelo] = useState(inicial.modelo ?? '')
  const [combustivel, setCombustivel] = useState(inicial.combustivel ?? '')
  const modelos = marca ? filtros?.modelos[marca] ?? [] : Object.values(filtros?.modelos ?? {}).flat().sort()

  function pesquisar(e: FormEvent) {
    e.preventDefault()
    const qs = new URLSearchParams(Object.entries({ marca, modelo, combustivel }).filter(([, v]) => v)).toString()
    navigate(`/viaturas${qs ? `?${qs}` : ''}`)
  }

  return (
    <form onSubmit={pesquisar} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Filtrar por</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select aria-label="Marca" value={marca} onChange={(e) => { setMarca(e.target.value); setModelo('') }} className={selectPesquisa}>
          <option value="">Marca</option>{filtros?.marcas.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select aria-label="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} className={selectPesquisa}>
          <option value="">Modelos</option>{modelos.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select aria-label="Combustível" value={combustivel} onChange={(e) => setCombustivel(e.target.value)} className={selectPesquisa}>
          <option value="">Combustível</option>{filtros?.combustiveis.map((m) => <option key={m}>{m}</option>)}
        </select>
        <button type="submit" className={botaoPub}><Search className="h-4 w-4" /> Pesquisar</button>
      </div>
    </form>
  )
}

/** Imagens do banner a passar devagar (com várias imagens activas no admin, alternam a cada 7 segundos). */
function Banner({ imagens }: { imagens: { url: string; titulo?: string | null }[] }) {
  const [actual, setActual] = useState(0)
  useEffect(() => {
    if (imagens.length < 2) return
    const t = window.setInterval(() => setActual((n) => (n + 1) % imagens.length), 7000)
    return () => window.clearInterval(t)
  }, [imagens.length])
  return (
    <div className="relative h-[460px] overflow-hidden bg-slate-900 sm:h-[540px]">
      {imagens.map((img, n) => (
        <img key={img.url} src={reduzida(img.url, 2000)} alt={img.titulo ?? 'Viatura em destaque'}
          className={`banner-movimento absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${n === actual ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      {imagens.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {imagens.map((img, n) => (
            <button key={img.url} type="button" aria-label={`Imagem ${n + 1}`} onClick={() => setActual(n)}
              className={`h-1.5 rounded-full transition-all ${n === actual ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { site } = useSite()
  const [destaques, setDestaques] = useState<ViaturaPublica[]>([])
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    api.publico.viaturas().then((v) => { setDestaques(v.slice(0, 6)); setTotal(v.length) }).catch(() => undefined)
  }, [])

  // Banner: as imagens activas da secção «hero» (geridas no admin, via Cloudinary) ou o carro por omissão do projecto.
  const hero = site.imagens.hero?.length ? site.imagens.hero : [{ url: '/hero-carro.jpg', titulo: 'Viatura em destaque' }]
  const marcas = site.imagens.marcas ?? []
  const c = site.config
  const wa = linkWhatsapp(c.whatsapp, `Olá ${c.nome ?? ''}, gostaria de mais informações.`)

  return (
    <>
      {/* Banner de largura total, só com a imagem (os textos ficam por baixo) */}
      <section className="overflow-hidden">
        <Banner imagens={hero} />
      </section>

      <section className="bg-white">
        <div className="banner-entrada mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-4 py-10 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{c.nome}</p>
            <h1 className="mt-2 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
              {c.slogan || 'A sua próxima viatura está aqui.'}
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Viaturas revistas e com documentação tratada, em Luanda. Também compramos a sua viatura ou vendemo-la por si.
            </p>
            {total !== null && total > 0 && (
              <p className="mt-3 text-sm text-slate-500"><b className="text-slate-900">{total}</b> viatura(s) disponível(is) neste momento</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/viaturas" className={botaoPub}><Search className="h-4 w-4" /> Ver viaturas</Link>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-600 hover:text-emerald-700">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {marcas.length > 0 && (
          <div className="border-y border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 lg:px-8">
              {marcas.map((m) => {
                const img = <img src={reduzida(m.url, 200)} alt={m.titulo ?? 'Marca'} className="h-9 w-auto object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0" />
                return m.ligacao ? <a key={m.id} href={m.ligacao}>{img}</a>
                  : <Link key={m.id} to={m.titulo ? `/viaturas?marca=${encodeURIComponent(m.titulo)}` : '/viaturas'}>{img}</Link>
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Em stock</p>
            <h2 className="text-3xl font-bold text-slate-900">Viaturas disponíveis</h2>
          </div>
          <Link to="/viaturas" className="flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline">Ver todas <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {destaques.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{destaques.map((v) => <CartaoViatura key={v.id} v={v} />)}</div>
        ) : <p className="text-slate-500">De momento não há viaturas publicadas. Contacte-nos para saber o que vai chegar.</p>}
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-3 lg:px-8">
          {[
            { i: BadgeCheck, t: 'Viaturas revistas', d: 'Cada viatura é preparada e verificada antes da venda.', to: '/empresa' },
            { i: Handshake, t: 'Intermediação', d: 'Vendemos a sua viatura por si, do anúncio à entrega.', to: '/intermediacao' },
            { i: HandCoins, t: 'Compramos o seu carro', d: 'Proposta rápida e sem compromisso.', to: '/compramos' },
          ].map(({ i: I, t, d, to }) => (
            <Link key={t} to={to} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
              <I className="h-8 w-8 text-sky-700" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
