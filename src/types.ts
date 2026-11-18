export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean
}

export interface Veiculo {
  id: string
  matricula: string
  marca: string
  modelo: string
  ano?: number | null
  categoria?: string | null
  combustivel?: string | null
  transmissao?: string | null
  lugares: number
  preco_dia: number
  estado: string
  imagem_url?: string | null
  data_criacao: string
}

export interface Cliente {
  id: string
  nome: string
  documento?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  carta_conducao?: string | null
  validade_carta?: string | null
  data_criacao: string
}

export interface Aluguer {
  id: string
  numero?: string | null
  cliente_id: string
  veiculo_id: string
  data_inicio: string
  data_fim: string
  valor_diaria: number
  dias: number
  total: number
  estado: string
  observacoes?: string | null
  data_criacao: string
  cliente?: { id: string; nome: string; telefone?: string | null } | null
  veiculo?: { id: string; matricula: string; marca: string; modelo: string } | null
}

export interface Pagamento {
  id: string
  aluguer_id: string
  valor: number
  metodo?: string | null
  estado: string
  data: string
  data_criacao: string
}

export interface ReceitaMes {
  mes: string
  valor: number
}

export interface DashboardStats {
  veiculos: { total: number; disponiveis: number; alugados: number; manutencao: number }
  clientes: number
  alugueres: { total: number; ativos: number; reservados: number; concluidos: number }
  financeiro: { receita_total: number; receita_mes: number; por_cobrar: number }
  receita_por_mes: ReceitaMes[]
  ultimos_alugueres: {
    id: string
    numero?: string | null
    cliente: string
    veiculo: string
    matricula: string
    estado: string
    total: number
    data_inicio?: string | null
    data_fim?: string | null
  }[]
  proximas_devolucoes: {
    id: string
    numero?: string | null
    cliente: string
    veiculo: string
    matricula: string
    data_fim?: string | null
  }[]
}
