import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, ChevronDown, HandCoins, Handshake, MessageCircle, Palette, Pause, Play, Search } from 'lucide-react'
import { api } from '../lib/api'
import { reduzida } from '../lib/cloudinary'
import { amostraMetal, corDe } from '../lib/cores'
import { MODELOS_ILUSTRADOS } from '../lib/ilustrativas'
import type { Filtros, ViaturaPublica } from '../types'
import { linkWhatsapp, useSite } from './SiteContext'
import Palco, { type ControloPalco, type FotoPalco } from './Palco'
import { CartaoViatura, botaoContorno, botaoPub, sobretitulo } from './componentes'

const selectPesquisa =
  'w-full appearance-none rounded-xl border border-tinta/10 bg-base-800/80 py-3.5 pl-4 pr-10 text-sm font-medium text-tinta outline-none transition focus:border-acento/70 focus:ring-2 focus:ring-acento/25'

function Escolha({ rotulo, valor, onChange, opcoes, vazio }: {
  rotulo: string; valor: string; onChange: (v: string) => void; opcoes: string[]; vazio: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-tinta/45">{rotulo}</span>
      <span className="relative block">
        <select value={valor} onChange={(e) => onChange(e.target.value)} className={selectPesquisa}>
          <option value="">{vazio}</option>{opcoes.map((m) => <option key={m}>{m}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta/40" />
      </span>
    </label>
  )
}

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
    <form onSubmit={pesquisar} role="search" className="vidro rounded-2xl p-4 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] sm:p-5">
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <Escolha rotulo="Marca" valor={marca} onChange={(v) => { setMarca(v); setModelo('') }} opcoes={filtros?.marcas ?? []} vazio="Todas as marcas" />
        <Escolha rotulo="Modelo" valor={modelo} onChange={setModelo} opcoes={modelos} vazio="Todos os modelos" />
        <Escolha rotulo="Combustível" valor={combustivel} onChange={setCombustivel} opcoes={filtros?.combustiveis ?? []} vazio="Qualquer" />
        <button type="submit" className={`${botaoPub} h-[50px] sm:col-span-2 lg:col-span-1`}><Search className="h-4 w-4" /> Pesquisar</button>
      </div>
    </form>
  )
}

/** Carros do hero, cada um com as suas cores (de momento só o Jetour, em branco e vermelho).
 *  Para acrescentar outro carro: imagens com fundo branco em public/showroom e uma entrada nesta lista;
 *  com mais de um carro, aparece o seletor de carro. */
interface CarroHero { id: string; marca: string; nome: string; cores: { cor: string; url: string; vinheta?: boolean }[] }

const CARROS_HERO: CarroHero[] = [
  {
    id: 'jetour-hero', marca: 'Jetour', nome: 'Jetour',
    cores: [
      { cor: 'Branco', url: '/showroom/hero-jetour-branco.webp' },
      { cor: 'Vermelho', url: '/showroom/hero-jetour-vermelho.webp' },
    ],
  },
]
/** Sequência automática: todas as cores de um carro e depois o carro seguinte. */
const SLIDES = CARROS_HERO.flatMap((c) => c.cores.map((k) => ({ ...k, carro: c })))
const TEMPO_HERO = 3500
const nomeCarro = (c: CarroHero) => (c.marca === c.nome ? c.marca : `${c.marca} ${c.nome}`)

