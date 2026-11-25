import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Armchair, ArrowLeft, CarFront, ChevronLeft, ChevronRight, Maximize2, Minimize2, Move3d, Rotate3d, X, ZoomIn, ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import { reduzida } from '../lib/cloudinary'
import { sobretitulo } from './componentes'

export type Vista = 'exterior' | 'interior'

export interface FotoPalco {
  url: string
  /** Render de estúdio com fundo branco: funde-se com o palco em vez de aparecer num rectângulo. */
  estudio?: boolean
  /** Imagem de catálogo da marca (não é a própria viatura): mostra a etiqueta «Imagem ilustrativa». */
  ilustrativa?: boolean
  /** Fundo de estúdio com vinheta ou cinzento: esbate as margens para não se ver o rectângulo da imagem. */
  vinheta?: boolean
  cor?: string
}

export interface ControloPalco {
  vista: Vista
  actual: number
  irPara: (vista: Vista, indice: number) => void
}

export interface PainelPalco {
  chave: string
  rotulo: string
  icone: LucideIcon
  conteudo: (c: ControloPalco) => ReactNode
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Palco do showroom: exterior / interior, efeito 3D (inclinação, plataforma giratória, panorâmica do habitáculo),
 *  rotação por arrasto quando há várias fotos de exterior, zoom e ecrã inteiro. */
export default function Palco({ nome, exterior, interior, paineis = [], voltar, classeAltura, paineisNoTelemovel = false }: {
  nome: string
  exterior: FotoPalco[]
  interior: FotoPalco[]
  paineis?: PainelPalco[]
  voltar?: { para: string; rotulo: string }
  classeAltura: string
  paineisNoTelemovel?: boolean
}) {
  const [vista, setVista] = useState<Vista>(exterior.length || !interior.length ? 'exterior' : 'interior')
  const fotos = vista === 'interior' ? interior : exterior
  const total = fotos.length
  const [n, setN] = useState(0)
  const actual = fotos[n] as FotoPalco | undefined
  const [zoom, setZoom] = useState(1)
  const [origem, setOrigem] = useState({ x: 50, y: 50 })
  const [inclinacao, setInclinacao] = useState<{ x: number; y: number } | null>(null)
  const [pan, setPan] = useState<number | null>(null)
  const [painel, setPainel] = useState<string | null>(paineis[0]?.chave ?? null)
  const [cheio, setCheio] = useState(false)
  const palco = useRef<HTMLElement>(null)
  const arrasto = useRef<{ x: number; n: number; pan: number } | null>(null)
  const rodavel = vista === 'exterior' && total >= 3

  useEffect(() => {
    const aoMudar = () => setCheio(document.fullscreenElement === palco.current)
    document.addEventListener('fullscreenchange', aoMudar)
    return () => document.removeEventListener('fullscreenchange', aoMudar)
  }, [])

  function irPara(nova: Vista, indice: number) {
    setVista(nova)
    setN(indice)
    setZoom(1)
    setPan(null)
  }
  const controlo: ControloPalco = { vista, actual: n, irPara }
  function ir(d: number) {
    if (!total) return
    setN((i) => (i + d + total) % total)
    setPan(null)
  }
  const ampliar = (d: number) => setZoom((z) => limitar(z + d, 1, 3))
  function ecraInteiro() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void palco.current?.requestFullscreen?.()
  }

