import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarCheck, CarFront, Fuel, Gauge, ListChecks, MessageCircle, Palette, Settings2 } from 'lucide-react'
import { api } from '../lib/api'
import { ehInterior } from '../lib/cloudinary'
import { amostraMetal, corDe } from '../lib/cores'
import { fmtKz } from '../lib/format'
import { ilustrativasDe } from '../lib/ilustrativas'
import type { ViaturaPublica } from '../types'
import Palco, { type FotoPalco } from './Palco'
import { linkWhatsapp, useSite } from './SiteContext'
import { FormContacto, botaoContorno, botaoPub, sobretitulo } from './componentes'

const nomeDe = (v: ViaturaPublica) => `${v.marca} ${v.modelo}${v.ano ? ` (${v.ano})` : ''}`
const km = (n?: number | null) => (n != null ? `${n.toLocaleString('pt-AO')} km` : null)

/** Página de uma viatura à venda, em modo showroom (exterior / interior, rotação, zoom e cores em stock). */
export default function ViaturaDetalhe() {
  const { id = '' } = useParams()
  return <Showroom key={id} id={id} />
}

function Showroom({ id }: { id: string }) {
  const { site } = useSite()
  const [v, setV] = useState<ViaturaPublica | null>(null)
  const [variantes, setVariantes] = useState<ViaturaPublica[]>([])
  const [erro, setErro] = useState('')
  const [pedido, setPedido] = useState<{ tipo: 'test_drive' | 'info'; n: number }>({ tipo: 'info', n: 0 })
  const formulario = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let activo = true
    api.publico.viatura(id)
      .then((r) => {
        if (!activo) return
        setV(r)
        document.title = `${nomeDe(r)} · Showroom`
        // Outras unidades do mesmo modelo em stock: são as «cores» que o cliente pode escolher.
        return api.publico.viaturas({ marca: r.marca, modelo: r.modelo }).then((l) => { if (activo) setVariantes(l) })
      })
      .catch((e) => { if (activo) setErro(e instanceof Error ? e.message : 'Viatura não encontrada') })
    return () => { activo = false }
  }, [id])

  if (erro) {
    return (
      <div className="palco-exterior flex min-h-[70svh] flex-col items-center justify-center px-4 text-center">
        <CarFront className="h-16 w-16 text-tinta/15" />
        <p className="mt-6 font-display text-2xl font-bold uppercase text-tinta">{erro}</p>
        <Link to="/viaturas" className={`${botaoPub} mt-8`}>Ver outras viaturas</Link>
      </div>
    )
  }
  if (!v) return <div className="palco-exterior h-[calc(100svh-4rem)] animate-pulse" aria-label="A carregar" />

  const nome = nomeDe(v)
  const wa = linkWhatsapp(site.config.whatsapp, `Olá, tenho interesse na viatura ${nome}.`)
  const unidades = [v, ...variantes.filter((x) => x.id !== v.id)]

  function pedir(tipo: 'test_drive' | 'info') {
    setPedido((p) => ({ tipo, n: p.n + 1 }))
    requestAnimationFrame(() => formulario.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <>
      <Palco key={v.id} nome={nome} {...galeriaDe(v)} voltar={{ para: '/viaturas', rotulo: 'Showroom' }}
        classeAltura="h-[64svh] min-h-[440px] lg:h-[calc(100svh-4rem-4.75rem)] lg:min-h-[600px]"
        paineis={[
          { chave: 'cores', rotulo: 'Cor exterior', icone: Palette, conteudo: () => <Cores v={v} unidades={unidades} /> },
          { chave: 'ficha', rotulo: 'Ficha técnica', icone: ListChecks, conteudo: () => <Ficha v={v} /> },
        ]} />

      {/* Barra inferior: identificação, preço e acções — fica sempre visível */}
      <div className="sticky bottom-0 z-20 border-t border-tinta/10 bg-base-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 lg:px-8">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.26em] text-acento-claro">{[v.ano, v.marca].filter(Boolean).join(' · ')}</p>
            <h1 className="truncate font-display text-xl font-bold uppercase tracking-tight text-tinta sm:text-2xl">{v.modelo}</h1>
          </div>
          <div className="hidden items-center gap-5 text-sm text-tinta/55 xl:flex">
            {v.combustivel && <span className="flex items-center gap-1.5"><Fuel className="h-4 w-4" />{v.combustivel}</span>}
            {v.transmissao && <span className="flex items-center gap-1.5"><Settings2 className="h-4 w-4" />{v.transmissao}</span>}
            {v.quilometragem != null && <span className="flex items-center gap-1.5"><Gauge className="h-4 w-4" />{km(v.quilometragem)}</span>}
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-tinta/40">Preço</p>
            <p className="font-display text-xl font-bold text-tinta sm:text-2xl">{v.preco_venda != null ? fmtKz(v.preco_venda) : 'Sob consulta'}</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="button" onClick={() => pedir('info')} className={`${botaoContorno} flex-1 px-5 sm:flex-none`}>
              <MessageCircle className="h-4 w-4" /> Pedir informação
            </button>
            <button type="button" onClick={() => pedir('test_drive')} className={`${botaoPub} flex-1 px-5 sm:flex-none`}>
              <CalendarCheck className="h-4 w-4" /> Marcar test drive
            </button>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div className="space-y-10">
          <div className="lg:hidden"><Bloco titulo="Cor exterior"><Cores v={v} unidades={unidades} /></Bloco></div>
          <Bloco titulo="Ficha técnica"><Ficha v={v} /></Bloco>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5 transition hover:border-emerald-400/40">
              <span>
                <span className="block font-display text-lg font-semibold uppercase tracking-wide text-tinta">Falar pelo WhatsApp</span>
                <span className="text-sm text-tinta/55">Fale directamente com o stand.</span>
              </span>
              <MessageCircle className="h-7 w-7 text-emerald-400" />
            </a>
          )}
        </div>
        <div ref={formulario} className="scroll-mt-24">
          <FormContacto key={pedido.n} tipo="viatura" viaturaId={v.id}
            titulo={pedido.tipo === 'test_drive' ? 'Marcar test drive' : 'Tenho interesse nesta viatura'}
            mensagemInicial={pedido.n === 0 ? '' : pedido.tipo === 'test_drive'
              ? `Gostaria de marcar um test drive da viatura ${nome}. Disponibilidade: `
              : `Gostaria de mais informações sobre a viatura ${nome}.`} />
        </div>
      </section>
    </>
  )
}

