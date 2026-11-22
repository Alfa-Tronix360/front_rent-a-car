import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Printer, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Cliente, Venda, Viatura } from '../types'
import { fmtData, fmtKz, hojeInput } from '../lib/format'
import { FORMAS_PAGAMENTO, tem } from '../lib/perfis'
import { EmptyState, Modal, PageHeader, Spinner, btnPrimario, btnSecundario, campoCls, labelCls } from '../components/ui'

export default function Vendas() {
  const { usuario } = useAuth()
  const regista = tem(usuario, 'vendas.registar')
  const veLucro = tem(usuario, 'viaturas.ver_margem')
  const veTodas = tem(usuario, 'vendas.ver_todas', 'vendas.anular')
  const anula = tem(usuario, 'vendas.anular')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [nova, setNova] = useState(false)

  async function carregar() {
    try {
      setLoading(true)
      setVendas(await api.vendas.listar())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function anular(v: Venda) {
    toast(`Anular a venda ${v.numero}?`, {
      description: 'A viatura volta a ficar disponível e a proposta de origem volta a «Pendente».',
      action: {
        label: 'Anular',
        onClick: async () => {
          try {
            await api.vendas.anular(v.id)
            toast.success('Venda anulada.')
            await carregar()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao anular')
          }
        },
      },
    })
  }

  const total = vendas.reduce((s, v) => s + v.preco_venda, 0)
  const lucro = vendas.reduce((s, v) => s + (v.lucro ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Vendas"
        descricao={veTodas ? (veLucro ? 'Vendas registadas, lucro de cada uma e recibos.' : 'Vendas registadas e recibos.') : 'As suas vendas e recibos.'}
        acao={regista ? <button type="button" onClick={() => setNova(true)} className={btnPrimario}><Plus className="h-4 w-4" /> Registar venda</button> : undefined}
      />

      {loading ? <Spinner texto="A carregar vendas..." /> : vendas.length === 0 ? (
        <EmptyState titulo="Ainda não há vendas" descricao={regista ? 'Registe uma venda directamente ou a partir de uma proposta.' : 'As vendas das suas propostas aparecem aqui.'} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Venda</th>
                <th className="px-5 py-3 font-medium">Viatura</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Pagamento</th>
                {veTodas && <th className="px-5 py-3 font-medium">Vendedor</th>}
                <th className="px-5 py-3 text-right font-medium">Preço</th>
                {veLucro && <th className="px-5 py-3 text-right font-medium">Lucro</th>}
                <th className="px-5 py-3 text-right font-medium">Acções</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3"><p className="font-mono text-xs font-medium text-slate-800">{v.numero}</p><p className="text-xs text-slate-500">{fmtData(v.data)}</p></td>
                  <td className="px-5 py-3 text-slate-700">{v.viatura ? `${v.viatura.marca} ${v.viatura.modelo}` : '—'}<p className="font-mono text-xs text-slate-500">{v.viatura?.matricula ?? v.viatura?.chassis ?? ''}</p></td>
                  <td className="px-5 py-3 text-slate-800">{v.cliente?.nome ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{v.forma_pagamento}</td>
                  {veTodas && <td className="px-5 py-3 text-slate-600">{v.vendedor ?? '—'}</td>}
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">{fmtKz(v.preco_venda)}</td>
                  {veLucro && <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${(v.lucro ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmtKz(v.lucro)}</td>}
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/vendas/${v.id}/recibo`} target="_blank" title="Recibo"
                        className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Printer className="h-4 w-4" /></Link>
                      {anula && (
                        <button type="button" title="Anular venda" onClick={() => anular(v)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Undo2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 text-sm font-semibold text-slate-900">
                <td className="px-5 py-3" colSpan={veTodas ? 5 : 4}>{vendas.length} venda(s)</td>
                <td className="whitespace-nowrap px-5 py-3 text-right">{fmtKz(total)}</td>
                {veLucro && <td className="whitespace-nowrap px-5 py-3 text-right text-emerald-700">{fmtKz(lucro)}</td>}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {nova && <NovaVenda onClose={() => setNova(false)} onCriada={() => { setNova(false); carregar() }} />}
    </div>
  )
}

function NovaVenda({ onClose, onCriada }: { onClose: () => void; onCriada: () => void }) {
  const [viaturas, setViaturas] = useState<Viatura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [viaturaId, setViaturaId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [preco, setPreco] = useState('')
  const [forma, setForma] = useState('Transferência bancária')
  const [data, setData] = useState(hojeInput())
  const [observacoes, setObservacoes] = useState('')
  const [aGuardar, setAGuardar] = useState(false)

  useEffect(() => {
    Promise.all([api.viaturas.listar(), api.clientes.listar()])
      .then(([v, c]) => {
        setViaturas(v.filter((x) => x.estado === 'Disponível' || x.estado === 'Reservado'))
        setClientes(c)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar dados'))
  }, [])

  const escolhida = viaturas.find((x) => x.id === viaturaId)
  const lucroPrevisto = escolhida?.custo_total != null && Number(preco) ? Number(preco) - escolhida.custo_total : null

  function escolherViatura(id: string) {
    setViaturaId(id)
    const v = viaturas.find((x) => x.id === id)
    setPreco(v?.preco_venda != null ? String(v.preco_venda) : '')
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    try {
      setAGuardar(true)
      const venda = await api.vendas.criar({ viatura_id: viaturaId, cliente_id: clienteId, preco_venda: Number(preco),
        forma_pagamento: forma, data: `${data}T12:00:00`, observacoes: observacoes.trim() || null })
      toast.success(`Venda ${venda.numero} registada.`, {
        action: { label: 'Ver recibo', onClick: () => window.open(`/vendas/${venda.id}/recibo`, '_blank') },
      })
      onCriada()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registar a venda')
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Registar venda" subtitle="Venda directa de uma viatura disponível ou reservada.">
      <form onSubmit={guardar} className="space-y-4">
        <div><label className={labelCls}>Viatura *</label>
          <select value={viaturaId} onChange={(e) => escolherViatura(e.target.value)} className={campoCls} required>
            <option value="">— escolher —</option>
            {viaturas.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.ano ?? ''} · {v.matricula ?? v.chassis} ({v.estado})</option>)}
          </select></div>
        <div><label className={labelCls}>Cliente *</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={campoCls} required>
            <option value="">— escolher —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.documento ? ` · ${c.documento}` : ''}</option>)}
          </select></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>Preço de venda (Kz) *</label>
            <input type="number" min={0} step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className={campoCls} required />
            {lucroPrevisto != null && <p className={`mt-1 text-xs ${lucroPrevisto >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>Lucro: {fmtKz(lucroPrevisto)}</p>}</div>
          <div><label className={labelCls}>Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campoCls} /></div>
        </div>
        <div><label className={labelCls}>Forma de pagamento *</label>
          <select value={forma} onChange={(e) => setForma(e.target.value)} className={campoCls}>{FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}</select></div>
        <div><label className={labelCls}>Observações</label>
          <textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={campoCls} /></div>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className={btnSecundario}>Cancelar</button>
          <button type="submit" disabled={aGuardar} className={btnPrimario}>{aGuardar ? 'A registar...' : 'Registar venda'}</button>
        </div>
      </form>
    </Modal>
  )
}
