import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Car,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { DashboardStats } from '../types'
import { badgeEstado, fmtData, fmtKz } from '../lib/format'
import { EmptyState, PageHeader, Spinner } from '../components/ui'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const dados = await api.dashboard.stats()
        if (ativo) setStats(dados)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar o dashboard')
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  if (loading) return <Spinner texto="A carregar indicadores..." />
  if (!stats) {
    return (
      <EmptyState
        titulo="Não foi possível carregar o dashboard"
        descricao="Verifique se a API está a funcionar e tente novamente."
      />
    )
  }

  const cartoes = [
    {
      titulo: 'Receita do mês',
      valor: fmtKz(stats.financeiro.receita_mes),
      icone: TrendingUp,
      destaque: true,
    },
    {
      titulo: 'Receita total',
      valor: fmtKz(stats.financeiro.receita_total),
      icone: Wallet,
    },
    {
      titulo: 'Por cobrar',
      valor: fmtKz(stats.financeiro.por_cobrar),
      icone: CreditCard,
    },
    {
      titulo: 'Clientes',
      valor: String(stats.clientes),
      icone: Users,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Dashboard"
        descricao="Visão geral da frota, alugueres e receita."
      />

      {/* Cartões financeiros */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cartoes.map(({ titulo, valor, icone: Icone, destaque }) => (
          <div
            key={titulo}
            className={`rounded-xl border p-5 shadow-sm ${
              destaque
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-sm ${
                destaque ? 'text-blue-100' : 'text-slate-500'
              }`}
            >
              <Icone className="h-4 w-4" />
              {titulo}
            </div>
            <p
              className={`mt-2 text-2xl font-bold ${
                destaque ? 'text-white' : 'text-slate-900'
              }`}
            >
              {valor}
            </p>
          </div>
        ))}
      </div>

      {/* Indicadores operacionais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador
          icone={Car}
          titulo="Frota"
          valor={stats.veiculos.total}
          detalhe={`${stats.veiculos.disponiveis} disponíveis · ${stats.veiculos.alugados} alugados`}
          cor="text-blue-600 bg-blue-50"
        />
        <Indicador
          icone={CalendarCheck}
          titulo="Alugueres ativos"
          valor={stats.alugueres.ativos}
          detalhe={`${stats.alugueres.reservados} reservados`}
          cor="text-emerald-600 bg-emerald-50"
        />
        <Indicador
          icone={CalendarClock}
          titulo="Reservas"
          valor={stats.alugueres.reservados}
          detalhe={`${stats.alugueres.total} alugueres no total`}
          cor="text-amber-600 bg-amber-50"
        />
        <Indicador
          icone={Car}
          titulo="Manutenção"
          valor={stats.veiculos.manutencao}
          detalhe={`${stats.veiculos.disponiveis} prontos a sair`}
          cor="text-orange-600 bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Gráfico */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Receita dos últimos 6 meses</h2>
              <p className="text-sm text-slate-500">Pagamentos confirmados</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.receita_por_mes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tickFormatter={(valor) =>
                    Number(valor) >= 1000
                      ? `${Math.round(Number(valor) / 1000)}k`
                      : String(valor)
                  }
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(valor) => [fmtKz(Number(valor)), 'Receita']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="valor" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Próximas devoluções */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Próximas devoluções</h2>
            <Link
              to="/alugueres"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {stats.proximas_devolucoes.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Sem devoluções agendadas.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.proximas_devolucoes.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{item.cliente}</p>
                    <span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {item.numero}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.veiculo} · {item.matricula}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    Devolução: {fmtData(item.data_fim)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Últimos alugueres */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Últimos alugueres</h2>
          <Link
            to="/alugueres"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.ultimos_alugueres.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Ainda sem alugueres.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Nº</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Veículo</th>
                  <th className="px-5 py-3 font-medium">Período</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimos_alugueres.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-700">{item.numero}</td>
                    <td className="px-5 py-3 text-slate-900">{item.cliente}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {item.veiculo}
                      <span className="ml-1 text-xs text-slate-400">({item.matricula})</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {fmtData(item.data_inicio)} → {fmtData(item.data_fim)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeEstado(
                          item.estado,
                        )}`}
                      >
                        {item.estado}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                      {fmtKz(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Indicador({
  icone: Icone,
  titulo,
  valor,
  detalhe,
  cor,
}: {
  icone: typeof Car
  titulo: string
  valor: number
  detalhe: string
  cor: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${cor}`}>
        <Icone className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{valor}</p>
      <p className="text-sm font-medium text-slate-600">{titulo}</p>
      <p className="mt-0.5 text-xs text-slate-400">{detalhe}</p>
    </div>
  )
}
