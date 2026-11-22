import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Car, FileSignature, HandCoins, PiggyBank, TrendingUp, Warehouse, Wrench } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { Painel, PainelAdmin, PainelStock, PainelVendedor, PorEstado, Venda } from '../types'
import { badgeEstado, fmtData, fmtKz } from '../lib/format'
import { ESTADOS_VIATURA } from '../lib/perfis'
import { EmptyState, PageHeader, Spinner } from '../components/ui'

type Icone = ComponentType<{ className?: string }>

function Cartao({ titulo, valor, icone: I, destaque, nota }: { titulo: string; valor: string; icone: Icone; destaque?: boolean; nota?: string }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${destaque ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white'}`}>
      <div className={`flex items-center gap-2 text-sm ${destaque ? 'text-blue-100' : 'text-slate-500'}`}><I className="h-4 w-4" />{titulo}</div>
      <p className={`mt-2 text-2xl font-bold ${destaque ? 'text-white' : 'text-slate-900'}`}>{valor}</p>
      {nota && <p className={`mt-1 text-xs ${destaque ? 'text-blue-100' : 'text-slate-500'}`}>{nota}</p>}
    </div>
  )
}

function Stock({ stock }: { stock: PorEstado }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Viaturas por estado</h2>
        <Link to="/viaturas" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">Ver viaturas <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ESTADOS_VIATURA.map((e) => (
          <div key={e} className="rounded-lg bg-slate-50 p-3">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeEstado(e)}`}>{e}</span>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stock[e] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function UltimasVendas({ vendas, comLucro }: { vendas: Venda[]; comLucro: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Últimas vendas</h2>
        <Link to="/vendas" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">Ver todas <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {vendas.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Ainda não há vendas.</p> : (
        <table className="w-full text-sm">
          <tbody>
            {vendas.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5"><p className="font-medium text-slate-900">{v.viatura ? `${v.viatura.marca} ${v.viatura.modelo}` : '—'}</p><p className="text-xs text-slate-500">{v.cliente?.nome} · {fmtData(v.data)}</p></td>
                <td className="py-2.5 text-right"><p className="font-semibold text-slate-900">{fmtKz(v.preco_venda)}</p>
                  {comLucro && v.lucro != null && <p className={`text-xs ${v.lucro >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>lucro {fmtKz(v.lucro)}</p>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Admin({ p }: { p: PainelAdmin }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao destaque titulo="Lucro do mês" valor={fmtKz(p.vendas_mes.lucro)} icone={TrendingUp} nota={`${p.vendas_mes.quantidade} venda(s) · ${fmtKz(p.vendas_mes.receita)}`} />
        <Cartao titulo="Lucro total" valor={fmtKz(p.vendas_total.lucro)} icone={PiggyBank} nota={`${p.vendas_total.quantidade} venda(s) · ${fmtKz(p.vendas_total.receita)}`} />
        <Cartao titulo="Capital em stock" valor={fmtKz(p.valor_stock.custo)} icone={Warehouse} nota={`Valor de venda previsto: ${fmtKz(p.valor_stock.venda)}${p.valor_stock.sem_preco ? ` (${p.valor_stock.sem_preco} sem preço)` : ''}`} />
        <Cartao titulo="Propostas pendentes" valor={String(p.propostas_pendentes)} icone={FileSignature} />
      </div>
      <Stock stock={p.stock} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="mb-4 font-semibold text-slate-900">Vendas e lucro — últimos 6 meses</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.por_mes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                <Tooltip formatter={(v) => fmtKz(Number(v))} />
                <Legend />
                <Bar dataKey="receita" name="Vendas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2"><UltimasVendas vendas={p.ultimas_vendas} comLucro /></div>
      </div>
    </>
  )
}

function Vendedor({ p }: { p: PainelVendedor }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao destaque titulo="As minhas vendas do mês" valor={fmtKz(p.vendas_mes.valor)} icone={HandCoins} nota={`${p.vendas_mes.quantidade} venda(s)`} />
        <Cartao titulo="Viaturas disponíveis" valor={String(p.disponiveis)} icone={Car} />
        <Cartao titulo="Propostas pendentes" valor={String(p.propostas_pendentes)} icone={FileSignature} />
        <Cartao titulo="Propostas aceites" valor={String(p.propostas_aceites)} icone={FileSignature} nota="Viaturas reservadas para os seus clientes" />
      </div>
      <UltimasVendas vendas={p.ultimas_vendas} comLucro={false} />
    </>
  )
}

function GestorStock({ p }: { p: PainelStock }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Cartao destaque titulo="Em preparação" valor={String(p.stock['Em Preparação'] ?? 0)} icone={Wrench} />
        <Cartao titulo="Em trânsito" valor={String(p.stock['Em Trânsito'] ?? 0)} icone={Car} />
        {p.custos_mes !== undefined && <Cartao titulo="Custos registados este mês" valor={fmtKz(p.custos_mes)} icone={Warehouse} />}
      </div>
      <Stock stock={p.stock} />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">A preparar (por ordem de entrada)</h2>
        {p.em_preparacao.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Nada em trânsito ou em preparação.</p> : (
          <table className="w-full text-sm">
            <tbody>
              {p.em_preparacao.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5"><p className="font-medium text-slate-900">{v.marca} {v.modelo} {v.ano ?? ''}</p><p className="font-mono text-xs text-slate-500">{v.matricula ?? v.chassis}</p></td>
                  <td className="py-2.5 text-slate-500">Entrada {fmtData(v.data_entrada)}</td>
                  <td className="py-2.5 text-right"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeEstado(v.estado)}`}>{v.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default function Dashboard() {
  const [painel, setPainel] = useState<Painel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    api.dashboard.stats()
      .then((d) => { if (activo) setPainel(d) })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar o painel'))
      .finally(() => { if (activo) setLoading(false) })
    return () => { activo = false }
  }, [])

  if (loading) return <Spinner texto="A carregar indicadores..." />
  if (!painel) return <EmptyState titulo="Não foi possível carregar o painel" descricao="Verifique se a API está a funcionar e tente novamente." />

  const sub = painel.tipo === 'financeiro' ? 'Stock, vendas e lucro do stand.'
    : painel.tipo === 'comercial' ? 'As suas propostas e vendas.' : 'Entrada e preparação das viaturas.'

  return (
    <div className="space-y-6">
      <PageHeader titulo="Painel" descricao={sub} />
      {painel.tipo === 'financeiro' && <Admin p={painel} />}
      {painel.tipo === 'comercial' && <Vendedor p={painel} />}
      {painel.tipo === 'stock' && <GestorStock p={painel} />}
    </div>
  )
}
