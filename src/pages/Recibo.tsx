import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Venda } from '../types'
import { fmtData, fmtKz } from '../lib/format'
import { Spinner, btnPrimario, btnSecundario } from '../components/ui'

/** Recibo de venda pronto a imprimir (ou guardar em PDF pelo navegador). */
export default function Recibo() {
  const { id } = useParams()
  const { usuario, loading: aCarregarSessao } = useAuth()
  const [venda, setVenda] = useState<Venda | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!id || !usuario) return
    api.vendas.obter(id).then(setVenda).catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar a venda'))
  }, [id, usuario])

  if (aCarregarSessao) return <Spinner />
  if (!usuario) return <p className="p-8 text-sm">Inicie sessão para ver o recibo. <Link to="/login" className="text-blue-600">Entrar</Link></p>
  if (erro) return <p className="p-8 text-sm text-red-600">{erro}</p>
  if (!venda) return <Spinner texto="A preparar o recibo..." />

  const v = venda.viatura
  const c = venda.cliente
  const linha = (rotulo: string, valor?: string | number | null) => (
    <tr><td className="w-44 py-1 pr-4 text-slate-500">{rotulo}</td><td className="py-1 text-slate-900">{valor || '—'}</td></tr>
  )

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end gap-3 px-4 print:hidden">
        <Link to="/vendas" className={btnSecundario}>Voltar às vendas</Link>
        <button type="button" onClick={() => window.print()} className={btnPrimario}><Printer className="h-4 w-4" /> Imprimir / guardar PDF</button>
      </div>

      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div>
            <p className="text-2xl font-bold text-slate-900">Stand Automóvel</p>
            <p className="text-sm text-slate-500">Compra e venda de viaturas · Luanda, Angola</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">Recibo de venda</p>
            <p className="font-mono text-sm text-slate-700">{venda.numero}</p>
            <p className="text-sm text-slate-500">Data: {fmtData(venda.data)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-8 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Comprador</h2>
            <table className="text-sm"><tbody>
              {linha('Nome', c?.nome)}
              {linha('BI / NIF', c?.documento)}
              {linha('Telefone', c?.telefone)}
              {linha('Morada', c?.endereco)}
            </tbody></table>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Viatura</h2>
            <table className="text-sm"><tbody>
              {linha('Marca / modelo', v ? `${v.marca} ${v.modelo}` : '')}
              {linha('Ano', v?.ano)}
              {linha('Cor', v?.cor)}
              {linha('Matrícula', v?.matricula)}
              {linha('Chassis', v?.chassis)}
            </tbody></table>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Descrição</th><th className="py-2">Forma de pagamento</th><th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3">Venda da viatura {v ? `${v.marca} ${v.modelo}` : ''}{v?.matricula ? `, matrícula ${v.matricula}` : ''}</td>
              <td className="py-3">{venda.forma_pagamento}</td>
              <td className="py-3 text-right">{fmtKz(venda.preco_venda)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colSpan={2} className="pt-4 text-right font-semibold">Total recebido</td><td className="pt-4 text-right text-lg font-bold">{fmtKz(venda.preco_venda)}</td></tr>
          </tfoot>
        </table>

        {venda.observacoes && <p className="mt-6 text-sm text-slate-600"><b>Observações:</b> {venda.observacoes}</p>}

        <div className="mt-16 grid grid-cols-2 gap-12 text-center text-sm text-slate-600">
          <div><div className="border-t border-slate-400 pt-2">O vendedor{venda.vendedor ? ` (${venda.vendedor})` : ''}</div></div>
          <div><div className="border-t border-slate-400 pt-2">O comprador</div></div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">
          Recibo interno de venda. Não substitui a factura emitida por software certificado pela AGT.
        </p>
      </div>
    </div>
  )
}
