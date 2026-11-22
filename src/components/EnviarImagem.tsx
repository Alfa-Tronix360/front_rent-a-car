import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { enviarParaCloudinary } from '../lib/cloudinary'
import { btnPrimario, btnSecundario, campoCls } from './ui'

let estadoCloudinary: Promise<boolean> | null = null
const cloudinaryActivo = () => (estadoCloudinary ??= api.site.cloudinary().then((r) => r.configurado).catch(() => false))

/** Carrega imagens para o Cloudinary (várias de uma vez) ou, em alternativa, aceita um endereço de imagem. */
export default function EnviarImagem({ pasta, onEnviada, multiplas = true, rotulo = 'Carregar imagem' }: {
  pasta: 'site' | 'viaturas'
  onEnviada: (img: { url: string; public_id: string | null }) => Promise<void> | void
  multiplas?: boolean
  rotulo?: string
}) {
  const ficheiro = useRef<HTMLInputElement>(null)
  const [activo, setActivo] = useState<boolean | null>(null)
  const [aEnviar, setAEnviar] = useState(0)
  const [porUrl, setPorUrl] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    cloudinaryActivo().then(setActivo)
  }, [])

  async function escolher(lista: FileList | null) {
    if (!lista?.length) return
    const ficheiros = Array.from(lista)
    setAEnviar(ficheiros.length)
    for (const f of ficheiros) {
      try {
        const r = await enviarParaCloudinary(f, pasta)
        await onEnviada(r)
      } catch (error) {
        toast.error(`${f.name}: ${error instanceof Error ? error.message : 'falhou o envio'}`)
      } finally {
        setAEnviar((n) => n - 1)
      }
    }
    if (ficheiro.current) ficheiro.current.value = ''
  }

  async function adicionarUrl() {
    if (!/^https?:\/\//.test(url.trim())) {
      toast.error('Indique um endereço que comece por https://')
      return
    }
    await onEnviada({ url: url.trim(), public_id: null })
    setUrl('')
    setPorUrl(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={ficheiro} type="file" accept="image/*" multiple={multiplas} className="hidden" onChange={(e) => escolher(e.target.files)} />
      <button type="button" disabled={!activo || aEnviar > 0} onClick={() => ficheiro.current?.click()} className={btnPrimario}
        title={activo === false ? 'Configure o Cloudinary no servidor (CLOUDINARY_URL)' : undefined}>
        <ImagePlus className="h-4 w-4" /> {aEnviar > 0 ? `A enviar (${aEnviar})...` : rotulo}
      </button>
      <button type="button" onClick={() => setPorUrl((v) => !v)} className={btnSecundario}><Link2 className="h-4 w-4" /> Por endereço</button>
      {activo === false && <span className="text-xs text-amber-700">Cloudinary por configurar no servidor: pode usar um endereço de imagem.</span>}
      {porUrl && (
        <div className="flex w-full gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={campoCls} />
          <button type="button" onClick={adicionarUrl} className={btnSecundario}>Adicionar</button>
        </div>
      )}
    </div>
  )
}
