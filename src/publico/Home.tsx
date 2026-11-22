import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, HandCoins, Handshake, Search } from 'lucide-react'
import { api } from '../lib/api'
import { reduzida } from '../lib/cloudinary'
import type { Filtros, ViaturaPublica } from '../types'
import { useSite } from './SiteContext'
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
    <form onSubmit={pesquisar} className="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
      <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-slate-900">Pesquisa de viaturas</h2>
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

export default function Home() {
  const { site } = useSite()
  const [filtros, setFiltros] = useState<Filtros | null>(null)
  const [destaques, setDestaques] = useState<ViaturaPublica[]>([])

  useEffect(() => {
    api.publico.filtros().then(setFiltros).catch(() => undefined)
    api.publico.viaturas().then((v) => setDestaques(v.slice(0, 6))).catch(() => undefined)
  }, [])

  // Banner: a imagem activa da secção «hero» (gerida no admin, via Cloudinary) ou o carro por omissão do projecto.
  const hero = site.imagens.hero?.[0]?.url ?? '/hero-carro.jpg'
  const marcas = site.imagens.marcas ?? []
  const c = site.config

  return (
    <>
      <section className="relative">
        <div className="relative h-[460px] overflow-hidden bg-slate-900 sm:h-[540px]">
          <img src={reduzida(hero, 2000)} alt={site.imagens.hero?.[0]?.titulo ?? 'Viatura em destaque'} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 pb-28 pt-8 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">{c.nome}</p>
            <h1 className="mt-3 max-w-lg text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {c.slogan || 'A sua próxima viatura está aqui.'}
            </h1>
            <Link to="/viaturas" className={`${botaoPub} mt-8 w-fit`}>Ver viaturas <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>

        {marcas.length > 0 && (
          <div className="absolute inset-x-0 bottom-28 hidden sm:block">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4">
              {marcas.map((m) => {
                const img = <img src={reduzida(m.url, 200)} alt={m.titulo ?? 'Marca'} className="h-12 w-auto object-contain opacity-90 transition hover:opacity-100" />
                return m.ligacao ? <a key={m.id} href={m.ligacao}>{img}</a>
                  : <Link key={m.id} to={m.titulo ? `/viaturas?marca=${encodeURIComponent(m.titulo)}` : '/viaturas'}>{img}</Link>
              })}
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto -mt-20 max-w-5xl px-4">
          <Pesquisa filtros={filtros} />
        </div>
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
