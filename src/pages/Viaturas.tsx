import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Eye, FileSignature, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Viatura } from '../types'
import { badgeEstado, fmtData, fmtKz, hojeInput } from '../lib/format'
import { COMBUSTIVEIS, ESTADOS_STOCK, ESTADOS_VIATURA, TIPOS_CUSTO, TRANSMISSOES, tem } from '../lib/perfis'
import { EmptyState, Modal, PageHeader, Spinner, btnPrimario, btnSecundario, campoCls, labelCls } from '../components/ui'
import EnviarImagem from '../components/EnviarImagem'
import { ehInterior, marcarInterior, reduzida } from '../lib/cloudinary'
import { Star } from 'lucide-react'

interface Formulario {
  marca: string
  modelo: string
  ano: string
  matricula: string
  chassis: string
  cor: string
  combustivel: string
  transmissao: string
  quilometragem: string
  preco_compra: string
  preco_venda: string
  estado: string
  data_entrada: string
  observacoes: string
}

const vazio = (): Formulario => ({
  marca: '', modelo: '', ano: String(new Date().getFullYear()), matricula: '', chassis: '', cor: '',
  combustivel: 'Gasolina', transmissao: 'Automática', quilometragem: '', preco_compra: '', preco_venda: '',
  estado: 'Em Trânsito', data_entrada: hojeInput(), observacoes: '',
})

const num = (v: string) => (v.trim() === '' ? null : Number(v))
const identificacao = (v: { matricula?: string | null; chassis?: string | null }) =>
  v.matricula || (v.chassis ? `Chassis ${v.chassis}` : '—')

