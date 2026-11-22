import { useEffect, useState } from 'react'
import { Check, MessageCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { PedidoContacto } from '../types'
import { fmtDataHora } from '../lib/format'
import { EmptyState, PageHeader, Spinner } from '../components/ui'

const TIPOS: Record<string, string> = {
  contacto: 'Contacto', viatura: 'Interesse em viatura', compramos: 'Compramos o seu carro', intermediacao: 'Intermediação',
}

/** Mensagens enviadas pelos formulários do site público. */
export default function Pedidos() {
  const [lista, setLista] = useState<PedidoContacto[] | null>(null)
  const carregar = () => api.site.pedidos().then(setLista).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro'))
  useEffect(() => {
    carregar()
  }, [])

  async function marcar(p: PedidoContacto, tratado: boolean) {
    await api.site.tratarPedido(p.id, tratado)
    carregar()
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Pedidos do site" descricao="Contactos, interesse em viaturas, propostas de compra e pedidos de intermediação." />
      {!lista ? <Spinner /> : lista.length === 0 ? <EmptyState titulo="Ainda não há pedidos" descricao="As mensagens dos formulários do site aparecem aqui." /> : (
        <div className="space-y-3">
          {lista.map((p) => {
            const wa = (p.telefone ?? '').replace(/\D/g, '')
            return (
              <div key={p.id} className={`rounded-xl border bg-white p-5 shadow-sm ${p.tratado ? 'border-slate-200 opacity-60' : 'border-blue-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{TIPOS[p.tipo] ?? p.tipo}{p.viatura ? ` · ${p.viatura}` : ''}</p>
                    <p className="mt-1 font-semibold text-slate-900">{p.nome}</p>
                    <p className="text-sm text-slate-600">{[p.telefone, p.email].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{fmtDataHora(p.data)}</span>
                    {wa && <a href={`https://wa.me/${wa.length === 9 ? `244${wa}` : wa}`} target="_blank" rel="noreferrer" title="Responder pelo WhatsApp"
                      className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"><MessageCircle className="h-4 w-4" /></a>}
                    {p.tratado
                      ? <button type="button" title="Marcar como por tratar" onClick={() => marcar(p, false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button>
                      : <button type="button" onClick={() => marcar(p, true)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"><Check className="h-3.5 w-3.5" /> Tratado</button>}
                  </div>
                </div>
                {p.dados_viatura && <p className="mt-3 text-sm text-slate-700"><b>Viatura do cliente:</b> {p.dados_viatura}</p>}
                {p.mensagem && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{p.mensagem}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
