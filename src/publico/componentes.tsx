import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CarFront, CheckCircle2, Fuel, Gauge, Settings2 } from 'lucide-react'
import { api } from '../lib/api'
import { reduzida } from '../lib/cloudinary'
import { fmtKz } from '../lib/format'
import type { ViaturaPublica } from '../types'

export const campoPub =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20'
export const botaoPub =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-sky-800 disabled:opacity-60'

export function Cabecalho({ titulo, texto, imagem }: { titulo: string; texto?: string; imagem?: string }) {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white">
      {imagem && <img src={reduzida(imagem, 1800)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{titulo}</h1>
        {texto && <p className="mt-4 max-w-2xl whitespace-pre-line text-slate-200">{texto}</p>}
      </div>
    </section>
  )
}

export function CartaoViatura({ v }: { v: ViaturaPublica }) {
  const dados = [
    v.ano && { i: CarFront, t: String(v.ano) },
    v.combustivel && { i: Fuel, t: v.combustivel },
    v.transmissao && { i: Settings2, t: v.transmissao },
    v.quilometragem != null && { i: Gauge, t: `${v.quilometragem.toLocaleString('pt-AO')} km` },
  ].filter(Boolean) as { i: typeof Fuel; t: string }[]
  return (
    <Link to={`/viaturas/${v.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {v.fotos[0] ? (
          <img src={reduzida(v.fotos[0], 700)} alt={`${v.marca} ${v.modelo}`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300"><CarFront className="h-16 w-16" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{v.marca}</p>
        <h3 className="mt-0.5 text-lg font-bold text-slate-900">{v.modelo}</h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
          {dados.map(({ i: I, t }) => <span key={t} className="flex items-center gap-1"><I className="h-3.5 w-3.5" />{t}</span>)}
        </div>
        <p className="mt-auto pt-4 text-xl font-bold text-slate-900">{v.preco_venda != null ? fmtKz(v.preco_venda) : 'Preço sob consulta'}</p>
      </div>
    </Link>
  )
}

/** Formulário de contacto do site (fica registado em Pedidos do site, na área reservada). */
export function FormContacto({ tipo, viaturaId, titulo, comViatura, extra }: {
  tipo: 'contacto' | 'viatura' | 'compramos' | 'intermediacao'
  viaturaId?: string
  titulo?: string
  comViatura?: boolean
  extra?: ReactNode
}) {
  const [f, setF] = useState({ nome: '', telefone: '', email: '', mensagem: '', dados_viatura: '' })
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
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div><p className="font-semibold">Pedido enviado.</p><p className="text-sm">Entraremos em contacto brevemente.</p></div>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {titulo && <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>}
      {extra}
      <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={campoPub} placeholder="Nome *" required minLength={2} />
      <div className="grid gap-4 sm:grid-cols-2">
        <input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} className={campoPub} placeholder="Telefone" inputMode="tel" />
        <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campoPub} placeholder="Email" />
      </div>
      {comViatura && (
        <input value={f.dados_viatura} onChange={(e) => setF({ ...f, dados_viatura: e.target.value })} className={campoPub}
          placeholder="A sua viatura: marca, modelo, ano e quilómetros *" required />
      )}
      <textarea rows={4} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} className={campoPub} placeholder="Mensagem" />
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button type="submit" disabled={estado === 'a_enviar'} className={`${botaoPub} w-full`}>{estado === 'a_enviar' ? 'A enviar...' : 'Enviar pedido'}</button>
    </form>
  )
}
