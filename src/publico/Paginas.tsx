import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CarFront, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { api } from '../lib/api'
import { reduzida } from '../lib/cloudinary'
import { fmtKz } from '../lib/format'
import type { Filtros, ViaturaPublica } from '../types'
import { linkWhatsapp, useSite } from './SiteContext'
import { Cabecalho, CartaoViatura, FormContacto } from './componentes'
import { Pesquisa } from './Home'

const imagemDe = (imagens: Record<string, { url: string }[]>, secao: string) => imagens[secao]?.[0]?.url

/** Galeria de imagens de uma secção (ex.: fotografias do stand na página Empresa). */
function Galeria({ secao }: { secao: string }) {
  const { site } = useSite()
  const imgs = (site.imagens[secao] ?? []).slice(1)
  if (!imgs.length) return null
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {imgs.map((i) => <img key={i.id} src={reduzida(i.url, 700)} alt={i.titulo ?? ''} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />)}
    </div>
  )
}

export function Empresa() {
  const { site } = useSite()
  return (
    <>
      <Cabecalho titulo="Empresa" texto={site.config.texto_empresa} imagem={imagemDe(site.imagens, 'empresa')} />
      <section className="mx-auto max-w-7xl space-y-10 px-4 py-14 lg:px-8">
        <Galeria secao="empresa" />
        <div className="grid gap-6 md:grid-cols-3">
          {[['Importação', 'Trazemos viaturas seleccionadas e tratamos do desalfandegamento.'],
            ['Preparação', 'Revisão mecânica, limpeza e documentação antes da entrega.'],
            ['Transparência', 'Preço claro e todos os documentos da viatura.']].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 p-6"><h3 className="font-bold text-slate-900">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>
          ))}
        </div>
        <Link to="/viaturas" className="inline-flex font-semibold text-sky-700 hover:underline">Ver as viaturas disponíveis →</Link>
      </section>
    </>
  )
}

export function ViaturasPublico() {
  const [sp] = useSearchParams()
  const [filtros, setFiltros] = useState<Filtros | null>(null)
  const [lista, setLista] = useState<ViaturaPublica[] | null>(null)
  const pedido = { marca: sp.get('marca') ?? '', modelo: sp.get('modelo') ?? '', combustivel: sp.get('combustivel') ?? '' }
  const chave = sp.toString()

  useEffect(() => {
    api.publico.filtros().then(setFiltros).catch(() => undefined)
  }, [])
  useEffect(() => {
    const p = new URLSearchParams(chave)
    api.publico.viaturas({ marca: p.get('marca') ?? '', modelo: p.get('modelo') ?? '', combustivel: p.get('combustivel') ?? '' })
      .then(setLista).catch(() => setLista([]))
  }, [chave])

  const activos = Object.values(pedido).filter(Boolean)
  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">Viaturas à venda</h1>
          <Pesquisa key={chave} filtros={filtros} inicial={pedido} />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {lista ? `${lista.length} viatura(s)` : ''}{activos.length ? ` · ${activos.join(' · ')}` : ''}
          </p>
          {activos.length > 0 && <Link to="/viaturas" className="text-sm font-semibold text-sky-700 hover:underline">Limpar pesquisa</Link>}
        </div>
        {lista === null ? <p className="text-slate-500">A carregar...</p>
          : lista.length === 0 ? <p className="text-slate-500">Não encontrámos viaturas com estes critérios. <Link to="/contactos" className="text-sky-700 hover:underline">Diga-nos o que procura</Link>.</p>
            : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{lista.map((v) => <CartaoViatura key={v.id} v={v} />)}</div>}
      </section>
    </>
  )
}

