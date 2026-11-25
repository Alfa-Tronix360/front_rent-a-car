import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone, X } from 'lucide-react'
import { api } from '../lib/api'
import { reduzida } from '../lib/cloudinary'
import type { Filtros, ViaturaPublica } from '../types'
import { linkWhatsapp, useSite } from './SiteContext'
import { Cabecalho, CartaoViatura, FormContacto, sobretitulo } from './componentes'
import { Pesquisa } from './Home'

const imagemDe = (imagens: Record<string, { url: string }[]>, secao: string) => imagens[secao]?.[0]?.url

/** Galeria de imagens de uma secção (ex.: fotografias do stand na página Empresa). */
function Galeria({ secao }: { secao: string }) {
  const { site } = useSite()
  const imgs = (site.imagens[secao] ?? []).slice(1)
  if (!imgs.length) return null
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {imgs.map((i, n) => (
        <img key={i.id} src={reduzida(i.url, 900)} alt={i.titulo ?? ''} loading="lazy"
          className={`w-full rounded-2xl object-cover ${n === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto md:h-full' : 'aspect-[4/3]'}`} />
      ))}
    </div>
  )
}

const Passos = ({ itens }: { itens: string[] }) => (
  <ol className="space-y-0">
    {itens.map((t, n) => (
      <li key={t} className="flex gap-6 border-b border-tinta/[0.06] py-6 first:pt-0 last:border-0">
        <span className="font-display text-4xl font-bold leading-none text-acento">0{n + 1}</span>
        <p className="pt-1.5 text-base leading-relaxed text-tinta/70">{t}</p>
      </li>
    ))}
  </ol>
)

export function Empresa() {
  const { site } = useSite()
  return (
    <>
      <Cabecalho sobre="Quem somos" titulo="Empresa" texto={site.config.texto_empresa} imagem={imagemDe(site.imagens, 'empresa')} />
      <section className="mx-auto max-w-7xl space-y-16 px-4 py-20 lg:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-tinta/[0.07] bg-tinta/[0.06] md:grid-cols-3">
          {[['Importação', 'Trazemos viaturas seleccionadas e tratamos do desalfandegamento.'],
            ['Preparação', 'Revisão mecânica, limpeza e documentação antes da entrega.'],
            ['Transparência', 'Preço claro e todos os documentos da viatura.']].map(([t, d], n) => (
            <div key={t} className="bg-base-900 p-8">
              <span className="font-display text-sm font-semibold text-acento-claro">0{n + 1}</span>
              <h3 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-tinta">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tinta/55">{d}</p>
            </div>
          ))}
        </div>
        <Galeria secao="empresa" />
        <Link to="/viaturas" className="group inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.18em] text-tinta">
          Ver as viaturas disponíveis <ArrowRight className="h-4 w-4 text-acento transition group-hover:translate-x-1" />
        </Link>
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
      <section className="palco-exterior border-b border-tinta/[0.06]">
        <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-14 lg:px-8">
          <p className={sobretitulo}>Showroom</p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-tinta sm:text-6xl">Viaturas à venda</h1>
          <div className="mt-8"><Pesquisa key={chave} filtros={filtros} inicial={pedido} /></div>
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-4 py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-tinta/60">
            {lista ? `${lista.length} ${lista.length === 1 ? 'viatura' : 'viaturas'}` : 'A carregar'}
          </p>
          {activos.map((a) => <span key={a} className="rounded-full border border-tinta/15 px-3 py-1 text-xs font-medium text-tinta/80">{a}</span>)}
          {activos.length > 0 && (
            <Link to="/viaturas" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-acento-claro hover:text-tinta">
              <X className="h-3.5 w-3.5" /> Limpar
            </Link>
          )}
        </div>
        {lista === null ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-base-900" />)}
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-tinta/10 p-14 text-center">
            <p className="font-display text-xl font-semibold uppercase text-tinta">Sem resultados</p>
            <p className="mt-2 text-tinta/55">Não encontrámos viaturas com estes critérios. <Link to="/contactos" className="text-tinta underline underline-offset-4">Diga-nos o que procura</Link>.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{lista.map((v) => <CartaoViatura key={v.id} v={v} />)}</div>
        )}
      </section>
    </>
  )
}

export function Intermediacao() {
  const { site } = useSite()
  return (
    <>
      <Cabecalho sobre="Serviços" titulo="Intermediação" texto={site.config.texto_intermediacao} imagem={imagemDe(site.imagens, 'intermediacao')} />
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="mb-8 font-display text-3xl font-bold uppercase tracking-tight text-tinta">Como funciona</h2>
          <Passos itens={['Avaliamos a sua viatura e combinamos o preço de venda.', 'Fotografamos e divulgamos a viatura no stand e online.',
            'Recebemos os interessados e tratamos da negociação.', 'Fechamos a venda e tratamos da documentação.']} />
        </div>
        <FormContacto tipo="intermediacao" comViatura titulo="Quero vender por intermediação" />
      </section>
    </>
  )
}

export function Compramos() {
  const { site } = useSite()
  return (
    <>
      <Cabecalho sobre="Serviços" titulo="Compramos a sua viatura" texto={site.config.texto_compramos} imagem={imagemDe(site.imagens, 'compramos')} />
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 lg:grid-cols-2 lg:px-8">
        <div className="space-y-10">
          <div>
            <h2 className="mb-8 font-display text-3xl font-bold uppercase tracking-tight text-tinta">Como funciona</h2>
            <Passos itens={['Envie-nos os dados da viatura.', 'Analisamos o estado, o ano e os quilómetros e fazemos-lhe uma proposta.',
              'Se aceitar, tratamos do pagamento e da documentação de forma rápida e segura.']} />
          </div>
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
    c.morada && { i: MapPin, r: 'Morada', t: c.morada },
    c.telefone && { i: Phone, r: 'Telefone', t: c.telefone, href: `tel:${c.telefone.replace(/\s/g, '')}` },
    wa && { i: MessageCircle, r: 'WhatsApp', t: 'Enviar mensagem', href: wa },
    c.email && { i: Mail, r: 'Email', t: c.email, href: `mailto:${c.email}` },
    c.horario && { i: Clock, r: 'Horário', t: c.horario },
  ].filter(Boolean) as { i: typeof Phone; r: string; t: string; href?: string }[]
  return (
    <>
      <Cabecalho sobre="Fale connosco" titulo="Contactos" texto="Visite-nos, ligue-nos ou deixe-nos uma mensagem." imagem={imagemDe(site.imagens, 'contactos')} />
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 lg:grid-cols-2 lg:px-8">
        <div className="space-y-4">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-tinta/[0.07] bg-tinta/[0.06] sm:grid-cols-2">
            {linhas.map(({ i: I, r, t, href }) => (
              <div key={r} className="bg-base-900 p-6">
                <I className="h-5 w-5 text-acento-claro" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-tinta/40">{r}</p>
                {href ? <a href={href} target="_blank" rel="noreferrer" className="mt-1 block font-semibold text-tinta hover:text-acento-claro">{t}</a>
                  : <p className="mt-1 font-semibold text-tinta">{t}</p>}
              </div>
            ))}
          </div>
          {c.morada && (
            <iframe title="Mapa" className="h-72 w-full rounded-2xl border border-tinta/[0.07] mapa-tema" loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(c.morada)}&output=embed`} />
          )}
        </div>
        <FormContacto tipo="contacto" titulo="Envie-nos uma mensagem" />
      </section>
    </>
  )
}
