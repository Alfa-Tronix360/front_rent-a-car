import { api } from './api'

/** Envia uma imagem directamente do navegador para o Cloudinary (o servidor só assina o pedido)
 *  e devolve o endereço seguro e o public_id, para guardar na API. */
export async function enviarParaCloudinary(ficheiro: File, pasta: 'site' | 'viaturas'): Promise<{ url: string; public_id: string }> {
  if (!ficheiro.type.startsWith('image/')) throw new Error('Escolha um ficheiro de imagem.')
  if (ficheiro.size > 10 * 1024 * 1024) throw new Error('A imagem tem mais de 10 MB.')
  const a = await api.site.assinatura(pasta)
  const dados = new FormData()
  dados.append('file', ficheiro)
  dados.append('api_key', String(a.api_key))
  dados.append('timestamp', String(a.timestamp))
  dados.append('folder', String(a.folder))
  dados.append('signature', String(a.signature))
  const r = await fetch(String(a.upload_url), { method: 'POST', body: dados })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(corpo?.error?.message ?? 'O Cloudinary recusou a imagem.')
  return { url: corpo.secure_url as string, public_id: corpo.public_id as string }
}

/** Versão mais leve de uma imagem do Cloudinary (largura máxima, formato e qualidade automáticos). */
export function reduzida(url: string, largura = 900): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${largura},c_limit/`)
}
