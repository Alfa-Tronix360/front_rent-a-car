import type { Perfil, Usuario } from '../types'

export const NOMES_PERFIL: Record<Perfil, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  stock: 'Gestor de stock',
}

export const nomePerfil = (p?: string) => NOMES_PERFIL[p as Perfil] ?? p ?? '—'

/** Páginas a que cada perfil tem acesso (a API aplica as mesmas regras). */
export const ACESSO: Record<string, Perfil[]> = {
  '/': ['admin', 'vendedor', 'stock'],
  '/viaturas': ['admin', 'vendedor', 'stock'],
  '/clientes': ['admin', 'vendedor'],
  '/propostas': ['admin', 'vendedor'],
  '/vendas': ['admin', 'vendedor'],
  '/utilizadores': ['admin'],
}

export const pode = (u: Usuario | null, rota: string) => !!u && (ACESSO[rota] ?? []).includes(u.perfil as Perfil)

export const ESTADOS_VIATURA = ['Em Trânsito', 'Em Preparação', 'Disponível', 'Reservado', 'Vendido']
export const ESTADOS_STOCK = ['Em Trânsito', 'Em Preparação', 'Disponível']
export const TIPOS_CUSTO = ['Desalfandegamento', 'Transporte', 'Reparação', 'Manutenção', 'Documentação', 'Outro']
export const FORMAS_PAGAMENTO = ['Numerário', 'Transferência bancária', 'Multicaixa / TPA', 'Cheque', 'Financiamento']
export const COMBUSTIVEIS = ['Gasolina', 'Diesel', 'Híbrido', 'Elétrico']
export const TRANSMISSOES = ['Manual', 'Automática']
