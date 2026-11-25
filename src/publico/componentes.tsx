import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CarFront, CheckCircle2, Fuel, Gauge, Settings2 } from 'lucide-react'
import { api } from '../lib/api'
import { capa, reduzida } from '../lib/cloudinary'
import { fmtKz } from '../lib/format'
import { ilustrativasDe } from '../lib/ilustrativas'
import type { ViaturaPublica } from '../types'

export const campoPub =
  'w-full rounded-lg border border-tinta/10 bg-base-800/80 px-3.5 py-3 text-sm text-tinta placeholder:text-tinta/35 outline-none transition focus:border-acento/70 focus:ring-2 focus:ring-acento/25'
export const botaoPub =
  'inline-flex items-center justify-center gap-2 rounded-full bg-acento px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-branco shadow-[0_10px_30px_-10px_rgb(224_38_47/0.8)] transition hover:bg-acento-claro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:opacity-60'
export const botaoContorno =
  'inline-flex items-center justify-center gap-2 rounded-full border border-tinta/20 px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-tinta transition hover:border-tinta/50 hover:bg-tinta/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'
export const sobretitulo = 'font-display text-xs font-semibold uppercase tracking-[0.28em] text-acento-claro'

export function Cabecalho({ titulo, texto, imagem, sobre }: { titulo: string; texto?: string; imagem?: string; sobre?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-tinta/5 bg-base-950">
      {imagem && <img src={reduzida(imagem, 1800)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
      <div className="absolute inset-0 bg-gradient-to-r from-base-950 via-base-950/80 to-base-950/20" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-base-950 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
        {sobre && <p className={sobretitulo}>{sobre}</p>}
        <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight text-tinta sm:text-6xl">{titulo}</h1>
        <span className="mt-6 block h-0.5 w-16 bg-acento" />
        {texto && <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-tinta/70">{texto}</p>}
      </div>
    </section>
  )
}

export function CartaoViatura({ v }: { v: ViaturaPublica }) {
  const propria = capa(v.fotos)
  const ilustrativa = propria ? undefined : ilustrativasDe(v.marca, v.modelo, v.cor)?.exterior[0]
  const foto = propria ?? ilustrativa?.url
  const dados = [
    v.combustivel && { i: Fuel, t: v.combustivel },
    v.transmissao && { i: Settings2, t: v.transmissao },
    v.quilometragem != null && { i: Gauge, t: `${v.quilometragem.toLocaleString('pt-AO')} km` },
  ].filter(Boolean) as { i: typeof Fuel; t: string }[]
  return (
    <Link to={`/viaturas/${v.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-tinta/[0.06] bg-base-900 transition duration-300 hover:-translate-y-1 hover:border-tinta/15 hover:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]">
      <div className="palco-exterior relative isolate aspect-[16/10] overflow-hidden">
        {foto ? (
          ilustrativa ? (
            <>
              <div className="foco-estudio absolute inset-0" />
              <img src={foto} alt={`${v.marca} ${v.modelo} (imagem ilustrativa)`} loading="lazy"
                className="imagem-estudio relative h-full w-full scale-110 object-contain transition duration-700 group-hover:scale-[1.16]" />
            </>
          ) : (
            <img src={reduzida(foto, 800)} alt={`${v.marca} ${v.modelo}`} loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-tinta/15"><CarFront className="h-16 w-16" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-base-900 to-transparent" />
        {v.ano && <span className="vidro absolute left-3 top-3 rounded-full px-3 py-1 font-display text-xs font-semibold tracking-wider text-tinta">{v.ano}</span>}
      </div>
      <div className="relative -mt-6 flex flex-1 flex-col px-5 pb-5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.24em] text-acento-claro">{v.marca}</p>
        <h3 className="mt-1 font-display text-2xl font-bold uppercase leading-tight text-tinta">{v.modelo}</h3>
        <div className="mb-5 mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-tinta/55">
          {dados.map(({ i: I, t }) => <span key={t} className="flex items-center gap-1.5"><I className="h-3.5 w-3.5" />{t}</span>)}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-tinta/[0.06] pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-tinta/40">Preço</p>
            <p className="font-display text-xl font-bold text-tinta">{v.preco_venda != null ? fmtKz(v.preco_venda) : 'Sob consulta'}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-tinta/15 text-tinta/70 transition group-hover:border-acento group-hover:bg-acento group-hover:text-branco">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function Campo({ rotulo, children, largo }: { rotulo: string; children: (id: string) => ReactNode; largo?: boolean }) {
  const id = useId()
  return (
    <div className={largo ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-tinta/50">{rotulo}</label>
      {children(id)}
    </div>
  )
}

/** Formulário de contacto do site (fica registado em Pedidos do site, na área reservada). */
export function FormContacto({ tipo, viaturaId, titulo, comViatura, extra, mensagemInicial = '' }: {
  tipo: 'contacto' | 'viatura' | 'compramos' | 'intermediacao'
  viaturaId?: string
  titulo?: string
  comViatura?: boolean
  extra?: ReactNode
  mensagemInicial?: string
}) {
  const [f, setF] = useState({ nome: '', telefone: '', email: '', mensagem: mensagemInicial, dados_viatura: '' })
  const [estado, setEstado] = useState<'' | 'a_enviar' | 'enviado'>('')
  const [erro, setErro] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (!f.telefone.trim() && !f.email.trim()) {
      setErro('Indique um telefone ou um email para o contactarmos.')
      return
    }
    try {
      setEstado('a_enviar')
      await api.publico.contacto({ tipo, viatura_id: viaturaId, nome: f.nome.trim(), telefone: f.telefone.trim() || null,
        email: f.email.trim() || null, mensagem: f.mensagem.trim() || null, dados_viatura: f.dados_viatura.trim() || null })
      setEstado('enviado')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar. Tente novamente.')
      setEstado('')
    }
  }

  if (estado === 'enviado') {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-7 text-emerald-200">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
        <div>
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-tinta">Pedido enviado</p>
          <p className="mt-1 text-sm text-tinta/60">Obrigado. A nossa equipa entra em contacto consigo brevemente.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-tinta/[0.07] bg-base-900 p-6 sm:p-8">
      {titulo && <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-tinta">{titulo}</h2>}
      {titulo && <span className="mt-3 block h-0.5 w-10 bg-acento" />}
      {extra}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome *" largo>{(id) =>
          <input id={id} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={campoPub} required minLength={2} autoComplete="name" />}
        </Campo>
        <Campo rotulo="Telefone">{(id) =>
          <input id={id} value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} className={campoPub} inputMode="tel" autoComplete="tel" placeholder="+244 9XX XXX XXX" />}
        </Campo>
        <Campo rotulo="Email">{(id) =>
          <input id={id} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campoPub} autoComplete="email" />}
        </Campo>
        {comViatura && (
          <Campo rotulo="A sua viatura *" largo>{(id) =>
            <input id={id} value={f.dados_viatura} onChange={(e) => setF({ ...f, dados_viatura: e.target.value })} className={campoPub}
              placeholder="Marca, modelo, ano e quilómetros" required />}
          </Campo>
        )}
        <Campo rotulo="Mensagem" largo>{(id) =>
          <textarea id={id} rows={4} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} className={campoPub} />}
        </Campo>
      </div>
      {erro && <p role="alert" className="mt-4 text-sm text-acento-claro">{erro}</p>}
      <button type="submit" disabled={estado === 'a_enviar'} className={`${botaoPub} mt-6 w-full`}>{estado === 'a_enviar' ? 'A enviar...' : 'Enviar pedido'}</button>
    </form>
  )
}
