import { useEffect, useState, type FormEvent } from 'react'
import { ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { reduzida } from '../lib/cloudinary'
import type { ImagemSite } from '../types'
import EnviarImagem from '../components/EnviarImagem'
import { PageHeader, Spinner, btnPrimario, campoCls, labelCls } from '../components/ui'

const SECOES: { chave: string; nome: string; ajuda: string }[] = [
  { chave: 'hero', nome: 'Banner da página inicial', ajuda: 'De momento a página inicial usa o hero de estúdio (imagens em public/showroom), por isso estas imagens não aparecem no site.' },
  { chave: 'marcas', nome: 'Logótipos das marcas', ajuda: 'Aparecem sobre o banner. O título deve ser o nome da marca (leva à pesquisa dessa marca).' },
  { chave: 'empresa', nome: 'Página Empresa', ajuda: 'A primeira é o fundo do cabeçalho; as restantes formam a galeria.' },
  { chave: 'intermediacao', nome: 'Página Intermediação', ajuda: 'Fundo do cabeçalho.' },
  { chave: 'compramos', nome: 'Página Compramos', ajuda: 'A primeira é o fundo do cabeçalho; as restantes formam a galeria.' },
  { chave: 'contactos', nome: 'Página Contactos', ajuda: 'Fundo do cabeçalho.' },
]

function Imagens() {
  const [imagens, setImagens] = useState<ImagemSite[] | null>(null)

  const carregar = () => api.site.imagens().then(setImagens).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar'))
  useEffect(() => {
    carregar()
  }, [])

  async function mudar(i: ImagemSite, dados: Record<string, unknown>) {
    try {
      await api.site.actualizarImagem(i.id, dados)
      await carregar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar')
    }
  }

  function apagar(i: ImagemSite) {
    toast('Apagar esta imagem?', {
      description: i.public_id ? 'Também é apagada no Cloudinary.' : undefined,
      action: { label: 'Apagar', onClick: async () => { await api.site.apagarImagem(i.id); toast.success('Imagem apagada.'); carregar() } },
    })
  }

  if (!imagens) return <Spinner />
  return (
    <div className="space-y-6">
      {SECOES.map((s) => {
        const daqui = imagens.filter((i) => i.secao === s.chave)
        return (
          <div key={s.chave} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-semibold text-slate-900">{s.nome}</h2><p className="text-sm text-slate-500">{s.ajuda}</p></div>
              <EnviarImagem pasta="site" onEnviada={async (img) => {
                await api.site.adicionarImagem({ secao: s.chave, url: img.url, public_id: img.public_id, ordem: daqui.length })
                toast.success('Imagem acrescentada.')
                await carregar()
              }} />
            </div>
            {daqui.length === 0 ? <p className="text-sm text-slate-400">Sem imagens.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {daqui.map((i, n) => (
                  <div key={i.id} className={`overflow-hidden rounded-lg border ${i.ativo ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'}`}>
                    <div className={`relative ${s.chave === 'marcas' ? 'h-24 bg-slate-800 p-3' : 'aspect-video bg-slate-100'}`}>
                      <img src={reduzida(i.url, 600)} alt={i.titulo ?? ''} className={`h-full w-full ${s.chave === 'marcas' ? 'object-contain' : 'object-cover'}`} />
                      {n === 0 && i.ativo && s.chave !== 'marcas' && <span className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">Principal</span>}
                    </div>
                    <div className="space-y-2 p-3">
                      <input defaultValue={i.titulo ?? ''} onBlur={(e) => e.target.value !== (i.titulo ?? '') && mudar(i, { titulo: e.target.value || null })}
                        placeholder={s.chave === 'marcas' ? 'Marca (ex.: Toyota)' : 'Título / texto alternativo'} className={`${campoCls} py-1.5`} />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Ordem</label>
                        <input type="number" defaultValue={i.ordem} onBlur={(e) => Number(e.target.value) !== i.ordem && mudar(i, { ordem: Number(e.target.value) })}
                          className={`${campoCls} w-20 py-1.5`} />
                        <span className="flex-1" />
                        <a href={i.url} target="_blank" rel="noreferrer" title="Abrir" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ExternalLink className="h-4 w-4" /></a>
                        <button type="button" title={i.ativo ? 'Esconder do site' : 'Mostrar no site'} onClick={() => mudar(i, { ativo: !i.ativo })}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">{i.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                        <button type="button" title="Apagar" onClick={() => apagar(i)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Textos() {
  const [valores, setValores] = useState<Record<string, string> | null>(null)
  const [rotulos, setRotulos] = useState<Record<string, string>>({})
  const [aGuardar, setAGuardar] = useState(false)

  useEffect(() => {
    api.site.config().then((r) => { setValores(r.valores); setRotulos(r.rotulos) }).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro'))
  }, [])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!valores) return
    try {
      setAGuardar(true)
      setValores((await api.site.guardarConfig(valores)).valores)
      toast.success('Textos e contactos guardados.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar')
    } finally {
      setAGuardar(false)
    }
  }

  if (!valores) return <Spinner />
  return (
    <form onSubmit={guardar} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      {Object.keys(rotulos).map((k) => (
        <div key={k} className={k.startsWith('texto_') || k === 'slogan' ? 'sm:col-span-2' : ''}>
          <label className={labelCls}>{rotulos[k]}</label>
          {k.startsWith('texto_')
            ? <textarea rows={3} value={valores[k] ?? ''} onChange={(e) => setValores({ ...valores, [k]: e.target.value })} className={campoCls} />
            : <input value={valores[k] ?? ''} onChange={(e) => setValores({ ...valores, [k]: e.target.value })} className={campoCls} />}
        </div>
      ))}
      <div className="flex justify-end sm:col-span-2"><button type="submit" disabled={aGuardar} className={btnPrimario}>{aGuardar ? 'A guardar...' : 'Guardar'}</button></div>
    </form>
  )
}

export default function SiteAdmin() {
  const [sep, setSep] = useState<'imagens' | 'textos'>('imagens')
  return (
    <div className="space-y-6">
      <PageHeader titulo="Site público" descricao="Imagens (guardadas no Cloudinary), textos e contactos das páginas públicas."
        acao={<a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">Abrir o site <ExternalLink className="h-4 w-4" /></a>} />
      <div className="flex gap-1 border-b border-slate-200">
        {([['imagens', 'Imagens'], ['textos', 'Textos e contactos']] as const).map(([k, r]) => (
          <button key={k} type="button" onClick={() => setSep(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${sep === k ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{r}</button>
        ))}
      </div>
      {sep === 'imagens' ? <Imagens /> : <Textos />}
    </div>
  )
}