function Margem({ valor }: { valor?: number | null }) {
  if (valor === undefined) return null
  if (valor === null) return <span className="text-xs text-slate-400">Sem preço de venda</span>
  return <span className={`font-semibold ${valor >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmtKz(valor)}</span>
}

export default function Viaturas() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const gereStock = tem(usuario, 'viaturas.registar')
  const definePreco = tem(usuario, 'viaturas.definir_venda')
  const podeEditar = gereStock || definePreco
  const verCompra = tem(usuario, 'viaturas.ver_compra')
  const verVenda = tem(usuario, 'viaturas.ver_venda', 'viaturas.definir_venda')
  const verMargem = tem(usuario, 'viaturas.ver_margem')
  const soDisponiveis = !tem(usuario, 'viaturas.ver_todas')
  const fazPropostas = tem(usuario, 'propostas.registar')
  const registaCustos = tem(usuario, 'custos.registar')

  const [viaturas, setViaturas] = useState<Viatura[]>([])
  const [loading, setLoading] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Viatura | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(vazio)
  const [aGuardar, setAGuardar] = useState(false)
  const [detalhe, setDetalhe] = useState<Viatura | null>(null)

  async function carregar() {
    try {
      setLoading(true)
      setViaturas(await api.viaturas.listar())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar viaturas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    return viaturas.filter((v) => {
      const texto = [v.marca, v.modelo, v.matricula ?? '', v.chassis ?? '', v.cor ?? '', String(v.ano ?? '')].join(' ').toLowerCase()
      return (!termo || texto.includes(termo)) && (!filtroEstado || v.estado === filtroEstado)
    })
  }, [viaturas, pesquisa, filtroEstado])

  const estadosPermitidos = tem(usuario, 'propostas.decidir') ? ESTADOS_VIATURA.filter((e) => e !== 'Vendido') : ESTADOS_STOCK

  function abrirNovo() {
    setEditando(null)
    setFormulario(vazio())
    setModalAberto(true)
  }

  function abrirEdicao(v: Viatura) {
    setEditando(v)
    setFormulario({
      marca: v.marca, modelo: v.modelo, ano: v.ano ? String(v.ano) : '', matricula: v.matricula ?? '',
      chassis: v.chassis ?? '', cor: v.cor ?? '', combustivel: v.combustivel ?? '', transmissao: v.transmissao ?? '',
      quilometragem: v.quilometragem != null ? String(v.quilometragem) : '',
      preco_compra: v.preco_compra != null ? String(v.preco_compra) : '',
      preco_venda: v.preco_venda != null ? String(v.preco_venda) : '', estado: v.estado,
      data_entrada: v.data_entrada ? v.data_entrada.slice(0, 10) : '', observacoes: v.observacoes ?? '',
    })
    setModalAberto(true)
  }

  const campo = (c: keyof Formulario, valor: string) => setFormulario((f) => ({ ...f, [c]: valor }))

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!formulario.matricula.trim() && !formulario.chassis.trim()) {
      toast.error('Indique a matrícula ou o número de chassis.')
      return
    }
    const payload: Record<string, unknown> = {
      marca: formulario.marca.trim(), modelo: formulario.modelo.trim(), ano: num(formulario.ano),
      matricula: formulario.matricula.trim() || null, chassis: formulario.chassis.trim() || null,
      cor: formulario.cor.trim() || null, combustivel: formulario.combustivel || null,
      transmissao: formulario.transmissao || null, quilometragem: num(formulario.quilometragem),
      estado: formulario.estado, observacoes: formulario.observacoes.trim() || null,
      data_entrada: formulario.data_entrada ? `${formulario.data_entrada}T00:00:00` : null,
    }
    if (verCompra || !editando) payload.preco_compra = num(formulario.preco_compra) ?? 0
    if (definePreco) payload.preco_venda = num(formulario.preco_venda)
    try {
      setAGuardar(true)
      if (editando) {
        if (editando.estado === 'Vendido') delete payload.estado
        // Sem permissão para editar a viatura, só se altera o preço de venda
        await api.viaturas.atualizar(editando.id, gereStock ? payload : { preco_venda: payload.preco_venda })
        toast.success('Viatura actualizada.')
      } else {
        await api.viaturas.criar(payload)
        toast.success('Entrada da viatura registada.')
      }
      setModalAberto(false)
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar a viatura')
    } finally {
      setAGuardar(false)
    }
  }

  function eliminar(v: Viatura) {
    toast(`Eliminar ${v.marca} ${v.modelo} (${identificacao(v)})?`, {
      description: 'A viatura e os custos registados são apagados.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await api.viaturas.eliminar(v.id)
            toast.success('Viatura eliminada.')
            await carregar()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao eliminar')
          }
        },
      },
    })
  }

  async function abrirDetalhe(v: Viatura) {
    try {
      setDetalhe(await api.viaturas.obter(v.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir a viatura')
    }
  }

  // Margem prevista enquanto se edita (administrador): venda − (compra + custos já registados)
  const margemPrevista = (() => {
    const venda = num(formulario.preco_venda)
    const compra = num(formulario.preco_compra) ?? 0
    if (venda == null) return null
    return venda - compra - (editando?.custos_extras ?? 0)
  })()

  const descricao =
    soDisponiveis
      ? 'Viaturas disponíveis para venda e respectivos preços.'
      : verMargem
        ? 'Stock, custos, preços de venda e margem de cada viatura.'
        : 'Entrada de viaturas, preparação e custos.'

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Viaturas"
        descricao={descricao}
        acao={gereStock ? (
          <button type="button" onClick={abrirNovo} className={btnPrimario}>
            <Plus className="h-4 w-4" /> Registar entrada
          </button>
        ) : undefined}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} className={`${campoCls} pl-10`}
            placeholder="Pesquisar por marca, modelo, matrícula ou chassis..." />
        </div>
        {!soDisponiveis && (
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={`${campoCls} sm:w-52`}>
            <option value="">Todos os estados</option>
            {ESTADOS_VIATURA.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <Spinner texto="A carregar viaturas..." />
      ) : filtradas.length === 0 ? (
        <EmptyState
          titulo="Nenhuma viatura encontrada"
          descricao={viaturas.length === 0
            ? (soDisponiveis ? 'De momento não há viaturas disponíveis para venda.' : 'Ainda não há viaturas registadas.')
            : 'Tente ajustar a pesquisa ou o filtro.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Viatura</th>
                <th className="px-5 py-3 font-medium">Matrícula / chassis</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                {verCompra && <th className="px-5 py-3 text-right font-medium">Compra</th>}
                {verCompra && <th className="px-5 py-3 text-right font-medium">Custos extras</th>}
                {verVenda && <th className="px-5 py-3 text-right font-medium">Preço de venda</th>}
                {verMargem && <th className="px-5 py-3 text-right font-medium">Margem</th>}
                <th className="px-5 py-3 text-right font-medium">Acções</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{v.marca} {v.modelo}</p>
                        <p className="text-xs text-slate-500">
                          {[v.ano, v.cor, v.combustivel, v.quilometragem != null ? `${v.quilometragem.toLocaleString('pt-AO')} km` : null]
                            .filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">
                    <p>{v.matricula ?? '—'}</p>
                    {v.chassis && <p className="text-slate-400">{v.chassis}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeEstado(v.estado)}`}>{v.estado}</span>
                  </td>
                  {verCompra && <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">{fmtKz(v.preco_compra)}</td>}
                  {verCompra && <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">{fmtKz(v.custos_extras)}</td>}
                  {verVenda && (
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                      {v.preco_venda != null ? fmtKz(v.preco_venda) : <span className="text-xs font-normal text-slate-400">Por definir</span>}
                    </td>
                  )}
                  {verMargem && <td className="whitespace-nowrap px-5 py-3 text-right"><Margem valor={v.margem} /></td>}
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => abrirDetalhe(v)} title="Ver detalhe e custos"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                        <Eye className="h-4 w-4" />
                      </button>
                      {fazPropostas && v.estado === 'Disponível' && (
                        <button type="button" onClick={() => navigate(`/admin/propostas?viatura=${v.id}`)} title="Registar proposta"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <FileSignature className="h-4 w-4" />
                        </button>
                      )}
                      {podeEditar && (
                        <button type="button" onClick={() => abrirEdicao(v)} title="Editar"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {tem(usuario, 'viaturas.eliminar') && v.estado !== 'Vendido' && (
                        <button type="button" onClick={() => eliminar(v)} title="Eliminar"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
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

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} wide
        title={editando ? 'Editar viatura' : 'Registar entrada de viatura'}
        subtitle={editando ? `${editando.marca} ${editando.modelo} · ${identificacao(editando)}` : 'Dados da viatura e preço de compra.'}>
        <form onSubmit={guardar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset disabled={!!editando && !gereStock} className="contents">
          <div><label className={labelCls}>Marca *</label>
            <input value={formulario.marca} onChange={(e) => campo('marca', e.target.value)} className={campoCls} placeholder="Toyota" required /></div>
          <div><label className={labelCls}>Modelo *</label>
            <input value={formulario.modelo} onChange={(e) => campo('modelo', e.target.value)} className={campoCls} placeholder="Hilux 2.4 D-4D" required /></div>
          <div><label className={labelCls}>Ano</label>
            <input type="number" min={1950} max={2100} value={formulario.ano} onChange={(e) => campo('ano', e.target.value)} className={campoCls} /></div>
          <div><label className={labelCls}>Cor</label>
            <input value={formulario.cor} onChange={(e) => campo('cor', e.target.value)} className={campoCls} placeholder="Branco" /></div>
          <div><label className={labelCls}>Matrícula</label>
            <input value={formulario.matricula} onChange={(e) => campo('matricula', e.target.value)} className={`${campoCls} font-mono uppercase`} placeholder="LD-00-00-AA" /></div>
          <div><label className={labelCls}>Chassis (VIN)</label>
            <input value={formulario.chassis} onChange={(e) => campo('chassis', e.target.value)} className={`${campoCls} font-mono uppercase`} placeholder="Obrigatório se ainda não tiver matrícula" /></div>
          <div><label className={labelCls}>Combustível</label>
            <select value={formulario.combustivel} onChange={(e) => campo('combustivel', e.target.value)} className={campoCls}>
              <option value="">— escolher —</option>{COMBUSTIVEIS.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className={labelCls}>Transmissão</label>
            <select value={formulario.transmissao} onChange={(e) => campo('transmissao', e.target.value)} className={campoCls}>
              <option value="">— escolher —</option>{TRANSMISSOES.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className={labelCls}>Quilometragem</label>
            <input type="number" min={0} value={formulario.quilometragem} onChange={(e) => campo('quilometragem', e.target.value)} className={campoCls} /></div>
          <div><label className={labelCls}>Data de entrada</label>
            <input type="date" value={formulario.data_entrada} onChange={(e) => campo('data_entrada', e.target.value)} className={campoCls} /></div>
          <div><label className={labelCls}>Estado</label>
            {editando?.estado === 'Vendido' ? (
              <input value="Vendido" disabled className={campoCls} />
            ) : (
              <select value={formulario.estado} onChange={(e) => campo('estado', e.target.value)} className={campoCls}>
                {estadosPermitidos.map((e) => <option key={e}>{e}</option>)}
                {editando && !estadosPermitidos.includes(editando.estado) && <option>{editando.estado}</option>}
              </select>
            )}</div>
          {(verCompra || !editando) && (
            <div><label className={labelCls}>Preço de compra (Kz) *</label>
            <input type="number" min={0} step="0.01" value={formulario.preco_compra} onChange={(e) => campo('preco_compra', e.target.value)} className={campoCls} required /></div>
          )}
          </fieldset>
          {definePreco && (
            <>
              <div><label className={labelCls}>Preço de venda (Kz)</label>
                <input type="number" min={0} step="0.01" value={formulario.preco_venda} onChange={(e) => campo('preco_venda', e.target.value)} className={campoCls} placeholder="Em branco: por definir" /></div>
              <div className="flex flex-col justify-end rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
                <span className="text-xs text-slate-500">Margem prevista {editando ? '(com os custos registados)' : '(sem custos extras ainda)'}</span>
                <Margem valor={margemPrevista} />
              </div>
            </>
          )}
          <div className="sm:col-span-2"><label className={labelCls}>Observações</label>
            <textarea rows={2} value={formulario.observacoes} onChange={(e) => campo('observacoes', e.target.value)} className={campoCls} /></div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            Os custos de desalfandegamento, reparações e manutenção registam-se no detalhe da viatura (botão <Eye className="inline h-3.5 w-3.5" />).
          </p>
          <div className="mt-2 flex justify-end gap-3 border-t border-slate-200 pt-4 sm:col-span-2">
            <button type="button" onClick={() => setModalAberto(false)} className={btnSecundario}>Cancelar</button>
            <button type="submit" disabled={aGuardar} className={btnPrimario}>
              {aGuardar ? 'A guardar...' : editando ? 'Guardar alterações' : 'Registar entrada'}
            </button>
          </div>
        </form>
      </Modal>

      {detalhe && <Detalhe viatura={detalhe} onClose={() => setDetalhe(null)} podeCustos={registaCustos} podeFotos={tem(usuario, 'fotos.gerir')}
        onAlterada={(v) => { setDetalhe(v); carregar() }} />}
    </div>
  )
}

function Fotos({ v, podeFotos, onAlterada }: { v: Viatura; podeFotos: boolean; onAlterada: (v: Viatura) => void }) {
  const fotos = v.fotos ?? []
  const [tipoNovo, setTipoNovo] = useState<'exterior' | 'interior'>('exterior')
  const recarregar = async () => onAlterada(await api.viaturas.obter(v.id))
  async function executar(accao: () => Promise<unknown>, falha: string) {
    try {
      await accao()
      await recarregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : falha)
    }
  }
  if (!podeFotos && !fotos.length) return null
  const capaId = fotos.find((f) => !ehInterior(f.url))?.id
  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Fotos (site público)</h3>
        {podeFotos && (
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Tipo das fotos a carregar" className="flex rounded-lg border border-slate-300 p-0.5 text-xs font-medium">
              {(['exterior', 'interior'] as const).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={tipoNovo === t} onClick={() => setTipoNovo(t)}
                  className={`rounded-md px-3 py-1.5 capitalize ${tipoNovo === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{t}</button>
              ))}
            </div>
            <EnviarImagem pasta="viaturas" rotulo={`Carregar fotos do ${tipoNovo}`} onEnviada={async (img) => {
              await api.site.adicionarFoto(v.id, { ...img, url: tipoNovo === 'interior' ? marcarInterior(img.url) : img.url })
              await recarregar()
            }} />
          </div>
        )}
      </div>
      {fotos.length === 0 ? <p className="text-sm text-slate-500">Sem fotos. Escolha «exterior» ou «interior» antes de carregar: no site, o showroom separa as duas vistas.</p> : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotos.map((f) => {
            const interior = ehInterior(f.url)
            return (
              <div key={f.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                <img src={reduzida(f.url, 400)} alt="" className="h-full w-full object-cover" />
                <span className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${interior ? 'bg-amber-500 text-white' : 'bg-slate-900/70 text-white'}`}>
                  {interior ? 'Interior' : 'Exterior'}
                </span>
                {f.id === capaId && <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Capa</span>}
                {podeFotos && (
                  <div className="absolute right-1 top-1 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    {!interior && f.id !== capaId && <button type="button" aria-label="Usar como capa" title="Usar como capa"
                      onClick={() => executar(() => api.site.fotoCapa(v.id, f.id), 'Erro ao mudar a capa')}
                      className="rounded bg-white/90 p-1 text-slate-600 hover:text-blue-600"><Star className="h-3.5 w-3.5" /></button>}
                    <button type="button" aria-label="Apagar foto" title="Apagar foto"
                      onClick={() => executar(() => api.site.apagarFoto(v.id, f.id), 'Erro ao apagar a foto')}
                      className="rounded bg-white/90 p-1 text-slate-600 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Detalhe({ viatura: v, onClose, podeCustos, podeFotos, onAlterada }: {
  viatura: Viatura; onClose: () => void; podeCustos: boolean; podeFotos: boolean; onAlterada: (v: Viatura) => void
}) {
  const [tipo, setTipo] = useState('Desalfandegamento')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hojeInput())
  const [aGuardar, setAGuardar] = useState(false)
  const editavel = podeCustos && v.estado !== 'Vendido'

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    if (!Number(valor)) {
      toast.error('Indique o valor do custo.')
      return
    }
    try {
      setAGuardar(true)
      onAlterada(await api.viaturas.adicionarCusto(v.id, { tipo, descricao: descricao.trim() || null, valor: Number(valor), data: `${data}T00:00:00` }))
      setDescricao('')
      setValor('')
      toast.success('Custo registado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registar o custo')
    } finally {
      setAGuardar(false)
    }
  }

  async function remover(id: string) {
    try {
      onAlterada(await api.viaturas.eliminarCusto(v.id, id))
      toast.success('Custo removido.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover o custo')
    }
  }

  const linha = (rotulo: string, valorTexto: ReactNode) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-slate-500">{rotulo}</span><span className="text-right text-slate-900">{valorTexto}</span></div>
  )

  return (
    <Modal open onClose={onClose} wide title={`${v.marca} ${v.modelo}${v.ano ? ` (${v.ano})` : ''}`}
      subtitle={`${identificacao(v)} · ${v.estado}`}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="divide-y divide-slate-100">
          {linha('Matrícula', v.matricula ?? '—')}
          {linha('Chassis', <span className="font-mono text-xs">{v.chassis ?? '—'}</span>)}
          {linha('Cor', v.cor ?? '—')}
          {linha('Combustível / caixa', [v.combustivel, v.transmissao].filter(Boolean).join(' · ') || '—')}
          {linha('Quilometragem', v.quilometragem != null ? `${v.quilometragem.toLocaleString('pt-AO')} km` : '—')}
          {linha('Entrada no stand', fmtData(v.data_entrada))}
          {v.observacoes && linha('Observações', v.observacoes)}
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          {v.preco_compra !== undefined && linha('Preço de compra', fmtKz(v.preco_compra))}
          {v.custos_extras !== undefined && linha('Custos extras', fmtKz(v.custos_extras))}
          {v.custo_total !== undefined && linha('Custo total', <b>{fmtKz(v.custo_total)}</b>)}
          {v.preco_venda !== undefined && linha('Preço de venda', v.preco_venda != null ? <b>{fmtKz(v.preco_venda)}</b> : 'Por definir')}
          {v.margem !== undefined && (
            <div className="mt-2 border-t border-slate-200 pt-2">{linha('Margem de lucro', <Margem valor={v.margem} />)}</div>
          )}
        </div>
      </div>

      <Fotos v={v} podeFotos={podeFotos} onAlterada={onAlterada} />

      {v.custos && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Custos extras</h3>
          {v.custos.length === 0 ? (
            <p className="text-sm text-slate-500">Ainda não há custos registados.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {v.custos.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-500">{fmtData(c.data)}</td>
                    <td className="py-2"><p className="font-medium text-slate-800">{c.tipo}</p>{c.descricao && <p className="text-xs text-slate-500">{c.descricao}</p>}</td>
                    <td className="whitespace-nowrap py-2 text-right text-slate-900">{fmtKz(c.valor)}</td>
                    {editavel && (
                      <td className="w-10 py-2 text-right">
                        <button type="button" onClick={() => remover(c.id)} title="Remover custo" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editavel && (
            <form onSubmit={adicionar} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-4">
              <div><label className={labelCls}>Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campoCls}>{TIPOS_CUSTO.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="sm:col-span-2"><label className={labelCls}>Descrição</label>
                <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className={campoCls} placeholder="Ex.: direitos aduaneiros, pneus..." /></div>
              <div><label className={labelCls}>Data</label>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campoCls} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Valor (Kz) *</label>
                <input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={campoCls} required /></div>
              <div className="flex items-end sm:col-span-2">
                <button type="submit" disabled={aGuardar} className={`${btnPrimario} w-full`}><Plus className="h-4 w-4" /> Registar custo</button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  )
}
