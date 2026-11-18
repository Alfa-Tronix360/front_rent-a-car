import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarCheck, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { Aluguer, Cliente, Veiculo } from '../types'
import {
  badgeEstado,
  fmtData,
  fmtKz,
  inputDateTimeDaquiA,
  paraInputDateTime,
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

const ESTADOS = ['Reservado', 'Ativo', 'Concluído', 'Cancelado']

interface Formulario {
  cliente_id: string
  veiculo_id: string
  data_inicio: string
  data_fim: string
  valor_diaria: string
  estado: string
  observacoes: string
}

function formularioVazio(): Formulario {
  return {
    cliente_id: '',
    veiculo_id: '',
    data_inicio: inputDateTimeDaquiA(0),
    data_fim: inputDateTimeDaquiA(1),
    valor_diaria: '',
    estado: 'Reservado',
    observacoes: '',
  }
}

export default function Alugueres() {
  const [alugueres, setAlugueres] = useState<Aluguer[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Aluguer | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(formularioVazio)
  const [aGuardar, setAGuardar] = useState(false)

  async function carregar() {
    try {
      setLoading(true)
      const [listaAlugueres, listaClientes, listaVeiculos] = await Promise.all([
        api.alugueres.listar(),
        api.clientes.listar(),
        api.veiculos.listar(),
      ])
      setAlugueres(listaAlugueres)
      setClientes(listaClientes)
      setVeiculos(listaVeiculos)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar alugueres')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    return alugueres.filter((a) => {
      const correspondeEstado = !filtroEstado || a.estado === filtroEstado
      const correspondePesquisa =
        !termo ||
        [
          a.numero ?? '',
          a.cliente?.nome ?? '',
          a.veiculo?.matricula ?? '',
          a.veiculo?.marca ?? '',
          a.veiculo?.modelo ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(termo)
      return correspondeEstado && correspondePesquisa
    })
  }, [alugueres, pesquisa, filtroEstado])

  const totais = useMemo(
    () => ({
      ativos: alugueres.filter((a) => a.estado === 'Ativo').length,
      reservados: alugueres.filter((a) => a.estado === 'Reservado').length,
      concluidos: alugueres.filter((a) => a.estado === 'Concluído').length,
      receita: alugueres
        .filter((a) => a.estado !== 'Cancelado')
        .reduce((soma, a) => soma + a.total, 0),
    }),
    [alugueres],
  )

  const previa = useMemo(() => {
    if (!formulario.data_inicio || !formulario.data_fim) return { dias: 0, total: 0 }
    const inicio = new Date(formulario.data_inicio)
    const fim = new Date(formulario.data_fim)
    const dias = Math.max(
      0,
      Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)),
    )
    const valorDiaria = Number(formulario.valor_diaria) || 0
    return { dias, total: dias * valorDiaria }
  }, [formulario.data_inicio, formulario.data_fim, formulario.valor_diaria])

  function abrirNovo() {
    const base = formularioVazio()
    if (clientes.length > 0) base.cliente_id = clientes[0].id
    if (veiculos.length > 0) {
      const primeiro = veiculos[0]
      base.veiculo_id = primeiro.id
      base.valor_diaria = String(primeiro.preco_dia)
    }
    setEditando(null)
    setFormulario(base)
    setModalAberto(true)
  }

  function abrirEdicao(aluguer: Aluguer) {
    setEditando(aluguer)
    setFormulario({
      cliente_id: aluguer.cliente_id,
      veiculo_id: aluguer.veiculo_id,
      data_inicio: paraInputDateTime(aluguer.data_inicio),
      data_fim: paraInputDateTime(aluguer.data_fim),
      valor_diaria: String(aluguer.valor_diaria),
      estado: aluguer.estado,
      observacoes: aluguer.observacoes ?? '',
    })
    setModalAberto(true)
  }

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((atual) => {
      const proximo = { ...atual, [campo]: valor }
      if (campo === 'veiculo_id') {
        const veiculo = veiculos.find((v) => v.id === valor)
        if (veiculo) proximo.valor_diaria = String(veiculo.preco_dia)
      }
      return proximo
    })
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!formulario.cliente_id || !formulario.veiculo_id) {
      toast.error('Escolha o cliente e o veículo.')
      return
    }
    if (!formulario.data_inicio || !formulario.data_fim) {
      toast.error('Indique as datas de início e fim.')
      return
    }
    if (new Date(formulario.data_fim) <= new Date(formulario.data_inicio)) {
      toast.error('A data de fim deve ser posterior à data de início.')
      return
    }
    const valorDiaria = Number(formulario.valor_diaria)
    if (Number.isNaN(valorDiaria) || valorDiaria <= 0) {
      toast.error('Indique um valor de diária válido.')
      return
    }

    const payload = {
      cliente_id: formulario.cliente_id,
      veiculo_id: formulario.veiculo_id,
      data_inicio: formulario.data_inicio,
      data_fim: formulario.data_fim,
      valor_diaria: valorDiaria,
      estado: formulario.estado,
      observacoes: formulario.observacoes.trim() || null,
    }

    try {
      setAGuardar(true)
      if (editando) {
        await api.alugueres.atualizar(editando.id, payload)
        toast.success('Aluguer atualizado com sucesso.')
      } else {
        await api.alugueres.criar(payload)
        toast.success('Aluguer registado com sucesso.')
      }
      setModalAberto(false)
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar aluguer')
    } finally {
      setAGuardar(false)
    }
  }

  function eliminar(aluguer: Aluguer) {
    toast(`Eliminar o aluguer ${aluguer.numero}?`, {
      description: 'Os pagamentos associados também serão eliminados.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await api.alugueres.eliminar(aluguer.id)
            toast.success('Aluguer eliminado.')
            await carregar()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao eliminar aluguer')
          }
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Alugueres"
        descricao="Reservas, contratos ativos e histórico de alugueres."
        acao={
          <button type="button" onClick={abrirNovo} className={btnPrimario}>
            <Plus className="h-4 w-4" /> Novo aluguer
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniCartao titulo="Ativos" valor={String(totais.ativos)} cor="text-blue-600" />
        <MiniCartao titulo="Reservados" valor={String(totais.reservados)} cor="text-amber-600" />
        <MiniCartao titulo="Concluídos" valor={String(totais.concluidos)} cor="text-emerald-600" />
        <MiniCartao titulo="Valor total" valor={fmtKz(totais.receita)} cor="text-slate-900" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nº, cliente, veículo ou matrícula..."
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
        <Spinner texto="A carregar alugueres..." />
      ) : filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum aluguer encontrado"
          descricao={
            alugueres.length === 0
              ? 'Ainda não há alugueres. Crie a primeira reserva.'
              : 'Tente ajustar a pesquisa ou o filtro de estado.'
          }
          acao={
            alugueres.length === 0 ? (
              <button type="button" onClick={abrirNovo} className={btnPrimario}>
                <Plus className="h-4 w-4" /> Criar aluguer
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Nº</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Veículo</th>
                <th className="px-5 py-3 font-medium">Período</th>
                <th className="px-5 py-3 text-center font-medium">Dias</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((aluguer) => (
                <tr
                  key={aluguer.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{aluguer.numero}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">
                      {aluguer.cliente?.nome ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {aluguer.cliente?.telefone ?? ''}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700">
                      {aluguer.veiculo
                        ? `${aluguer.veiculo.marca} ${aluguer.veiculo.modelo}`
                        : '—'}
                    </p>
                    <p className="font-mono text-xs text-slate-500">
                      {aluguer.veiculo?.matricula ?? ''}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {fmtData(aluguer.data_inicio)} → {fmtData(aluguer.data_fim)}
                  </td>
                  <td className="px-5 py-3 text-center text-slate-600">{aluguer.dias}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                    {fmtKz(aluguer.total)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeEstado(
                        aluguer.estado,
                      )}`}
                    >
                      {aluguer.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(aluguer)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(aluguer)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? `Editar aluguer ${editando.numero ?? ''}` : 'Novo aluguer'}
        subtitle={
          editando
            ? 'Altere os dados da reserva ou o estado do aluguer.'
            : 'Crie uma reserva ou inicie um novo aluguer.'
        }
        wide
      >
        <form onSubmit={guardar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cliente *</label>
            <select
              value={formulario.cliente_id}
              onChange={(e) => atualizarCampo('cliente_id', e.target.value)}
              className={campoCls}
              required
            >
              <option value="">— escolher cliente —</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                  {cliente.telefone ? ` · ${cliente.telefone}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Veículo *</label>
            <select
              value={formulario.veiculo_id}
              onChange={(e) => atualizarCampo('veiculo_id', e.target.value)}
              className={campoCls}
              required
            >
              <option value="">— escolher veículo —</option>
              {veiculos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.marca} {veiculo.modelo} · {veiculo.matricula} (
                  {veiculo.estado})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Data e hora de início *</label>
            <input
              type="datetime-local"
              value={formulario.data_inicio}
              onChange={(e) => atualizarCampo('data_inicio', e.target.value)}
              className={campoCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Data e hora de fim *</label>
            <input
              type="datetime-local"
              value={formulario.data_fim}
              onChange={(e) => atualizarCampo('data_fim', e.target.value)}
              className={campoCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Valor da diária (Kz) *</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={formulario.valor_diaria}
              onChange={(e) => atualizarCampo('valor_diaria', e.target.value)}
              className={campoCls}
              required
            />
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
          <div className="sm:col-span-2">
            <label className={labelCls}>Observações</label>
            <textarea
              value={formulario.observacoes}
              onChange={(e) => atualizarCampo('observacoes', e.target.value)}
              className={`${campoCls} min-h-20 resize-y`}
              placeholder="Notas sobre a reserva, caução, condições, etc."
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-4 sm:col-span-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {previa.dias} dia(s) × {fmtKz(Number(formulario.valor_diaria) || 0)}
              </span>
              <span className="text-base font-bold text-slate-900">
                Total: {fmtKz(previa.total)}
              </span>
            </div>
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
              {aGuardar ? 'A guardar...' : editando ? 'Guardar alterações' : 'Registar aluguer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function MiniCartao({
  titulo,
  valor,
  cor,
}: {
  titulo: string
  valor: string
  cor: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className={`mt-1 text-xl font-bold ${cor}`}>{valor}</p>
    </div>
  )
}
