/** Converte o nome da cor (texto livre da ficha da viatura) numa amostra visual. */
const CORES: [RegExp, string][] = [
  [/p[ée]rola|marfim/i, '#ece8df'],
  [/branc|white/i, '#e9eaec'],
  [/pret|black|negro/i, '#121316'],
  [/prat|silver|alum/i, '#b9bdc3'],
  [/grafite|chumbo|antracite/i, '#3b4047'],
  [/cinz|gr[ae]y/i, '#6a7078'],
  [/azul|blue|marinho/i, '#1f4d96'],
  [/vermelh|red|encarnad/i, '#b3121d'],
  [/bord|vinho|grená/i, '#6b1420'],
  [/verde|green/i, '#2f5d3a'],
  [/bege|beige|areia/i, '#cdb89a'],
  [/castanh|brown|chocolate|caf[ée]/i, '#5a3d2b'],
  [/bronze|cobre/i, '#8a6a45'],
  [/dourad|gold|champanhe/i, '#c2a35a'],
  [/laranj|orange/i, '#d8641e'],
  [/amarel|yellow/i, '#e0b520'],
]

export function corDe(nome?: string | null): { hex: string; conhecida: boolean } {
  const achada = nome ? CORES.find(([re]) => re.test(nome)) : undefined
  return achada ? { hex: achada[1], conhecida: true } : { hex: '#4b525c', conhecida: false }
}

/** Fundo com brilho metalizado para a amostra de cor. */
export function amostraMetal(hex: string): string {
  return [
    'radial-gradient(circle at 32% 26%, rgb(255 255 255 / 0.7) 0, rgb(255 255 255 / 0) 36%)',
    'radial-gradient(circle at 72% 82%, rgb(0 0 0 / 0.5) 0, rgb(0 0 0 / 0) 58%)',
    `linear-gradient(145deg, ${hex}, ${hex})`,
  ].join(', ')
}