/** Fotos da viatura separadas em exterior e interior; o que faltar vem do catálogo da marca (imagem ilustrativa). */
function galeriaDe(v: ViaturaPublica): { exterior: FotoPalco[]; interior: FotoPalco[] } {
  const exterior: FotoPalco[] = v.fotos.filter((u) => !ehInterior(u)).map((url) => ({ url }))
  const interior: FotoPalco[] = v.fotos.filter(ehInterior).map((url) => ({ url }))
  const catalogo = ilustrativasDe(v.marca, v.modelo, v.cor)
  return {
    exterior: exterior.length ? exterior : catalogo?.exterior ?? [],
    interior: interior.length ? interior : catalogo?.interior ?? [],
  }
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <p className={sobretitulo}>{titulo}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

/** Amostras de cor: cada uma é uma unidade real em stock do mesmo modelo. */
function Cores({ v, unidades }: { v: ViaturaPublica; unidades: ViaturaPublica[] }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-tinta">{v.cor || 'Cor não indicada'}</p>
      <ul className="mt-4 flex flex-wrap gap-4">
        {unidades.map((x) => {
          const activa = x.id === v.id
          const amostra = (
            <span className={`block h-12 w-12 rounded-full shadow-[inset_0_-6px_12px_rgb(0_0_0/0.35)] ring-1 ring-tinta/15 transition ${activa ? 'outline-2 outline-offset-4 outline-acento' : 'group-hover:scale-110'}`}
              style={{ background: amostraMetal(corDe(x.cor).hex) }} />
          )
          const legenda = (
            <span className="mt-2 block max-w-[4.5rem] text-center text-[11px] leading-tight text-tinta/55">
              {x.cor || '—'}{unidades.length > 1 && x.ano ? <span className="block text-tinta/30">{x.ano}</span> : null}
            </span>
          )
          return (
            <li key={x.id}>
              {activa
                ? <span aria-current="true" className="flex flex-col items-center">{amostra}{legenda}</span>
                : <Link to={`/viaturas/${x.id}`} className="group flex flex-col items-center" title={`${x.cor ?? ''} · ${x.preco_venda != null ? fmtKz(x.preco_venda) : 'sob consulta'}`}>{amostra}{legenda}</Link>}
            </li>
          )
        })}
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-tinta/40">
        {unidades.length > 1
          ? `${unidades.length} unidades deste modelo em stock. Escolha uma cor para ver essa viatura.`
          : 'Unidade única em stock. As fotografias são da própria viatura.'}
      </p>
    </div>
  )
}

function Ficha({ v }: { v: ViaturaPublica }) {
  const linhas = [['Marca', v.marca], ['Modelo', v.modelo], ['Ano', v.ano], ['Cor', v.cor], ['Combustível', v.combustivel],
    ['Caixa', v.transmissao], ['Quilómetros', km(v.quilometragem)]].filter(([, x]) => x != null && x !== '')
  return (
    <dl className="divide-y divide-tinta/[0.06] rounded-2xl border border-tinta/[0.07] bg-base-900/60">
      {linhas.map(([k, x]) => (
        <div key={String(k)} className="flex justify-between gap-4 px-5 py-3 text-sm">
          <dt className="text-tinta/45">{k}</dt><dd className="text-right font-semibold text-tinta">{x}</dd>
        </div>
      ))}
    </dl>
  )
}
