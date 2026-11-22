import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, HandCoins, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Cliente, Proposta, Viatura } from '../types'
import { badgeEstado, fmtData, fmtKz } from '../lib/format'
import { FORMAS_PAGAMENTO, tem } from '../lib/perfis'
import { EmptyState, Modal, PageHeader, Spinner, btnPrimario, btnSecundario, campoCls, labelCls } from '../components/ui'

const nomeViatura = (p: Proposta) =>
  p.viatura ? `${p.viatura.marca} ${p.viatura.modelo}${p.viatura.matricula ? ` · ${p.viatura.matricula}` : ''}` : '—'

export default function Propostas() {
  const { usuario } = useAuth()
  const decide = tem(usuario, 'propostas.decidir')
  const vende = tem(usuario, 'vendas.registar')
  const veTodas = tem(usuario, 'propostas.ver_todas', 'propostas.decidir')
  const [sp, setSp] = useSearchParams()
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [nova, setNova] = useState(() => !!sp.get('viatura'))   // vindo de Viaturas → "Registar proposta"
  const [aVender, setAVender] = useState<Proposta | null>(null)

  async function carregar() {
    try {
      setLoading(true)
      setPropostas(await api.propostas.listar())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar propostas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function fecharNova() {
    setNova(false)
    if (sp.get('viatura')) setSp({}, { replace: true })
  }

  async function mudarEstado(p: Proposta, estado: string) {
    try {
      await api.propostas.mudarEstado(p.id, estado)
      toast.success(estado === 'Aceite' ? 'Proposta aceite: a viatura ficou reservada para o cliente.' : 'Proposta recusada.')
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao actualizar a proposta')
    }
  }

  function eliminar(p: Proposta) {
    toast(`Eliminar a proposta ${p.numero ?? ''}?`, {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await api.propostas.eliminar(p.id)
            toast.success('Proposta eliminada.')
            await carregar()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao eliminar')
          }
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Propostas"
        descricao={veTodas ? 'Propostas dos clientes: aceite (reserva a viatura), recuse ou converta em venda.' : 'As suas propostas de venda.'}
        acao={tem(usuario, 'propostas.registar') ? <button type="button" onClick={() => setNova(true)} className={btnPrimario}><Plus className="h-4 w-4" /> Nova proposta</button> : undefined}
      />

      {loading ? <Spinner texto="A carregar propostas..." /> : propostas.length === 0 ? (
        <EmptyState titulo="Ainda não há propostas" descricao="Registe a proposta de um cliente para uma viatura disponível." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Proposta</th>
                <th className="px-5 py-3 font-medium">Viatura</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 text-right font-medium">Valor proposto</th>
                <th className="px-5 py-3 font-medium">Pagamento</th>
                {veTodas && <th className="px-5 py-3 font-medium">Vendedor</th>}
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Acções</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3"><p className="font-mono text-xs font-medium text-slate-800">{p.numero}</p><p className="text-xs text-slate-500">{fmtData(p.data)}</p></td>
                  <td className="px-5 py-3 text-slate-700">{nomeViatura(p)}</td>
                  <td className="px-5 py-3"><p className="text-slate-800">{p.cliente?.nome ?? '—'}</p><p className="text-xs text-slate-500">{p.cliente?.telefone ?? ''}</p></td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">{fmtKz(p.valor_proposto)}</td>
                  <td className="px-5 py-3 text-slate-600">{p.forma_pagamento ?? '—'}</td>
                  {veTodas && <td className="px-5 py-3 text-slate-600">{p.vendedor ?? '—'}</td>}
                  <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeEstado(p.estado)}`}>{p.estado}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {decide && p.estado === 'Pendente' && (
                        <button type="button" title="Aceitar (reserva a viatura)" onClick={() => mudarEstado(p, 'Aceite')}
                          className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-700"><Check className="h-4 w-4" /></button>
                      )}
                      {decide && (p.estado === 'Pendente' || p.estado === 'Aceite') && (
                        <button type="button" title="Recusar" onClick={() => mudarEstado(p, 'Recusada')}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                      )}
                      {vende && (p.estado === 'Pendente' || p.estado === 'Aceite') && (
                        <button type="button" title="Registar a venda" onClick={() => setAVender(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><HandCoins className="h-4 w-4" /></button>
                      )}
                      {(p.estado === 'Pendente' || p.estado === 'Recusada') && (decide || p.vendedor_id === usuario?.id) && (
                        <button type="button" title="Eliminar" onClick={() => eliminar(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nova && <NovaProposta viaturaInicial={sp.get('viatura') ?? ''} onClose={fecharNova} onCriada={() => { fecharNova(); carregar() }} />}
      {aVender && <ConverterEmVenda proposta={aVender} onClose={() => setAVender(null)} onVendida={() => { setAVender(null); carregar() }} />}
    </div>
  )
}

function NovaProposta({ viaturaInicial, onClose, onCriada }: { viaturaInicial: string; onClose: () => void; onCriada: () => void }) {
  const [viaturas, setViaturas] = useState<Viatura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [viaturaId, setViaturaId] = useState(viaturaInicial)
  const [clienteId, setClienteId] = useState('')
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [aGuardar, setAGuardar] = useState(false)

  useEffect(() => {
    Promise.all([api.viaturas.listar('Disponível'), api.clientes.listar()])
      .then(([v, c]) => {
        setViaturas(v.filter((x) => x.estado === 'Disponível'))
        setClientes(c)
        const inicial = v.find((x) => x.id === viaturaInicial)
        if (inicial?.preco_venda != null) setValor(String(inicial.preco_venda))
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar dados'))
  }, [viaturaInicial])

  function escolherViatura(id: string) {
    setViaturaId(id)
    const v = viaturas.find((x) => x.id === id)
    if (v?.preco_venda != null) setValor(String(v.preco_venda))
  }

  const escolhida = viaturas.find((x) => x.id === viaturaId)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    try {
      setAGuardar(true)
      await api.propostas.criar({ viatura_id: viaturaId, cliente_id: clienteId, valor_proposto: Number(valor),
        forma_pagamento: forma || null, observacoes: observacoes.trim() || null })
      toast.success('Proposta registada.')
      onCriada()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registar a proposta')
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nova proposta" subtitle="Proposta de um cliente para uma viatura disponível.">
      <form onSubmit={guardar} className="space-y-4">
        <div><label className={labelCls}>Viatura *</label>
          <select value={viaturaId} onChange={(e) => escolherViatura(e.target.value)} className={campoCls} required>
            <option value="">— escolher —</option>
            {viaturas.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.ano ?? ''} · {v.matricula ?? v.chassis}</option>)}
          </select>
          {escolhida && <p className="mt-1 text-xs text-slate-500">Preço de venda: {escolhida.preco_venda != null ? fmtKz(escolhida.preco_venda) : 'por definir'}</p>}
        </div>
        <div><label className={labelCls}>Cliente *</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={campoCls} required>
            <option value="">— escolher —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.documento ? ` · ${c.documento}` : ''}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-500">Cliente novo? Registe-o primeiro em <Link to="/admin/clientes" className="text-blue-600 hover:underline">Clientes</Link>.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>Valor proposto (Kz) *</label>
            <input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={campoCls} required /></div>
          <div><label className={labelCls}>Forma de pagamento</label>
            <select value={forma} onChange={(e) => setForma(e.target.value)} className={campoCls}>
              <option value="">— a combinar —</option>{FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
            </select></div>
        </div>
        <div><label className={labelCls}>Observações</label>
          <textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={campoCls} /></div>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className={btnSecundario}>Cancelar</button>
          <button type="submit" disabled={aGuardar} className={btnPrimario}>{aGuardar ? 'A guardar...' : 'Registar proposta'}</button>
        </div>
      </form>
    </Modal>
  )
}

function ConverterEmVenda({ proposta, onClose, onVendida }: { proposta: Proposta; onClose: () => void; onVendida: () => void }) {
  const [preco, setPreco] = useState(String(proposta.valor_proposto))
  const [forma, setForma] = useState(proposta.forma_pagamento ?? 'Transferência bancária')
  const [aGuardar, setAGuardar] = useState(false)

  async function vender(e: FormEvent) {
    e.preventDefault()
    try {
      setAGuardar(true)
      const venda = await api.vendas.criar({ proposta_id: proposta.id, preco_venda: Number(preco), forma_pagamento: forma })
      toast.success(`Venda ${venda.numero} registada.`, {
        action: { label: 'Ver recibo', onClick: () => window.open(`/admin/vendas/${venda.id}/recibo`, '_blank') },
      })
      onVendida()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registar a venda')
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Registar venda" subtitle={`${nomeViatura(proposta)} → ${proposta.cliente?.nome ?? ''}`}>
      <form onSubmit={vender} className="space-y-4">
        <div><label className={labelCls}>Preço de venda (Kz) *</label>
          <input type="number" min={0} step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className={campoCls} required /></div>
        <div><label className={labelCls}>Forma de pagamento *</label>
          <select value={forma} onChange={(e) => setForma(e.target.value)} className={campoCls}>{FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}</select></div>
        <p className="text-xs text-slate-500">A viatura passa a «Vendido» e as outras propostas para ela ficam recusadas.</p>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className={btnSecundario}>Cancelar</button>
          <button type="submit" disabled={aGuardar} className={btnPrimario}>{aGuardar ? 'A registar...' : 'Registar venda'}</button>
        </div>
      </form>
    </Modal>
  )
}