  function aoPremir(e: PointerEvent<HTMLDivElement>) {
    if (!total || (e.target as HTMLElement).closest('button, a')) return
    arrasto.current = { x: e.clientX, n, pan: pan ?? 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function aoMover(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    if (zoom > 1) {
      setOrigem({ x: px * 100, y: py * 100 })
      return
    }
    const a = arrasto.current
    if (vista === 'interior') {
      // Arrastar no habitáculo = olhar à volta
      if (a) setPan(limitar(a.pan - (e.clientX - a.x) / (r.width / 2), -1, 1))
      return
    }
    if (a && rodavel) {
      const passos = Math.trunc((e.clientX - a.x) / 40)   // cada 40 px de arrasto avança uma foto
      setN((((a.n - passos) % total) + total) % total)
      return
    }
    if (a || e.pointerType === 'mouse') setInclinacao({ x: px * 2 - 1, y: py * 2 - 1 })
  }
  function aoLargar(e: PointerEvent<HTMLDivElement>) {
    arrasto.current = null
    if (e.pointerType !== 'mouse') setInclinacao(null)
  }
  function aoTeclar(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'ArrowLeft') ir(-1)
    else if (e.key === 'ArrowRight') ir(1)
    else if (e.key === '+' || e.key === '=') ampliar(0.5)
    else if (e.key === '-') ampliar(-0.5)
    else return
    e.preventDefault()
  }

  const ry = inclinacao ? inclinacao.x * 14 : 0
  const rx = inclinacao ? -inclinacao.y * 6 : 0
  const p = pan ?? 0
  const activo = paineis.find((x) => x.chave === painel)
  const comPainel = !!activo
  const botaoRedondo = 'flex h-10 w-10 items-center justify-center rounded-full text-tinta/75 transition hover:bg-tinta/10 hover:text-tinta disabled:opacity-30 disabled:hover:bg-transparent'
  const dica = vista === 'interior' ? 'Arraste para olhar à volta' : rodavel ? 'Arraste para rodar' : 'Mova o rato para inclinar'

  return (
    <>
      <section ref={palco} tabIndex={0} onKeyDown={aoTeclar} aria-roledescription="showroom" aria-label={`Imagens de ${nome}`}
        className={`${vista === 'interior' ? 'palco-interior' : 'palco-exterior'} relative isolate overflow-hidden outline-none select-none ${cheio ? 'h-screen' : classeAltura}`}>
        <div className="linha-luz absolute inset-x-0 top-0" />

        {/* Imagens */}
        <div onPointerDown={aoPremir} onPointerMove={aoMover} onPointerUp={aoLargar} onPointerCancel={aoLargar}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') setInclinacao(null) }}
          className={`absolute inset-0 touch-pan-y ${zoom > 1 ? 'cursor-zoom-in' : 'cursor-grab active:cursor-grabbing'}`}>
          {/* Tudo o que a imagem de estúdio precisa para se fundir («multiply») tem de estar neste mesmo grupo,
              incluindo o fundo do palco; por isso nada aqui dentro usa a propriedade `perspective`. */}
          <div className="absolute inset-0"
            style={{ transform: `scale(${zoom})`, transformOrigin: `${origem.x}% ${origem.y}%`, transition: 'transform .3s ease-out' }}>
            <div className={`absolute inset-0 ${vista === 'interior' ? 'palco-interior' : 'palco-exterior'}`} />
            {vista === 'exterior' && total > 0 && (
              <>
                {actual?.estudio && <div className="foco-estudio pointer-events-none absolute inset-0" />}
                <div className="pointer-events-none absolute bottom-[7%] left-1/2 aspect-square w-[min(78%,62rem)] origin-bottom transition-transform duration-500 lg:bottom-[12%]"
                  style={{ transform: `translateX(-50%) perspective(900px) rotateX(78deg) rotateZ(${-ry * 0.6}deg)` }}>
                  <div className="plataforma plataforma-gira absolute inset-0" />
                </div>
                <div className="pedestal pointer-events-none absolute inset-x-[16%] bottom-[9%] h-16 lg:bottom-[14%]" />
              </>
            )}
            <div className={`absolute inset-0 transition-[padding] duration-500 ${vista === 'exterior'
              ? `px-4 pb-16 pt-16 sm:px-14 lg:pb-24 lg:pt-20 ${comPainel ? 'lg:pl-24 lg:pr-[27rem]' : 'lg:px-28'}` : ''}`}>
              <div className="relative h-full w-full">
                {fotos.map((f, i) => (
                  <img key={f.url} src={reduzida(f.url, 2000)} draggable={false}
                    alt={i === n ? `${nome} — ${vista}, imagem ${i + 1} de ${total}` : ''}
                    className={`absolute inset-0 h-full w-full transition-[opacity,transform] duration-500 ease-out ${i === n ? 'opacity-100' : 'opacity-0'} ${
                      vista === 'interior'
                        ? `object-cover ${pan === null ? 'panorama-auto' : ''}`
                        : `object-contain ${f.estudio ? 'imagem-estudio' : 'drop-shadow-[0_30px_40px_rgb(0_0_0/0.45)]'} ${f.vinheta ? 'imagem-vinheta' : ''} ${inclinacao === null ? 'balanco' : ''}`}`}
                    style={{
                      transform: vista === 'interior'
                        ? `perspective(1200px) scale(1.32) translateX(${-p * 9}%) rotateY(${p * 7}deg)`
                        : `perspective(1400px) rotateX(${rx}deg) rotateY(calc(${ry}deg + var(--balanco))) translateX(${ry * 0.8}px)`,
                    }} />
                ))}
              </div>
            </div>
          </div>
          {total === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {vista === 'interior' ? <Armchair className="h-20 w-20 text-tinta/10" /> : <CarFront className="h-24 w-24 text-tinta/10" />}
              <p className="mt-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-tinta/40">Fotografias em breve</p>
            </div>
          )}
        </div>

        {/* Topo: voltar, exterior / interior e aviso de imagem ilustrativa */}
        {voltar && (
          <Link to={voltar.para} className="vidro absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.18em] text-tinta/80 hover:text-tinta lg:left-8 lg:top-5">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">{voltar.rotulo}</span>
          </Link>
        )}
        <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 flex-col items-center gap-2 lg:top-5">
          <div role="tablist" aria-label="Vista" className="vidro flex rounded-full p-1">
            {([['exterior', 'Exterior', CarFront, exterior.length], ['interior', 'Interior', Armchair, interior.length]] as const).map(([k, rotulo, I, qtd]) => (
              <button key={k} type="button" role="tab" aria-selected={vista === k} onClick={() => irPara(k, 0)} disabled={qtd === 0}
                title={qtd === 0 ? `Sem imagens do ${rotulo.toLowerCase()}` : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.18em] transition sm:px-5 ${
                  vista === k ? 'bg-acento text-branco shadow' : 'text-tinta/65 hover:text-tinta disabled:text-tinta/25 disabled:hover:text-tinta/25'}`}>
                <I className="h-4 w-4" />{rotulo}
              </button>
            ))}
          </div>
          {actual?.ilustrativa && (
            <span className="vidro rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-tinta/60">Imagem ilustrativa</span>
          )}
        </div>

        {/* Setas */}
        {total > 1 && (
          <>
            <button type="button" onClick={() => ir(-1)} aria-label="Imagem anterior"
              className={`vidro ${botaoRedondo} absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 lg:left-8`}><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => ir(1)} aria-label="Imagem seguinte"
              className={`vidro ${botaoRedondo} absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 transition-[right] duration-500 ${comPainel ? 'lg:right-[26rem]' : 'lg:right-24'}`}><ChevronRight className="h-5 w-5" /></button>
          </>
        )}

        {/* Barra lateral de painéis (ecrãs largos) */}
        {paineis.length > 0 && (
          <div className="vidro absolute right-8 top-5 z-10 hidden flex-col gap-1 rounded-full p-1 lg:flex" role="toolbar" aria-label="Painéis">
            {paineis.map(({ chave, rotulo, icone: I }) => (
              <button key={chave} type="button" aria-label={rotulo} title={rotulo} aria-pressed={painel === chave}
                onClick={() => setPainel((x) => (x === chave ? null : chave))}
                className={`${botaoRedondo} ${painel === chave ? 'bg-acento text-branco hover:bg-acento hover:text-branco' : ''}`}><I className="h-[18px] w-[18px]" /></button>
            ))}
          </div>
        )}
        {activo && (
          <aside className="vidro absolute bottom-24 right-24 top-5 z-10 hidden w-[19rem] flex-col overflow-y-auto rounded-2xl p-6 lg:flex" aria-label={activo.rotulo}>
            <div className="mb-5 flex items-center justify-between">
              <p className={sobretitulo}>{activo.rotulo}</p>
              <button type="button" onClick={() => setPainel(null)} aria-label="Fechar painel" className="rounded-full p-1 text-tinta/50 hover:bg-tinta/10 hover:text-tinta"><X className="h-4 w-4" /></button>
            </div>
            {activo.conteudo(controlo)}
          </aside>
        )}

        {/* Controlos: dica de interacção, zoom e ecrã inteiro */}
        <div className="vidro absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-full p-1 lg:bottom-6 lg:left-8">
          {total > 0 && (
            <span className="hidden items-center gap-2 px-3 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-tinta/60 sm:flex">
              {vista === 'interior' || !rodavel ? <Move3d className="h-4 w-4 text-acento-claro" /> : <Rotate3d className="h-4 w-4 text-acento-claro" />} {dica}
            </span>
          )}
          <button type="button" onClick={() => ampliar(-0.5)} disabled={zoom <= 1} aria-label="Reduzir" className={botaoRedondo}><ZoomOut className="h-[18px] w-[18px]" /></button>
          <span className="w-12 text-center font-display text-xs font-semibold tabular-nums text-tinta/70">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => ampliar(0.5)} disabled={zoom >= 3 || !total} aria-label="Ampliar" className={botaoRedondo}><ZoomIn className="h-[18px] w-[18px]" /></button>
          <span className="mx-1 h-5 w-px bg-tinta/10" />
          <button type="button" onClick={ecraInteiro} aria-label={cheio ? 'Sair do ecrã inteiro' : 'Ecrã inteiro'} className={botaoRedondo}>
            {cheio ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
          </button>
        </div>

        {/* Miniaturas e contador */}
        {total > 1 && (
          <div className={`absolute bottom-4 right-4 z-10 flex items-center gap-3 lg:bottom-6 ${comPainel ? 'lg:right-24' : 'lg:right-8'}`}>
            <div className="hidden max-w-[32rem] gap-1.5 overflow-x-auto md:flex">
              {fotos.map((f, i) => (
                <button key={f.url} type="button" onClick={() => { setN(i); setPan(null) }} aria-label={`Imagem ${i + 1}`} aria-current={i === n}
                  className={`h-12 w-16 shrink-0 overflow-hidden rounded-md bg-base-800 ring-2 transition ${i === n ? 'ring-acento' : 'opacity-60 ring-transparent hover:opacity-100'}`}>
                  <img src={reduzida(f.url, 160)} alt="" className={`h-full w-full ${f.estudio ? 'object-contain' : 'object-cover'}`} draggable={false} />
                </button>
              ))}
            </div>
            <span className="vidro rounded-full px-3 py-2 font-display text-xs font-semibold tabular-nums text-tinta/80">{n + 1} / {total}</span>
          </div>
        )}
      </section>

      {/* Em telemóvel, os painéis aparecem por baixo do palco */}
      {paineisNoTelemovel && paineis.length > 0 && (
        <div className="space-y-8 border-b border-tinta/[0.06] px-4 py-8 lg:hidden">
          {paineis.map((x) => (
            <div key={x.chave}>
              <p className={sobretitulo}>{x.rotulo}</p>
              <div className="mt-4">{x.conteudo(controlo)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
