// Tipos base para o Senturi 4.0

export interface Colaborador {
  id: string
  nome: string
  setor: string
  empresa: string
  dataAvaliacao: string
  dominioCritico: string
  isesoGeral: number
}

export interface Dominio {
  id: number
  nome: string
  valor: number
  classificacao: 'critico' | 'atencao' | 'favoravel'
  mediaSetor: number
}

export interface FiltrosGlobais {
  empresa: string
  setor: string
  periodo: {
    inicio: string
    fim: string
  }
  genero?: string
  faixaEtaria?: string
}

export interface AcaoSugerida {
  dominio: string
  classificacao: 'critico' | 'atencao' | 'favoravel'
  acoes: string[]
}

export interface ConfigAcoes {
  dominios: AcaoSugerida[]
}

export interface DadosHistorico {
  data: string
  dominios: Dominio[]
  intervencoes: string[]
}

export interface DadosMapaCalor {
  setor: string
  dominios: {
    [key: string]: number
  }
}

export interface ISESO {
  geral: number
  dominios: Dominio[]
  colaboradoresAvaliados: number
  setoresCriticos: string[]
  ultimaAtualizacao: string
}

export interface PCMSOPGRIntegracao {
  integracao: string
  prioridade: number
  frequencia_reavaliacao: string
}

export interface ISESOClassificacao {
  faixaMin: number
  faixaMax: number
  icone: string
  cor: string
  nome: string
  descricaoResumida: string
  descricaoExpandida: string
  acoesSimples: string[]
  acoesIntermediarias: string[]
  acoesComplexas: string[]
  pcmsoPgr: PCMSOPGRIntegracao
}

export interface HistoricoISESO {
  id: string
  resposta_id: string
  empresa_id?: string | null
  setor?: string | null
  iseso_valor: number
  faixa_nome: string
  faixa_icone: string
  faixa_cor: string
  descricao_resumida: string
  descricao_expandida: string
  acoes_simples: string[]
  acoes_intermediarias: string[]
  acoes_complexas: string[]
  pcmso_integracao: string
  pcmso_prioridade: number
  pcmso_frequencia: string
  dominio?: string | null
  created_at: string
  updated_at: string
}

// Novas interfaces para as tabelas do Supabase
export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  setores: string[]
  created_at: string
  updated_at: string
}

export interface Intervencao {
  id: string
  empresa_id: string
  setor?: string
  tipo: string
  titulo: string
  descricao: string
  data_inicio: string
  data_fim?: string
  status: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada'
  resultado_esperado: string
  resultado_observado?: string
  impacto_quantitativo?: number
  impacto_qualitativo?: 'positivo' | 'negativo' | 'neutro'
  dominios_afetados: string[]
  responsavel: string
  custo?: number
  created_at: string
  updated_at: string
}

export interface CicloAvaliacao {
  id: string
  empresa_id: string
  setor?: string
  data_inicio: string
  data_fim: string
  nome: string // ex: "1º Trimestre 2024"
  total_colaboradores: number
  dominios_medios: {
    [key: string]: number
  }
  iseso_medio: number
  created_at: string
}

export interface DadosHistoricoCompleto {
  ciclo: CicloAvaliacao
  intervencoes: Intervencao[]
  comparacao_anterior?: {
    dominios: { [key: string]: { antes: number; depois: number; variacao: number } }
    iseso: { antes: number; depois: number; variacao: number }
  }
} 