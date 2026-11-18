import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CreditCard, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { Aluguer, Pagamento } from '../types'
import {
  badgeEstado,
  fmtDataHora,
  fmtKz,
  inputDateTimeDaquiA,
} from '../lib/format'
import {
  EmptyState,
  Modal,
  PageHeader,
  Spinner,
  btnPrimario,
  btnSecundario,
  campoCls,
  labelCls,
} from '../components/ui'

const METODOS = ['Numerário', 'Transferência', 'Multicaixa', 'Cartão', 'Cheque']
const ESTADOS = ['Pago', 'Pendente']

interface Formulario {
  aluguer_id: string
  valor: string
  metodo: string
  estado: string
  data: string
}

function formularioVazio(): Formulario {
  return {
    aluguer_id: '',
    valor: '',
    metodo: 'Numerário',
    estado: 'Pago',
    data: inputDateTimeDaquiA(0),
  }
}

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [alugueres, setAlugueres] = useState<Aluguer[]>([])
  const [loading, setLoading] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [formulario, setFormulario] = useState<Formulario>(formularioVazio)
  const [aGuardar, setAGuardar] = useState(false)

  async function carregar() {
    try {
      setLoading(true)
      const [listaPagamentos, listaAlugueres] = await Promise.all([
        api.pagamentos.listar(),
        api.alugueres.listar(),
      ])
      setPagamentos(listaPagamentos)
      setAlugueres(listaAlugueres)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const aluguerPorId = useMemo(() => {
    const mapa = new Map<string, Aluguer>()
    alugueres.forEach((a) => mapa.set(a.id, a))
    return mapa
  }, [alugueres])

  const pagoPorAluguer = useMemo(() => {
    const mapa = new Map<string, number>()
    pagamentos
      .filter((p) => p.estado === 'Pago')
      .forEach((p) => {
        mapa.set(p.aluguer_id, (mapa.get(p.aluguer_id) ?? 0) + p.valor)
      })
    return mapa
  }, [pagamentos])

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    return pagamentos.filter((p) => {
      const aluguer = aluguerPorId.get(p.aluguer_id)
      const correspondeEstado = !filtroEstado || p.estado === filtroEstado
      const correspondePesquisa =
        !termo ||
        [
          aluguer?.numero ?? '',
          aluguer?.cliente?.nome ?? '',
          p.metodo ?? '',
          p.estado,
        ]
          .join(' ')
          .toLowerCase()
          .includes(termo)
      return correspondeEstado && correspondePesquisa
    })
  }, [pagamentos, pesquisa, filtroEstado, aluguerPorId])

  const totais = useMemo(() => {
    const recebido = pagamentos
      .filter((p) => p.estado === 'Pago')
      .reduce((soma, p) => soma + p.valor, 0)
    const pendente = pagamentos
      .filter((p) => p.estado === 'Pendente')
      .reduce((soma, p) => soma + p.valor, 0)
    return { recebido, pendente }
  }, [pagamentos])

  const aluguerSelecionado = formulario.aluguer_id
    ? aluguerPorId.get(formulario.aluguer_id)
    : undefined
  const pagoSelecionado = formulario.aluguer_id
    ? (pagoPorAluguer.get(formulario.aluguer_id) ?? 0)
    : 0
  const emFalta = aluguerSelecionado
    ? Math.max(0, aluguerSelecionado.total - pagoSelecionado)
    : 0

  function abrirNovo() {
    const base = formularioVazio()
    const comSaldo = alugueres.find(
      (a) =>
        a.estado !== 'Cancelado' &&
        Math.max(0, a.total - (pagoPorAluguer.get(a.id) ?? 0)) > 0,
    )
    const alvo = comSaldo ?? alugueres[0]
    if (alvo) {
      base.aluguer_id = alvo.id
      base.valor = String(
        Math.max(0, alvo.total - (pagoPorAluguer.get(alvo.id) ?? 0)) || alvo.total,
      )
    }
    setFormulario(base)
    setModalAberto(true)
  }

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((atual) => {
      const proximo = { ...atual, [campo]: valor }
      if (campo === 'aluguer_id') {
        const aluguer = aluguerPorId.get(valor)
        if (aluguer) {
          const falta = Math.max(0, aluguer.total - (pagoPorAluguer.get(valor) ?? 0))
          proximo.valor = String(falta || aluguer.total)
        }
      }
      return proximo
    })
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!formulario.aluguer_id) {
      toast.error('Escolha o aluguer.')
      return
    }
    const valor = Number(formulario.valor)
    if (Number.isNaN(valor) || valor <= 0) {
      toast.error('Indique um valor válido.')
      return
    }

    try {
      setAGuardar(true)
      await api.pagamentos.criar({
        aluguer_id: formulario.aluguer_id,
        valor,
        metodo: formulario.metodo || null,
        estado: formulario.estado,
        data: formulario.data || null,
      })
      toast.success('Pagamento registado com sucesso.')
      setModalAberto(false)
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registar pagamento')
    } finally {
      setAGuardar(false)
    }
  }

  function eliminar(pagamento: Pagamento) {
    toast('Eliminar este pagamento?', {
      description: `${fmtKz(pagamento.valor)} · ${pagamento.metodo ?? 'Sem método'}`,
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await api.pagamentos.eliminar(pagamento.id)
            toast.success('Pagamento eliminado.')
            await carregar()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao eliminar pagamento')
          }
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Pagamentos"
        descricao="Registo de pagamentos e valores por cobrar."
        acao={
          <button type="button" onClick={abrirNovo} className={btnPrimario}>
            <Plus className="h-4 w-4" /> Novo pagamento
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total recebido
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{fmtKz(totais.recebido)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pendente
          </p>
          <p className="mt-1 text-xl font-bold text-amber-600">{fmtKz(totais.pendente)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Nº de pagamentos
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">{pagamentos.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por aluguer, cliente, método..."
            className={`${campoCls} pl-10`}
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className={`${campoCls} sm:w-52`}
        >
          <option value="">Todos os estados</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner texto="A carregar pagamentos..." />
      ) : filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum pagamento encontrado"
          descricao={
            pagamentos.length === 0
              ? 'Ainda não há pagamentos registados.'
              : 'Tente ajustar a pesquisa ou o filtro de estado.'
          }
          acao={
            pagamentos.length === 0 ? (
              <button type="button" onClick={abrirNovo} className={btnPrimario}>
                <Plus className="h-4 w-4" /> Registar pagamento
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Aluguer</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Método</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Valor</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((pagamento) => {
                const aluguer = aluguerPorId.get(pagamento.aluguer_id)
                return (
                  <tr
                    key={pagamento.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {fmtDataHora(pagamento.data)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">
                          {aluguer?.numero ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-900">
                      {aluguer?.cliente?.nome ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {pagamento.metodo ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeEstado(
                          pagamento.estado,
                        )}`}
                      >
                        {pagamento.estado}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                      {fmtKz(pagamento.valor)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => eliminar(pagamento)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Novo pagamento"
        subtitle="Registe um pagamento associado a um aluguer."
        wide
      >
        <form onSubmit={guardar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Aluguer *</label>
            <select
              value={formulario.aluguer_id}
              onChange={(e) => atualizarCampo('aluguer_id', e.target.value)}
              className={campoCls}
              required
            >
              <option value="">— escolher aluguer —</option>
              {alugueres.map((aluguer) => {
                const falta = Math.max(
                  0,
                  aluguer.total - (pagoPorAluguer.get(aluguer.id) ?? 0),
                )
                return (
                  <option key={aluguer.id} value={aluguer.id}>
                    {aluguer.numero} · {aluguer.cliente?.nome ?? 'Cliente'} ·{' '}
                    {fmtKz(aluguer.total)} (em falta: {fmtKz(falta)})
                  </option>
                )
              })}
            </select>
          </div>

          {aluguerSelecionado && (
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4 text-center sm:col-span-2">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-sm font-semibold text-slate-900">
                  {fmtKz(aluguerSelecionado.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pago</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {fmtKz(pagoSelecionado)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Em falta</p>
                <p className="text-sm font-semibold text-amber-600">{fmtKz(emFalta)}</p>
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Valor (Kz) *</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={formulario.valor}
              onChange={(e) => atualizarCampo('valor', e.target.value)}
              className={campoCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Método</label>
            <select
              value={formulario.metodo}
              onChange={(e) => atualizarCampo('metodo', e.target.value)}
              className={campoCls}
            >
              {METODOS.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select
              value={formulario.estado}
              onChange={(e) => atualizarCampo('estado', e.target.value)}
              className={campoCls}
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Data</label>
            <input
              type="datetime-local"
              value={formulario.data}
              onChange={(e) => atualizarCampo('data', e.target.value)}
              className={campoCls}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className={btnSecundario}
            >
              Cancelar
            </button>
            <button type="submit" disabled={aGuardar} className={btnPrimario}>
              {aGuardar ? 'A guardar...' : 'Registar pagamento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
