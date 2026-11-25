import type { FotoPalco } from '../publico/Palco'

/** Imagens de catálogo (em public/showroom), usadas:
 *  - no «Showroom 3D» da página inicial;
 *  - em viaturas do mesmo modelo que ainda não tenham fotografias próprias, sempre com a etiqueta «Imagem ilustrativa».
 *  `modelo` restringe o uso a esse modelo (ex.: as imagens do Fortuner nunca aparecem num Hilux). */
export interface ModeloIlustrado {
  id: string
  marca: string
  nome: string
  modelo?: RegExp
  exterior: FotoPalco[]
  interior: FotoPalco[]
}

export const MODELOS_ILUSTRADOS: ModeloIlustrado[] = [
  {
    id: 'jetour',
    marca: 'Jetour',
    nome: 'SUV',
    exterior: [
      { url: '/showroom/jetour-branco.jpg', estudio: true, ilustrativa: true, cor: 'Branco' },
      { url: '/showroom/jetour-azul.jpg', estudio: true, ilustrativa: true, cor: 'Azul' },
    ],
    interior: [
      { url: '/showroom/jetour-interior-preto.jpg', ilustrativa: true, cor: 'Preto e vermelho' },
      { url: '/showroom/jetour-interior-castanho.jpg', ilustrativa: true, cor: 'Castanho' },
    ],
  },
  {
    id: 'toyota-fortuner',
    marca: 'Toyota',
    nome: 'Fortuner',
    modelo: /fortuner/i,
    exterior: [
      { url: '/showroom/fortuner-preto.jpg', estudio: true, vinheta: true, ilustrativa: true, cor: 'Preto' },
      { url: '/showroom/fortuner-prata.jpg', estudio: true, vinheta: true, ilustrativa: true, cor: 'Prata' },
      { url: '/showroom/fortuner-azul.jpg', estudio: true, ilustrativa: true, cor: 'Azul' },
    ],
    interior: [{ url: '/showroom/fortuner-interior.jpg', ilustrativa: true, cor: 'Pele caramelo' }],
  },
]

const mesmaCor = (a?: string | null, b?: string) => !!a && !!b && a.toLowerCase().slice(0, 4) === b.toLowerCase().slice(0, 4)

export function ilustrativasDe(marca?: string | null, modelo?: string | null, cor?: string | null) {
  const m = MODELOS_ILUSTRADOS.find((x) =>
    x.marca.toLowerCase() === (marca ?? '').trim().toLowerCase() && (!x.modelo || x.modelo.test(modelo ?? '')))
  if (!m) return null
  // A imagem com a cor da viatura vem primeiro
  const exterior = [...m.exterior].sort((a, b) => Number(mesmaCor(cor, b.cor)) - Number(mesmaCor(cor, a.cor)))
  return { exterior, interior: m.interior }
}
