import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { Cliente } from '../types'
import { useAuth } from '../context/AuthContext'
import { tem } from '../lib/perfis'
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

interface Formulario {
  nome: string
  documento: string
  email: string
  telefone: string
  endereco: string
}

const formularioVazio: Formulario = {
  nome: '',
  documento: '',
  email: '',
  telefone: '',
  endereco: '',
}

export default function Clientes() {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(formularioVazio)
  const [aGuardar, setAGuardar] = useState(false)

  async function carregar() {
    try {
      setLoading(true)
      const dados = await api.clientes.listar()
      setClientes(dados)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter((c) =>
      [c.nome, c.documento ?? '', c.email ?? '', c.telefone ?? '', c.endereco ?? '']
        .join(' ')
        .toLowerCase()
        .includes(termo),
    )
  }, [clientes, pesquisa])

  function abrirNovo() {
    setEditando(null)
    setFormulario(formularioVazio)
    setModalAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setEditando(cliente)
    setFormulario({
      nome: cliente.nome,
      documento: cliente.documento ?? '',
      email: cliente.email ?? '',
      telefone: cliente.telefone ?? '',
      endereco: cliente.endereco ?? '',
    })
    setModalAberto(true)
  }

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!formulario.nome.trim()) {
      toast.error('Indique o nome do cliente.')
      return
    }

    const payload: Partial<Cliente> = {
      nome: formulario.nome.trim(),
      documento: formulario.documento.trim() || null,
      email: formulario.email.trim() || null,
      telefone: formulario.telefone.trim() || null,
      endereco: formulario.endereco.trim() || null,
    }

    try {
      setAGuardar(true)
      if (editando) {
        await api.clientes.atualizar(editando.id, payload)
        toast.success('Cliente atualizado com sucesso.')
      } else {
        await api.clientes.criar(payload)
        toast.success('Cliente registado com sucesso.')
      }
      setModalAberto(false)
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar cliente')
    } finally {
      setAGuardar(false)
    }
  }

  function eliminar(cliente: Cliente) {
    toast(`Eliminar o cliente "${cliente.nome}"?`, {
      description: 'Esta ação não pode ser desfeita.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await api.clientes.eliminar(cliente.id)
            toast.success('Cliente eliminado.')
            await carregar()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao eliminar cliente')
          }
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Clientes"
        descricao="Compradores: contactos e documento de identificação (BI/NIF)."
        acao={tem(usuario, 'clientes.gerir') ? (
          <button type="button" onClick={abrirNovo} className={btnPrimario}>
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
        ) : undefined}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nome, documento, contacto ou endereço..."
            className={`${campoCls} pl-10`}
          />
        </div>
      </div>

      {loading ? (
        <Spinner texto="A carregar clientes..." />
      ) : filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum cliente encontrado"
          descricao={
            clientes.length === 0
              ? 'Ainda não há clientes registados. Adicione o primeiro cliente.'
              : 'Tente ajustar a pesquisa.'
          }
          acao={
            clientes.length === 0 ? (
              <button type="button" onClick={abrirNovo} className={btnPrimario}>
                <Plus className="h-4 w-4" /> Adicionar cliente
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Endereço</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <p className="font-medium text-slate-900">{cliente.nome}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {cliente.documento ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700">{cliente.telefone ?? '—'}</p>
                    <p className="text-xs text-slate-500">{cliente.email ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{cliente.endereco ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {tem(usuario, 'clientes.gerir') && (<button
                        type="button"
                        onClick={() => abrirEdicao(cliente)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>)}
                      {tem(usuario, 'clientes.eliminar') && (
                      <button
                        type="button"
                        onClick={() => eliminar(cliente)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      )}
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
        title={editando ? 'Editar cliente' : 'Novo cliente'}
        subtitle={
          editando ? `A atualizar ${editando.nome}` : 'Registe um novo cliente.'
        }
        wide
      >
        <form onSubmit={guardar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome completo *</label>
            <input
              value={formulario.nome}
              onChange={(e) => atualizarCampo('nome', e.target.value)}
              className={campoCls}
              placeholder="Ex: João Manuel"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Documento (BI/NIF)</label>
            <input
              value={formulario.documento}
              onChange={(e) => atualizarCampo('documento', e.target.value)}
              className={campoCls}
              placeholder="004512345LA041"
            />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input
              value={formulario.telefone}
              onChange={(e) => atualizarCampo('telefone', e.target.value)}
              className={campoCls}
              placeholder="+244 923 000 000"
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={formulario.email}
              onChange={(e) => atualizarCampo('email', e.target.value)}
              className={campoCls}
              placeholder="cliente@email.ao"
            />
          </div>
          <div>
            <label className={labelCls}>Endereço</label>
            <input
              value={formulario.endereco}
              onChange={(e) => atualizarCampo('endereco', e.target.value)}
              className={campoCls}
              placeholder="Luanda, Talatona"
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
              {aGuardar ? 'A guardar...' : editando ? 'Guardar alterações' : 'Registar cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
