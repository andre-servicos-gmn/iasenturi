import { Dominio, ISESOClassificacao } from '@/types'
import configAcoes from '@/data/config.json'
import isesoTable from '@/data/iseso_classificacao.json'

// Classificação de risco baseada no valor do domínio
export const classificarRisco = (valor: number): 'critico' | 'atencao' | 'favoravel' => {
  if (valor < 40) return 'critico'
  if (valor < 70) return 'atencao'
  return 'favoravel'
}

// Cálculo do ISESO Geral (média ponderada dos 8 domínios)
export const calcularISESO = (dominios: Dominio[]): number => {
  if (dominios.length === 0) return 0
  
  const soma = dominios.reduce((acc, dominio) => acc + dominio.valor, 0)
  return Math.round(soma / dominios.length)
}

// Obter ações sugeridas baseadas no domínio e classificação
export const obterAcoesSugeridas = (nomeDominio: string, classificacao: string): string[] => {
  const lista = (configAcoes as any).dominios || []
  const acao = lista.find(
    (item: any) => 
      (item.dominio === nomeDominio || item.dominio?.includes(nomeDominio) || nomeDominio?.includes(item.dominio)) && 
      item.classificacao === classificacao
  )
  return acao?.acoes || []
}

// Classificação completa ISESO com faixas 0–100
export const classificarISESOCompleto = (valor: number) => {
  const faixa = (isesoTable as any).faixas.find((f: any) => valor >= f.min && valor <= f.max)
  if (!faixa) {
    return {
      icone: 'ℹ️',
      cor: '#718096',
      nome: 'Sem classificação',
      descricaoResumida: 'Valor fora de faixa definida',
      descricaoExpandida: 'Não foi possível classificar o índice informado.',
      acoesSimples: [],
      acoesIntermediarias: [],
      acoesComplexas: [],
      pcmsoPgr: { integracao: '—', prioridade: 0, frequencia_reavaliacao: '—' }
    }
  }
  const result: ISESOClassificacao = {
    faixaMin: faixa.min,
    faixaMax: faixa.max,
    icone: faixa.icone,
    cor: faixa.cor,
    nome: faixa.nome,
    descricaoResumida: faixa.descricao_resumida,
    descricaoExpandida: faixa.descricao_expandida,
    acoesSimples: faixa.acoes_simples,
    acoesIntermediarias: faixa.acoes_intermediarias,
    acoesComplexas: faixa.acoes_complexas,
    pcmsoPgr: faixa.pcmso_pgr
  }
  return result
}

// Determinar cor Chakra baseada na faixa completa
export const getChakraColorFromISESO = (valor: number): 'red' | 'orange' | 'yellow' | 'green' | 'blue' => {
  if (valor <= 39) return 'red'
  if (valor <= 54) return 'orange'
  if (valor <= 69) return 'yellow'
  if (valor <= 84) return 'green'
  return 'blue'
}

// Mapear ISESO 5 faixas -> tri-classe (critico/atencao/favoravel) para ações por domínio
export const getTriClassificacaoFromISESO = (valor: number): 'critico' | 'atencao' | 'favoravel' => {
  if (valor <= 39) return 'critico'
  if (valor <= 69) return 'atencao'
  return 'favoravel'
}

// Formatação de data
export const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR')
}

// Formatação de porcentagem
export const formatarPorcentagem = (valor: number): string => {
  return `${valor.toFixed(1)}%`
}

// Cores baseadas na classificação
export const obterCorClassificacao = (classificacao: string): string => {
  switch (classificacao) {
    case 'critico':
      return '#E53E3E' // vermelho
    case 'atencao':
      return '#D69E2E' // amarelo
    case 'favoravel':
      return '#38A169' // verde
    default:
      return '#718096' // cinza
  }
}

// Ícones baseados na classificação
export const obterIconeClassificacao = (classificacao: string): string => {
  switch (classificacao) {
    case 'critico':
      return '⚠️'
    case 'atencao':
      return '🟡'
    case 'favoravel':
      return '✅'
    default:
      return 'ℹ️'
  }
}

// Filtro de dados por período
export const filtrarPorPeriodo = (dados: any[], inicio: string, fim: string) => {
  const dataInicio = new Date(inicio)
  const dataFim = new Date(fim)
  
  return dados.filter(item => {
    const dataItem = new Date(item.dataAvaliacao || item.data)
    return dataItem >= dataInicio && dataItem <= dataFim
  })
}

// Agrupamento de dados por setor
export const agruparPorSetor = (dados: any[]) => {
  return dados.reduce((acc, item) => {
    const setor = item.setor || 'Sem Setor'
    if (!acc[setor]) {
      acc[setor] = []
    }
    acc[setor].push(item)
    return acc
  }, {} as Record<string, any[]>)
}

// Cálculo de média por setor
export const calcularMediaSetor = (dados: any[], setor: string): number => {
  const dadosSetor = dados.filter(item => item.setor === setor)
  if (dadosSetor.length === 0) return 0
  
  const soma = dadosSetor.reduce((acc, item) => acc + (item.valor || 0), 0)
  return Math.round(soma / dadosSetor.length)
}

// Validação de dados
export const validarDados = (dados: any): boolean => {
  return dados && Array.isArray(dados) && dados.length > 0
}

// Debounce para otimização de performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
} 