function HeroEstudio({ nome, slogan, total, wa }: { nome: string; slogan: string; total: number | null; wa: string }) {
  const [g, setG] = useState(0)
  const [auto, setAuto] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [inclina, setInclina] = useState(0)
  const actual = SLIDES[g]
  const carro = actual.carro
  const brilho = `${corDe(actual.cor).hex}55`

  useEffect(() => {
    if (!auto || SLIDES.length < 2) return
    const t = window.setTimeout(() => setG((n) => (n + 1) % SLIDES.length), TEMPO_HERO)
    return () => window.clearTimeout(t)
  }, [auto, g])

  /** Escolha manual: pára a troca automática (retoma-se com o botão de reprodução). */
  function irPara(n: number) {
    setG(n)
    setAuto(false)
  }

  return (
    <section
      aria-roledescription="carrossel" aria-label="Viaturas em destaque"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        setInclina(((e.clientX - r.left) / r.width) * 2 - 1)
      }}
      onPointerLeave={() => setInclina(0)}
      className="palco-exterior relative isolate min-h-[calc(100svh-4rem)] overflow-hidden lg:h-[calc(100svh-4rem)] lg:min-h-[640px] lg:max-h-[940px]">
      {/* Brilho com a cor escolhida e o nome do carro em fundo */}
      <div className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
        style={{ background: `radial-gradient(ellipse 45% 55% at 68% 55%, ${brilho}, transparent 70%)` }} />
      <p aria-hidden="true"
        className="banner-entrada pointer-events-none absolute -right-[4vw] top-[6%] select-none whitespace-nowrap font-display text-[24vw] font-bold uppercase leading-none tracking-tighter text-tinta/[0.04] lg:text-[15vw]">
        {carro.marca}
      </p>
      <div className="linha-luz absolute inset-x-0 top-0" />

      <div className="relative mx-auto grid h-full max-w-[1600px] items-center gap-4 px-4 pb-36 pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0 lg:px-8 lg:pb-40 lg:pt-0">
        <div className="banner-entrada relative z-10">
          <p className={sobretitulo}>{nome} · Luanda</p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-tinta sm:text-6xl xl:text-7xl">{slogan}</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-tinta/65">
            Viaturas revistas e com documentação tratada. Também compramos a sua viatura ou vendemo-la por si.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/viaturas" className={botaoPub}>Entrar no showroom <ArrowRight className="h-4 w-4" /></Link>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className={botaoContorno}><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
          </div>
          {total !== null && total > 0 && (
            <p className="mt-6 flex items-center gap-2 text-sm text-tinta/55">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <b className="font-display text-base text-tinta">{total}</b> {total === 1 ? 'viatura disponível' : 'viaturas disponíveis'}
            </p>
          )}
        </div>

        {/* Palco da viatura: nada aqui cria grupo de empilhamento, para o «multiply» fundir o fundo branco das imagens */}
        <div className="relative h-[48svh] min-h-[340px] lg:h-full">
          <div className="foco-estudio pointer-events-none absolute -inset-x-[22%] -inset-y-[18%]" />
          <div className="pointer-events-none absolute bottom-[32%] left-1/2 aspect-square w-[88%] origin-bottom lg:bottom-[24%]"
            style={{ transform: `translateX(-50%) perspective(900px) rotateX(78deg) rotateZ(${-inclina * 8}deg)` }}>
            <div className="plataforma plataforma-gira absolute inset-0" />
          </div>
          <div className="pedestal pointer-events-none absolute inset-x-[12%] bottom-[33%] h-16 lg:bottom-[26%]" />
          {SLIDES.map((h, n) => (
            <img key={h.url} src={h.url} draggable={false} fetchPriority={n === 0 ? 'high' : 'auto'}
              alt={n === g ? `${nomeCarro(h.carro)} ${h.cor.toLowerCase()} em estúdio` : ''}
              className={`imagem-estudio absolute inset-0 h-full w-full object-contain pb-28 transition-[opacity,transform] duration-700 ease-out lg:pb-[16%] lg:pt-[10%] ${h.vinheta ? 'imagem-vinheta' : ''} ${n === g ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: `perspective(1400px) rotateY(${inclina * 8}deg) translateX(${n === g ? inclina * 12 : n < g ? -80 : 80}px) scale(${n === g ? 1 : 0.94})` }} />
          ))}

          {/* Controlos: carro, cor, pausa e tempo até à próxima troca */}
          <div className="absolute bottom-0 left-1/2 z-10 flex w-max max-w-full -translate-x-1/2 flex-col items-center gap-2 lg:bottom-[5%]">
            {CARROS_HERO.length > 1 && (
              <div role="tablist" aria-label="Viatura" className="vidro flex max-w-full overflow-x-auto rounded-full p-1">
                {CARROS_HERO.map((c) => (
                  <button key={c.id} type="button" role="tab" aria-selected={c.id === carro.id}
                    onClick={() => irPara(SLIDES.findIndex((x) => x.carro.id === c.id))}
                    className={`whitespace-nowrap rounded-full px-4 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      c.id === carro.id ? 'bg-acento text-branco' : 'text-tinta/60 hover:text-tinta'}`}>
                    {nomeCarro(c)}
                  </button>
                ))}
              </div>
            )}
            <div className="vidro relative flex items-center gap-3 overflow-hidden rounded-full py-1.5 pl-5 pr-1.5">
              <span aria-live={auto ? 'off' : 'polite'} className="min-w-16 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-tinta/60">{actual.cor}</span>
              <div role="radiogroup" aria-label="Cor" className="flex gap-2.5">
                {carro.cores.map((k) => {
                  const n = SLIDES.findIndex((x) => x.url === k.url)
                  return (
                    <button key={k.url} type="button" role="radio" aria-checked={n === g} aria-label={k.cor} title={k.cor} onClick={() => irPara(n)}
                      className={`h-8 w-8 rounded-full shadow-[inset_0_-4px_8px_rgb(0_0_0/0.35)] ring-1 ring-tinta/20 transition ${n === g ? 'outline-2 outline-offset-2 outline-acento' : 'hover:scale-110'}`}
                      style={{ background: amostraMetal(corDe(k.cor).hex) }} />
                  )
                })}
              </div>
              {SLIDES.length > 1 && (
                <>
                  <span className="h-5 w-px bg-tinta/15" />
                  <button type="button" onClick={() => setAuto((a) => !a)} aria-pressed={auto}
                    aria-label={auto ? 'Pausar a troca automática' : 'Retomar a troca automática'} title={auto ? 'Pausar' : 'Reproduzir'}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-tinta/70 transition hover:bg-tinta/10 hover:text-tinta">
                    {auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                </>
              )}
              {auto && SLIDES.length > 1 && (
                <span key={g} aria-hidden="true" className="barra-hero absolute inset-x-0 bottom-0 h-0.5 bg-acento"
                  style={{ animationDuration: `${TEMPO_HERO}ms` }} />
              )}
            </div>
            <Link to={`/viaturas?marca=${encodeURIComponent(carro.marca)}`}
              className="group flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-tinta/55 hover:text-tinta">
              Ver {carro.marca} em stock <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Amostras de cor do showroom em destaque: cada uma mostra a imagem dessa cor. */
function CoresDestaque({ exterior, c }: { exterior: FotoPalco[]; c: ControloPalco }) {
  const escolhida = c.vista === 'exterior' ? exterior[c.actual] : undefined
  return (
    <div>
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-tinta">{escolhida?.cor ?? 'Escolha uma cor'}</p>
      <ul className="mt-4 flex flex-wrap gap-4">
        {exterior.map((f, i) => {
          const activa = f === escolhida
          return (
            <li key={f.url}>
              <button type="button" onClick={() => c.irPara('exterior', i)} aria-pressed={activa} className="group flex flex-col items-center">
                <span className={`block h-12 w-12 rounded-full shadow-[inset_0_-6px_12px_rgb(0_0_0/0.35)] ring-1 ring-tinta/15 transition ${activa ? 'outline-2 outline-offset-4 outline-acento' : 'group-hover:scale-110'}`}
                  style={{ background: amostraMetal(corDe(f.cor).hex) }} />
                <span className="mt-2 text-[11px] text-tinta/55">{f.cor}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-tinta/40">Imagens ilustrativas da marca. Veja em stock as unidades disponíveis e as suas fotografias reais.</p>
    </div>
  )
}

function ShowroomDestaque() {
  const [id, setId] = useState('jetour')
  const m = MODELOS_ILUSTRADOS.find((x) => x.id === id)
  if (!m) return null
  return (
    <section className="py-20">
      <div className="mx-auto mb-10 flex max-w-[1600px] flex-wrap items-end justify-between gap-6 px-4 lg:px-8">
        <div className="max-w-2xl">
          <p className={sobretitulo}>Showroom 3D</p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-tinta sm:text-5xl">
            {m.marca} <span className="text-acento">{m.nome}</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-tinta/60">
            Incline a viatura com o rato, troque a cor e entre no habitáculo: arraste para olhar à volta.
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 lg:items-end">
          {MODELOS_ILUSTRADOS.length > 1 && (
            <div role="tablist" aria-label="Modelo em destaque" className="flex rounded-full border border-tinta/10 p-1">
              {MODELOS_ILUSTRADOS.map((x) => (
                <button key={x.id} type="button" role="tab" aria-selected={x.id === m.id} onClick={() => setId(x.id)}
                  className={`rounded-full px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    x.id === m.id ? 'bg-acento text-branco' : 'text-tinta/60 hover:text-tinta'}`}>
                  {x.marca} {x.nome}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link to={`/viaturas?marca=${encodeURIComponent(m.marca)}`} className={botaoPub}>Ver {m.marca} em stock <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/contactos" className={botaoContorno}>Pedir proposta</Link>
          </div>
        </div>
      </div>
      <div className="border-y border-tinta/[0.06]">
        <Palco key={m.id} nome={`${m.marca} ${m.nome}`} exterior={m.exterior} interior={m.interior} paineisNoTelemovel
          classeAltura="h-[62svh] min-h-[440px] lg:h-[80svh] lg:min-h-[620px] lg:max-h-[880px]"
          paineis={[{ chave: 'cores', rotulo: 'Cor exterior', icone: Palette, conteudo: (c) => <CoresDestaque exterior={m.exterior} c={c} /> }]} />
      </div>
    </section>
  )
}

export default function Home() {
  const { site } = useSite()
  const [destaques, setDestaques] = useState<ViaturaPublica[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [filtros, setFiltros] = useState<Filtros | null>(null)

  useEffect(() => {
    api.publico.viaturas().then((v) => { setDestaques(v.slice(0, 6)); setTotal(v.length) }).catch(() => undefined)
    api.publico.filtros().then(setFiltros).catch(() => undefined)
  }, [])

  // Banner: as imagens activas da secção «hero» (geridas no admin, via Cloudinary) ou o carro por omissão do projecto.
  const marcas = site.imagens.marcas ?? []
  const c = site.config
  const wa = linkWhatsapp(c.whatsapp, `Olá ${c.nome ?? ''}, gostaria de mais informações.`)

  return (
    <>
      <HeroEstudio nome={c.nome || 'Stand Automóvel'} slogan={c.slogan || 'A sua próxima viatura está aqui.'} total={total} wa={wa} />

      {/* Pesquisa sobreposta ao fundo do hero */}
      <section className="relative z-10 mx-auto -mt-24 max-w-[1600px] px-4 lg:px-8">
        <Pesquisa filtros={filtros} />
      </section>

      {marcas.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 pt-14 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 border-y border-tinta/[0.06] py-8">
            {marcas.map((m) => {
              const img = <img src={reduzida(m.url, 200)} alt={m.titulo ?? 'Marca'} className="h-8 w-auto object-contain logo-marca opacity-50 transition hover:opacity-100" />
              return m.ligacao ? <a key={m.id} href={m.ligacao}>{img}</a>
                : <Link key={m.id} to={m.titulo ? `/viaturas?marca=${encodeURIComponent(m.titulo)}` : '/viaturas'}>{img}</Link>
            })}
          </div>
        </section>
      )}

      <ShowroomDestaque />

      <section className="mx-auto max-w-[1600px] px-4 pb-20 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={sobretitulo}>Em stock</p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-tinta sm:text-5xl">Destaques do showroom</h2>
          </div>
          <Link to="/viaturas" className="group flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-tinta/70 hover:text-tinta">
            Ver todas <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
        {destaques.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{destaques.map((v) => <CartaoViatura key={v.id} v={v} />)}</div>
        ) : (
          <p className="rounded-2xl border border-dashed border-tinta/10 p-10 text-center text-tinta/50">
            De momento não há viaturas publicadas. <Link to="/contactos" className="text-tinta underline-offset-4 hover:underline">Contacte-nos</Link> para saber o que vai chegar.
          </p>
        )}
      </section>

      <section className="border-t border-tinta/[0.06] bg-base-900">
        <div className="mx-auto grid max-w-[1600px] gap-px px-4 py-20 md:grid-cols-3 lg:px-8">
          {[
            { i: BadgeCheck, t: 'Viaturas revistas', d: 'Cada viatura é preparada e verificada antes da venda.', to: '/empresa' },
            { i: Handshake, t: 'Intermediação', d: 'Vendemos a sua viatura por si, do anúncio à entrega.', to: '/intermediacao' },
            { i: HandCoins, t: 'Compramos o seu carro', d: 'Proposta rápida e sem compromisso.', to: '/compramos' },
          ].map(({ i: I, t, d, to }, n) => (
            <Link key={t} to={to} className="group relative overflow-hidden p-8 transition hover:bg-tinta/[0.02]">
              <span className="font-display text-5xl font-bold text-tinta/[0.06]">0{n + 1}</span>
              <I className="mt-4 h-7 w-7 text-acento-claro" />
              <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight text-tinta">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tinta/55">{d}</p>
              <span className="mt-6 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-tinta/50 group-hover:text-tinta">
                Saber mais <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