export function ViaturaDetalhe() {
  const { id } = useParams()
  const { site } = useSite()
  const [v, setV] = useState<ViaturaPublica | null>(null)
  const [erro, setErro] = useState('')
  const [foto, setFoto] = useState(0)

  useEffect(() => {
    if (id) api.publico.viatura(id).then(setV).catch((e) => setErro(e instanceof Error ? e.message : 'Viatura não encontrada'))
  }, [id])

  if (erro) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-slate-600">{erro}</p><Link to="/viaturas" className="mt-4 inline-block font-semibold text-sky-700">Ver outras viaturas</Link></div>
  if (!v) return <p className="px-4 py-20 text-center text-slate-500">A carregar...</p>

  const nome = `${v.marca} ${v.modelo}${v.ano ? ` (${v.ano})` : ''}`
  const wa = linkWhatsapp(site.config.whatsapp, `Olá, tenho interesse na viatura ${nome}.`)
  const ficha = [['Marca', v.marca], ['Modelo', v.modelo], ['Ano', v.ano], ['Cor', v.cor], ['Combustível', v.combustivel],
    ['Caixa', v.transmissao], ['Quilómetros', v.quilometragem != null ? `${v.quilometragem.toLocaleString('pt-AO')} km` : null]]
    .filter(([, x]) => x != null && x !== '')

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Link to="/viaturas" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Todas as viaturas</Link>
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
            {v.fotos[foto] ? <img src={reduzida(v.fotos[foto], 1400)} alt={nome} className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center text-slate-300"><CarFront className="h-24 w-24" /></div>}
          </div>
          {v.fotos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {v.fotos.map((f, i) => (
                <button key={f} type="button" onClick={() => setFoto(i)} className={`aspect-[4/3] overflow-hidden rounded-lg ring-2 ${i === foto ? 'ring-sky-600' : 'ring-transparent'}`}>
                  <img src={reduzida(f, 300)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">{v.marca}</p>
            <h1 className="text-3xl font-bold text-slate-900">{v.modelo}</h1>
            <p className="mt-3 text-3xl font-black text-slate-900">{v.preco_venda != null ? fmtKz(v.preco_venda) : 'Preço sob consulta'}</p>
          </div>
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {ficha.map(([k, x]) => <div key={String(k)} className="flex justify-between px-4 py-2.5 text-sm"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{x}</dd></div>)}
          </dl>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" /> Falar pelo WhatsApp</a>}
          <FormContacto tipo="viatura" viaturaId={v.id} titulo="Tenho interesse nesta viatura" />
        </div>
      </div>
    </section>
  )
}

export function Intermediacao() {
  const { site } = useSite()
  return (
    <>
      <Cabecalho titulo="Intermediação" texto={site.config.texto_intermediacao} imagem={imagemDe(site.imagens, 'intermediacao')} />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8">
        <ol className="space-y-5">
          {['Avaliamos a sua viatura e combinamos o preço de venda.', 'Fotografamos e divulgamos a viatura no stand e online.',
            'Recebemos os interessados e tratamos da negociação.', 'Fechamos a venda e tratamos da documentação.'].map((t, n) => (
            <li key={t} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-700 font-bold text-white">{n + 1}</span><p className="pt-1.5 text-slate-700">{t}</p></li>
          ))}
        </ol>
        <FormContacto tipo="intermediacao" comViatura titulo="Quero vender por intermediação" />
      </section>
    </>
  )
}

export function Compramos() {
  const { site } = useSite()
  return (
    <>
      <Cabecalho titulo="Compramos a sua viatura" texto={site.config.texto_compramos} imagem={imagemDe(site.imagens, 'compramos')} />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8">
        <div className="space-y-4 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-900">Como funciona</h2>
          <p>Envie-nos os dados da viatura. Analisamos o estado, o ano e os quilómetros e fazemos-lhe uma proposta.</p>
          <p>Se aceitar, tratamos do pagamento e da documentação de forma rápida e segura.</p>
          <Galeria secao="compramos" />
        </div>
        <FormContacto tipo="compramos" comViatura titulo="Pedir proposta de compra" />
      </section>
    </>
  )
}

export function Contactos() {
  const { site } = useSite()
  const c = site.config
  const wa = linkWhatsapp(c.whatsapp)
  const linhas = [
    c.morada && { i: MapPin, t: c.morada },
    c.telefone && { i: Phone, t: c.telefone, href: `tel:${c.telefone.replace(/\s/g, '')}` },
    wa && { i: MessageCircle, t: 'WhatsApp', href: wa },
    c.email && { i: Mail, t: c.email, href: `mailto:${c.email}` },
    c.horario && { i: Clock, t: c.horario },
  ].filter(Boolean) as { i: typeof Phone; t: string; href?: string }[]
  return (
    <>
      <Cabecalho titulo="Contactos" texto="Visite-nos, ligue-nos ou deixe-nos uma mensagem." imagem={imagemDe(site.imagens, 'contactos')} />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8">
        <div className="space-y-4">
          {linhas.map(({ i: I, t, href }) => (
            <div key={t} className="flex items-center gap-4 rounded-xl border border-slate-200 p-5">
              <I className="h-6 w-6 shrink-0 text-sky-700" />
              {href ? <a href={href} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:text-sky-700">{t}</a> : <span className="font-medium text-slate-900">{t}</span>}
            </div>
          ))}
          {c.morada && (
            <iframe title="Mapa" className="h-64 w-full rounded-xl border border-slate-200" loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(c.morada)}&output=embed`} />
          )}
        </div>
        <FormContacto tipo="contacto" titulo="Envie-nos uma mensagem" />
      </section>
    </>
  )
}
