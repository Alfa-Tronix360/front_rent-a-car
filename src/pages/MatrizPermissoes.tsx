import { Fragment, useEffect, useState } from 'react'
import { Check, Lock, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Matriz } from '../lib/api'
import { NOMES_PERFIL } from '../lib/perfis'
import { Spinner, btnSecundario } from '../components/ui'

const CONFIGURAVEIS = ['vendedor', 'stock'] as const

/** Matriz de permissões: o administrador liga e desliga o que o vendedor e o gestor de stock podem ver e fazer.
 *  As alterações aplicam-se na API no pedido seguinte (o utilizador vê-as ao recarregar a página). */
export default function MatrizPermissoes() {
  const [m, setM] = useState<Matriz | null>(null)
  const [aGuardar, setAGuardar] = useState('')

  useEffect(() => {
    api.permissoes.ver().then(setM).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar a matriz'))
  }, [])

  async function mudar(perfil: string, chave: string, permitido: boolean) {
    try {
      setAGuardar(`${perfil}:${chave}`)
      setM(await api.permissoes.mudar(perfil, chave, permitido))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar a permissão')
    } finally {
      setAGuardar('')
    }
  }

  function repor() {
    toast('Repor as permissões por omissão?', {
      description: 'Todas as alterações feitas na matriz são desfeitas.',
      action: {
        label: 'Repor',
        onClick: async () => {
          try {
            setM(await api.permissoes.repor())
            toast.success('Permissões repostas.')
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao repor')
          }
        },
      },
    })
  }

  if (!m) return <Spinner texto="A carregar permissões..." />
  const grupos = [...new Set(m.catalogo.map((c) => c.grupo))]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-500">
          Marque o que cada perfil pode ver e fazer. O administrador tem sempre acesso total e é o único que gere utilizadores e esta matriz.
          As alterações valem de imediato na API; quem estiver com sessão aberta vê-as ao recarregar a página.
        </p>
        <button type="button" onClick={repor} className={btnSecundario}><RotateCcw className="h-4 w-4" /> Repor por omissão</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 text-left font-medium">Permissão</th>
              <th className="w-36 px-3 py-3 text-center font-medium">{NOMES_PERFIL.admin}</th>
              {CONFIGURAVEIS.map((p) => <th key={p} className="w-36 px-3 py-3 text-center font-medium">{NOMES_PERFIL[p]}</th>)}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <Fragment key={g}>
                <tr className="bg-slate-50/60"><td colSpan={2 + CONFIGURAVEIS.length} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{g}</td></tr>
                {m.catalogo.filter((c) => c.grupo === g).map((c) => (
                  <tr key={c.chave} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-slate-800">{c.rotulo}</td>
                    <td className="px-3 py-2.5 text-center" title="O administrador tem sempre esta permissão">
                      <span className="inline-flex items-center gap-1 text-slate-400"><Check className="h-4 w-4" /><Lock className="h-3 w-3" /></span>
                    </td>
                    {CONFIGURAVEIS.map((p) => {
                      const ligado = !!m.perfis[p]?.[c.chave]
                      const alterado = ligado !== !!m.padrao[p]?.[c.chave]
                      return (
                        <td key={p} className="px-3 py-2.5 text-center">
                          <label className="inline-flex cursor-pointer items-center gap-1.5" title={alterado ? 'Alterado em relação ao valor por omissão' : undefined}>
                            <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={ligado} disabled={aGuardar === `${p}:${c.chave}`}
                              onChange={(e) => mudar(p, c.chave, e.target.checked)} aria-label={`${c.rotulo} — ${NOMES_PERFIL[p]}`} />
                            {alterado && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                          </label>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> diferente do valor por omissão</p>
    </div>
  )
}
