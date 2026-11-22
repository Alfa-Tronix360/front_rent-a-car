import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Usuario } from '../types'
import { NOMES_PERFIL, nomePerfil } from '../lib/perfis'
import { EmptyState, Modal, PageHeader, Spinner, btnPrimario, btnSecundario, campoCls, labelCls } from '../components/ui'
import MatrizPermissoes from './MatrizPermissoes'

const O_QUE_VE: Record<string, string> = {
  admin: 'Acesso total: compras, custos, lucros, vendas, utilizadores e permissões.',
  vendedor: 'Por omissão: viaturas disponíveis e preços de venda; regista clientes e propostas. Ajuste no separador Permissões.',
  stock: 'Por omissão: regista a entrada de viaturas e os custos de preparação. Ajuste no separador Permissões.',
}

export default function Utilizadores() {
  const { usuario: eu } = useAuth()
  const [lista, setLista] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', password: '', perfil: 'vendedor', ativo: true })
  const [aGuardar, setAGuardar] = useState(false)
  const [separador, setSeparador] = useState<'contas' | 'permissoes'>('contas')

  async function carregar() {
    try {
      setLoading(true)
      setLista(await api.utilizadores.listar())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar utilizadores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrir(u: Usuario | null) {
    setEditando(u)
    setForm(u ? { nome: u.nome, email: u.email, password: '', perfil: u.perfil, ativo: u.ativo }
      : { nome: '', email: '', password: '', perfil: 'vendedor', ativo: true })
    setAberto(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = { nome: form.nome.trim(), email: form.email.trim(), perfil: form.perfil, ativo: form.ativo }
    if (form.password) payload.password = form.password
    try {
      setAGuardar(true)
      if (editando) await api.utilizadores.atualizar(editando.id, payload)
      else await api.utilizadores.criar(payload)
      toast.success(editando ? 'Utilizador actualizado.' : 'Utilizador criado.')
      setAberto(false)
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar')
    } finally {
      setAGuardar(false)
    }
  }

  function eliminar(u: Usuario) {
    toast(`Eliminar ${u.nome}?`, {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await api.utilizadores.eliminar(u.id)
            toast.success('Utilizador eliminado.')
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
      <PageHeader titulo="Utilizadores" descricao="Contas de acesso, perfil de cada pessoa e matriz de permissões."
        acao={separador === 'contas' ? <button type="button" onClick={() => abrir(null)} className={btnPrimario}><Plus className="h-4 w-4" /> Novo utilizador</button> : undefined} />

      <div className="flex gap-1 border-b border-slate-200">
        {([['contas', 'Contas'], ['permissoes', 'Permissões']] as const).map(([k, rotulo]) => (
          <button key={k} type="button" onClick={() => setSeparador(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${separador === k ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {rotulo}
          </button>
        ))}
      </div>

      {separador === 'permissoes' ? <MatrizPermissoes /> : (<>

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(NOMES_PERFIL).map(([p, nome]) => (
          <div key={p} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <p className="font-semibold text-slate-900">{nome}</p>
            <p className="mt-1 text-slate-500">{O_QUE_VE[p]}</p>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : lista.length === 0 ? <EmptyState titulo="Sem utilizadores" /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Nome</th><th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Perfil</th><th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Acções</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{u.nome}{u.id === eu?.id && <span className="ml-2 text-xs text-slate-400">(eu)</span>}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3 text-slate-700">{nomePerfil(u.perfil)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                      {u.ativo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" title="Editar" onClick={() => abrir(u)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                      {u.id !== eu?.id && (
                        <button type="button" title="Eliminar" onClick={() => eliminar(u)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </>)}

      <Modal open={aberto} onClose={() => setAberto(false)} title={editando ? 'Editar utilizador' : 'Novo utilizador'}>
        <form onSubmit={guardar} className="space-y-4">
          <div><label className={labelCls}>Nome *</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={campoCls} required /></div>
          <div><label className={labelCls}>Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={campoCls} required /></div>
          <div><label className={labelCls}>{editando ? 'Nova palavra-passe' : 'Palavra-passe *'}</label>
            <input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={campoCls} required={!editando} placeholder={editando ? 'Em branco: mantém a actual' : 'Mínimo 6 caracteres'} autoComplete="new-password" /></div>
          <div><label className={labelCls}>Perfil *</label>
            <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })} className={campoCls}>
              {Object.entries(NOMES_PERFIL).map(([p, nome]) => <option key={p} value={p}>{nome}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">{O_QUE_VE[form.perfil]}</p></div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Conta activa
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setAberto(false)} className={btnSecundario}>Cancelar</button>
            <button type="submit" disabled={aGuardar} className={btnPrimario}>{aGuardar ? 'A guardar...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
