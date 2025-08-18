export type RiskLevel = 'low' | 'medium' | 'high'

export interface ReportDomain {
  name: string
  score: number
  risk: RiskLevel
  description?: string
}

export interface DashboardLikeData {
  companyName: string
  period: string
  totalEmployees: number
  riskLevel: RiskLevel
  dominios: ReportDomain[]
}

export interface GeneratedTexts {
  executiveSummary: string
  insights: string[]
  recommendations: string[]
}

const riskLabelPt = (risk: RiskLevel): string => {
  switch (risk) {
    case 'high':
      return 'alto'
    case 'medium':
      return 'médio'
    case 'low':
    default:
      return 'baixo'
  }
}

export const generateTexts = (data: DashboardLikeData): GeneratedTexts => {
  if (!data || !data.dominios || data.dominios.length === 0) {
    return {
      executiveSummary: 'Relatório indisponível: não há dados suficientes para gerar o sumário executivo.',
      insights: ['Sem dados para análise de insights.'],
      recommendations: ['Colete dados válidos para que recomendações possam ser geradas.']
    }
  }

  const domainsSortedByScore = [...data.dominios].sort((a, b) => a.score - b.score)
  const worstDomains = domainsSortedByScore.slice(0, 3)
  const bestDomains = [...data.dominios].sort((a, b) => b.score - a.score).slice(0, 2)

  const averageScore = data.dominios.reduce((acc, d) => acc + d.score, 0) / data.dominios.length
  const riskCounts = {
    high: data.dominios.filter(d => d.risk === 'high').length,
    medium: data.dominios.filter(d => d.risk === 'medium').length,
    low: data.dominios.filter(d => d.risk === 'low').length
  }

  const executiveSummaryParts: string[] = []
  executiveSummaryParts.push(
    `Este relatório da empresa ${data.companyName} cobre o período de ${data.period} e considera ${data.totalEmployees} colaborador${data.totalEmployees === 1 ? '' : 'es'}.`
  )
  executiveSummaryParts.push(
    `A pontuação média dos domínios foi ${Math.round(averageScore)} em 100, com risco geral ${riskLabelPt(data.riskLevel)}.`
  )
  executiveSummaryParts.push(
    `Distribuição de risco entre domínios: alto ${riskCounts.high}, médio ${riskCounts.medium} e baixo ${riskCounts.low}.`
  )
  if (worstDomains.length > 0) {
    const worstText = worstDomains.map(d => `${d.name} (${Math.round(d.score)})`).join(', ')
    executiveSummaryParts.push(`Pontos de atenção: ${worstText}.`)
  }

  const insights: string[] = []
  insights.push(`Risco geral ${riskLabelPt(data.riskLevel)} com média de ${Math.round(averageScore)} pontos.`)
  if (riskCounts.high > 0) insights.push(`${riskCounts.high} domínio${riskCounts.high > 1 ? 's' : ''} em risco alto requer(em) intervenção prioritária.`)
  if (riskCounts.medium > 0) insights.push(`${riskCounts.medium} domínio${riskCounts.medium > 1 ? 's' : ''} em atenção (risco médio) demanda(m) acompanhamento.`)
  if (bestDomains.length > 0) {
    const bestText = bestDomains.map(d => `${d.name} (${Math.round(d.score)})`).join(', ')
    insights.push(`Pontos fortes: ${bestText}.`)
  }
  for (const domain of worstDomains) {
    insights.push(`${domain.name}: score ${Math.round(domain.score)} e risco ${riskLabelPt(domain.risk)}.`)
  }

  // Recomendações baseadas no risco de cada domínio (genéricas e curtas)
  const recommendations: string[] = []
  for (const domain of data.dominios) {
    const rounded = Math.round(domain.score)
    if (domain.risk === 'high') {
      recommendations.push(`${domain.name}: iniciar plano de ação imediato, revisar processos e realizar comunicação com liderança (score ${rounded}).`)
    } else if (domain.risk === 'medium') {
      recommendations.push(`${domain.name}: implementar melhorias incrementais e monitorar indicadores quinzenalmente (score ${rounded}).`)
    } else {
      recommendations.push(`${domain.name}: manter práticas atuais e compartilhar aprendizados com outras áreas (score ${rounded}).`)
    }
    if (recommendations.length >= 8) break
  }

  return {
    executiveSummary: executiveSummaryParts.join(' '),
    insights,
    recommendations
  }
}


