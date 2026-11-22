import type { Perfil, Usuario } from '../types'

export const NOMES_PERFIL: Record<Perfil, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  stock: 'Gestor de stock',
}

export const nomePerfil = (p?: string) => NOMES_PERFIL[p as Perfil] ?? p ?? '—'

/** Tem pelo menos uma das permissões? O administrador tem todas. A API aplica as mesmas regras. */
export const tem = (u: Usuario | null | undefined, ...chaves: string[]) =>
  !!u && (u.perfil === 'admin' || chaves.some((c) => u.permissoes?.includes(c)))

/** Permissões que dão acesso a cada página (basta uma). */
const ACESSO: Record<string, string[] | 'todos' | 'admin'> = {
  '/': 'todos',
  '/viaturas': 'todos',
  '/clientes': ['clientes.gerir', 'propostas.registar', 'vendas.registar'],
  '/propostas': ['propostas.registar', 'propostas.ver_todas', 'propostas.decidir'],
  '/vendas': ['vendas.ver_todas', 'vendas.registar', 'vendas.anular', 'propostas.registar'],
  '/utilizadores': 'admin',
  '/site': ['site.gerir'],
  '/pedidos': ['pedidos.ver'],
}

export const pode = (u: Usuario | null, rota: string) => {
  const regra = ACESSO[rota]
  if (!u || !regra) return false
  if (regra === 'todos') return true
  if (regra === 'admin') return u.perfil === 'admin'
  return tem(u, ...regra)
}

export const ESTADOS_VIATURA = ['Em Trânsito', 'Em Preparação', 'Disponível', 'Reservado', 'Vendido']
export const ESTADOS_STOCK = ['Em Trânsito', 'Em Preparação', 'Disponível']
export const TIPOS_CUSTO = ['Desalfandegamento', 'Transporte', 'Reparação', 'Manutenção', 'Documentação', 'Outro']
export const FORMAS_PAGAMENTO = ['Numerário', 'Transferência bancária', 'Multicaixa / TPA', 'Cheque', 'Financiamento']
export const COMBUSTIVEIS = ['Gasolina', 'Diesel', 'Híbrido', 'Elétrico']
export const TRANSMISSOES = ['Manual', 'Automática']
