export type Perfil = 'admin' | 'vendedor' | 'stock'

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: Perfil | string
  ativo: boolean
}

export interface Custo {
  id: string
  viatura_id: string
  tipo: string
  descricao?: string | null
  valor: number
  data?: string | null
}

/** Os campos de dinheiro só vêm quando o perfil os pode ver:
 *  preco_compra/custos → administrador e stock; preco_venda → administrador e vendedor; margem → administrador. */
export interface Viatura {
  id: string
  marca: string
  modelo: string
  ano?: number | null
  matricula?: string | null
  chassis?: string | null
  cor?: string | null
  combustivel?: string | null
  transmissao?: string | null
  quilometragem?: number | null
  estado: string
  data_entrada?: string | null
  observacoes?: string | null
  data_criacao?: string | null
  preco_compra?: number
  custos_extras?: number
  custo_total?: number
  preco_venda?: number | null
  margem?: number | null
  custos?: Custo[]
}

export interface Cliente {
  id: string
  nome: string
  documento?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  data_criacao?: string
}

export interface ViaturaResumo {
  id: string
  marca: string
  modelo: string
  ano?: number | null
  matricula?: string | null
  chassis?: string | null
  cor?: string | null
}

export interface Proposta {
  id: string
  numero?: string | null
  viatura_id: string
  cliente_id: string
  vendedor_id?: string | null
  vendedor?: string | null
  valor_proposto: number
  forma_pagamento?: string | null
  estado: string
  observacoes?: string | null
  data?: string | null
  viatura?: ViaturaResumo | null
  cliente?: Cliente | null
}

export interface Venda {
  id: string
  numero?: string | null
  viatura_id: string
  cliente_id: string
  vendedor_id?: string | null
  vendedor?: string | null
  proposta_id?: string | null
  preco_venda: number
  forma_pagamento: string
  observacoes?: string | null
  data?: string | null
  viatura?: ViaturaResumo | null
  cliente?: Cliente | null
  custo_total?: number
  lucro?: number
}

export type PorEstado = Record<string, number>

export interface PainelAdmin {
  perfil: 'admin'
  stock: PorEstado
  valor_stock: { custo: number; venda: number; sem_preco: number }
  vendas_mes: { quantidade: number; receita: number; lucro: number }
  vendas_total: { quantidade: number; receita: number; lucro: number }
  por_mes: { mes: string; receita: number; lucro: number }[]
  propostas_pendentes: number
  ultimas_vendas: Venda[]
}

export interface PainelVendedor {
  perfil: 'vendedor'
  disponiveis: number
  propostas_pendentes: number
  propostas_aceites: number
  vendas_mes: { quantidade: number; valor: number }
  ultimas_vendas: Venda[]
}

export interface PainelStock {
  perfil: 'stock'
  stock: PorEstado
  em_preparacao: Viatura[]
  custos_mes: number
}

export type Painel = PainelAdmin | PainelVendedor | PainelStock
