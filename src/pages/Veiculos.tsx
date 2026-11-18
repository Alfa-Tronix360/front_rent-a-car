import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Car, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { Veiculo } from '../types'
import { badgeEstado, fmtKz } from '../lib/format'
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

const CATEGORIAS = ['Económico', 'Sedan', 'SUV', 'Pickup', 'Van', 'Luxo']
const COMBUSTIVEIS = ['Gasolina', 'Diesel', 'Elétrico', 'Híbrido']
const TRANSMISSOES = ['Manual', 'Automática']
const ESTADOS = ['Disponível', 'Alugado', 'Manutenção']

interface Formulario {
  matricula: string
  marca: string
  modelo: string
  ano: string
  categoria: string
  combustivel: string
  transmissao: string
  lugares: string
  preco_dia: string
  estado: string
}

const formularioVazio: Formulario = {
  matricula: '',
  marca: '',
  modelo: '',
  ano: String(new Date().getFullYear()),
  categoria: 'Económico',
  combustivel: 'Gasolina',
  transmissao: 'Manual',
  lugares: '5',
  preco_dia: '',
  estado: 'Disponível',
}

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Veiculo | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(formularioVazio)
  const [aGuardar, setAGuardar] = useState(false)

  async function carregar() {
    try {
      setLoading(true)
      const dados = await api.veiculos.listar()
      setVeiculos(dados)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar veículos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    return veiculos.filter((v) => {
      const correspondePesquisa =
        !termo ||
        [v.matricula, v.marca, v.modelo, v.categoria ?? '', v.combustivel ?? '']
          .join(' ')
          .toLowerCase()
          .includes(termo)
      const correspondeEstado = !filtroEstado || v.estado === filtroEstado
      return correspondePesquisa && correspondeEstado
    })
  }, [veiculos, pesquisa, filtroEstado])

  function abrirNovo() {
    setEditando(null)
    setFormulario(formularioVazio)
    setModalAberto(true)
  }

  function abrirEdicao(veiculo: Veiculo) {
    setEditando(veiculo)
    setFormulario({
      matricula: veiculo.matricula,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano ? String(veiculo.ano) : '',
      categoria: veiculo.categoria ?? '',
      combustivel: veiculo.combustivel ?? '',
      transmissao: veiculo.transmissao ?? '',
      lugares: String(veiculo.lugares ?? 5),
      preco_dia: String(veiculo.preco_dia ?? ''),
      estado: veiculo.estado,
    })
    setModalAberto(true)
  }

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!formulario.matricula.trim() || !formulario.marca.trim() || !formulario.modelo.trim()) {
      toast.error('Preencha a matrícula, a marca e o modelo.')
      return
    }
    const preco = Number(formulario.preco_dia)
    if (!formulario.preco_dia || Number.isNaN(preco) || preco <= 0) {
      toast.error('Indique um preço por dia válido.')
      return
    }

    const payload: Partial<Veiculo> = {
      matricula: formulario.matricula.trim().toUpperCase(),
      marca: formulario.marca.trim(),
      modelo: formulario.modelo.trim(),
      ano: formulario.ano ? Number(formulario.ano) : null,
      categoria: formulario.categoria || null,
      combustivel: formulario.combustivel || null,
      transmissao: formulario.transmissao || null,
      lugares: formulario.lugares ? Number(formulario.lugares) : 5,
      preco_dia: preco,
      estado: formulario.estado,
    }

    try {
      setAGuardar(true)
      if (editando) {
        await api.veiculos.atualizar(editando.id, payload)
        toast.success('Veículo atualizado com sucesso.')
      } else {
        await api.veiculos.criar(payload)
        toast.success('Veículo registado com sucesso.')
      }
      setModalAberto(false)
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar veículo')
    } finally {
      setAGuardar(false)
    }
  }

  function eliminar(veiculo: Veiculo) {
    toast(`Eliminar o veículo ${veiculo.matricula}?`, {
      description: 'Esta ação não pode ser desfeita.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await api.veiculos.eliminar(veiculo.id)
            toast.success('Veículo eliminado.')
            await carregar()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao eliminar veículo')
          }
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Veículos"
        descricao="Gerir a frota, preços e disponibilidade."
        acao={
          <button type="button" onClick={abrirNovo} className={btnPrimario}>
            <Plus className="h-4 w-4" /> Novo veículo
          </button>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por matrícula, marca, modelo..."
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
        <Spinner texto="A carregar veículos..." />
      ) : filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum veículo encontrado"
          descricao={
            veiculos.length === 0
              ? 'Ainda não há veículos registados. Comece por adicionar o primeiro.'
              : 'Tente ajustar a pesquisa ou o filtro de estado.'
          }
          acao={
            veiculos.length === 0 ? (
              <button type="button" onClick={abrirNovo} className={btnPrimario}>
                <Plus className="h-4 w-4" /> Adicionar veículo
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Veículo</th>
                <th className="px-5 py-3 font-medium">Matrícula</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Combustível</th>
                <th className="px-5 py-3 font-medium">Transmissão</th>
                <th className="px-5 py-3 text-right font-medium">Preço/dia</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((veiculo) => (
                <tr
                  key={veiculo.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {veiculo.marca} {veiculo.modelo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {veiculo.ano ?? '—'} · {veiculo.lugares} lugares
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs font-medium text-slate-700">
                    {veiculo.matricula}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{veiculo.categoria ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{veiculo.combustivel ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{veiculo.transmissao ?? '—'}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                    {fmtKz(veiculo.preco_dia)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeEstado(
                        veiculo.estado,
                      )}`}
                    >
                      {veiculo.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(veiculo)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(veiculo)}
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
        title={editando ? 'Editar veículo' : 'Novo veículo'}
        subtitle={
          editando
            ? `A atualizar ${editando.marca} ${editando.modelo}`
            : 'Registe um novo veículo na frota.'
        }
        wide
      >
        <form onSubmit={guardar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Matrícula *</label>
            <input
              value={formulario.matricula}
              onChange={(e) => atualizarCampo('matricula', e.target.value)}
              className={`${campoCls} font-mono uppercase`}
              placeholder="LD-01-AA"
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
          <div>
            <label className={labelCls}>Marca *</label>
            <input
              value={formulario.marca}
              onChange={(e) => atualizarCampo('marca', e.target.value)}
              className={campoCls}
              placeholder="Toyota"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Modelo *</label>
            <input
              value={formulario.modelo}
              onChange={(e) => atualizarCampo('modelo', e.target.value)}
              className={campoCls}
              placeholder="Corolla"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Ano</label>
            <input
              type="number"
              min={1990}
              max={2100}
              value={formulario.ano}
              onChange={(e) => atualizarCampo('ano', e.target.value)}
              className={campoCls}
            />
          </div>
          <div>
            <label className={labelCls}>Lugares</label>
            <input
              type="number"
              min={1}
              max={30}
              value={formulario.lugares}
              onChange={(e) => atualizarCampo('lugares', e.target.value)}
              className={campoCls}
            />
          </div>
          <div>
            <label className={labelCls}>Categoria</label>
            <select
              value={formulario.categoria}
              onChange={(e) => atualizarCampo('categoria', e.target.value)}
              className={campoCls}
            >
              <option value="">— escolher —</option>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Combustível</label>
            <select
              value={formulario.combustivel}
              onChange={(e) => atualizarCampo('combustivel', e.target.value)}
              className={campoCls}
            >
              <option value="">— escolher —</option>
              {COMBUSTIVEIS.map((combustivel) => (
                <option key={combustivel} value={combustivel}>
                  {combustivel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Transmissão</label>
            <select
              value={formulario.transmissao}
              onChange={(e) => atualizarCampo('transmissao', e.target.value)}
              className={campoCls}
            >
              <option value="">— escolher —</option>
              {TRANSMISSOES.map((transmissao) => (
                <option key={transmissao} value={transmissao}>
                  {transmissao}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Preço por dia (Kz) *</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={formulario.preco_dia}
              onChange={(e) => atualizarCampo('preco_dia', e.target.value)}
              className={campoCls}
              placeholder="45000"
              required
            />
          </div>

          <div className="mt-2 flex justify-end gap-3 border-t border-slate-200 pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className={btnSecundario}
            >
              Cancelar
            </button>
            <button type="submit" disabled={aGuardar} className={btnPrimario}>
              {aGuardar ? 'A guardar...' : editando ? 'Guardar alterações' : 'Registar veículo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
