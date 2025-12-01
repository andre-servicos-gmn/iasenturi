import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Empresa, Intervencao, DadosHistoricoCompleto, HistoricoISESO, Topico } from '@/types'
import { classificarISESOCompleto } from '@/lib/utils'

function generateUUID(): string {
  // RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Exigir .env válido em runtime (não usar credenciais embutidas)
const SUPABASE_URL = supabaseUrl || ''
const SUPABASE_ANON_KEY = supabaseAnonKey || ''

console.log('=== DEBUG SUPABASE ===')
console.log('Supabase URL (env set):', !!supabaseUrl)
console.log('Supabase Key exists (env):', !!supabaseAnonKey)
console.log('========================')

// Criar cliente Supabase
let supabase: SupabaseClient | null = null

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  console.log('✅ Supabase client created successfully')
  console.log('🔗 Supabase URL:', SUPABASE_URL)
  console.log('🔑 Supabase Key exists:', !!SUPABASE_ANON_KEY)
} catch (error) {
  console.error('❌ Error creating Supabase client:', error)
  supabase = null
}

export { supabase }

// Tipos baseados na estrutura da tabela COPSQ_respostas
export interface COPSQResposta {
  id: string
  created_at: string
  nome_completo: string | null
  area_setor: string | null
  tempo_organizacao: string | null
  faixa_etaria: string | null
  data_resposta: string | null
  comentario_final: string | null

  // Campos de demanda
  exige_concentracao: string | null
  exige_memorizacao: string | null
  demandas_emocionais: string | null
  influencia_no_trabalho: string | null
  decide_tarefas: string | null
  desenvolve_habilidades: string | null

  // Campos de suporte social
  colegas_ajudam: string | null
  apoio_superior: string | null
  respeito_superiores: string | null
  reconhecimento_superior: string | null
  clima_cooperacao: string | null

  // Campos de interface trabalho-vida
  impacto_negativo_vida_pessoal: string | null
  dificuldade_relaxar: string | null
  tempo_para_vida_pessoal: string | null

  // Campos de significado do trabalho
  trabalho_significativo: string | null
  orgulho_trabalho: string | null
  valorizado_pelo_que_faz: string | null

  // Campos de insegurança no trabalho
  medo_perder_emprego: string | null
  futuro_incerto: string | null
  posicao_estavel: string | null

  // Campos de bem-estar
  esgotamento_ao_final_do_dia: string | null
  dormir_por_causa_do_trabalho: string | null
  dores_fisicas: string | null
  satisfacao_com_saude: string | null

  // Campos de desenvolvimento
  Desenvolver_Raciocinio: string | null
  Senso_Claro_De_Utilidade: string | null
  Frenquencia_Falta_De_Energia: string | null
  Errar_Sem_Ser_Julgado: string | null
  Espaço_Para_Inovar: string | null

  // Médias calculadas
  media_exigencias: string | null
  risco_exigencias: string | null
  media_organizacao: string | null
  risco_organizacao: string | null
  media_relacoes: string | null
  risco_relacoes: string | null
  media_interface: string | null
  risco_interface: string | null
  media_significado: string | null
  risco_significado: string | null
  media_inseguranca: string | null
  risco_inseguranca: string | null
  media_bem_estar: string | null
  risco_bem_estar: string | null
  iseso: string | null
  risco_iseso: string | null
  // Campos derivados para relatório (armazenados ou calculados)
  iseso_classificacao?: string | null
  iseso_classificacao_nome?: string | null
  iseso_classificacao_cor?: string | null
  iseso_pcmso_prioridade?: number | null
  iseso_pcmso_frequencia?: string | null

  // Campos adicionais
  Trabalho_Rapido: string | null
  Decidir_Velocidade: string | null
  Contribui_Positivamente: string | null
  empresa_id: string | null
  saude_emocional: string | null
  risco_saúde_emocional: string | null
}

// Função para buscar dados do COPSOQ
export async function fetchCOPSQData() {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    console.log('Fetching COPSQ data...')

    // Primeiro, vamos buscar todos os dados sem filtros
    const { data: allData, error: allError } = await supabase
      .from('COPSQ_respostas')
      .select('*')

    console.log('All data:', allData?.length || 0, 'records')
    console.log('Sample data:', allData?.[0])

    if (allError) {
      console.error('Erro ao buscar todos os dados:', allError)
      return []
    }

    // Agora buscar apenas os dados com nome_completo e area_setor
    const { data, error } = await supabase
      .from('COPSQ_respostas')
      .select('*')
      .not('nome_completo', 'is', null)
      .not('area_setor', 'is', null)

    if (error) {
      console.error('Erro ao buscar dados filtrados:', error)
      return []
    }

    console.log('Filtered data:', data?.length || 0, 'records')
    console.log('Data fetched successfully:', data?.length || 0, 'records')

    // Se não há dados filtrados, retornar todos os dados
    if (!data || data.length === 0) {
      console.log('No filtered data found, returning all data')
      return allData || []
    }

    const enriched = (data || []).map(row => {
      // Derivar classificação ISESO e campos PCMSO/PGR se houver valor numérico válido
      const val = row.iseso ? parseFloat(row.iseso) : NaN
      if (!isNaN(val)) {
        const klass = classificarISESOCompleto(val)
        return {
          ...row,
          iseso_classificacao: klass.icone,
          iseso_classificacao_nome: klass.nome,
          iseso_classificacao_cor: klass.cor,
          iseso_pcmso_prioridade: klass.pcmsoPgr.prioridade,
          iseso_pcmso_frequencia: klass.pcmsoPgr.frequencia_reavaliacao,
        }
      }
      return row
    })

    // Persiste histórico de forma assíncrona (sem bloquear a UI)
    persistirHistoricoISESO(enriched).catch(() => { })

    return enriched
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    return []
  }
}

// Persistir histórico de classificação ISESO por registro
export async function persistirHistoricoISESO(rows: any[]) {
  try {
    if (!supabase || !rows || rows.length === 0) return
    const payload: Partial<HistoricoISESO>[] = rows
      .map((row: any) => {
        const val = row.iseso ? parseFloat(row.iseso) : NaN
        if (isNaN(val)) return null
        const klass = classificarISESOCompleto(val)
        return {
          id: row.id + ':' + (row.created_at || ''),
          resposta_id: row.id,
          empresa_id: row.empresa_id || null,
          setor: row.area_setor || null,
          iseso_valor: val,
          faixa_nome: klass.nome,
          faixa_icone: klass.icone,
          faixa_cor: klass.cor,
          descricao_resumida: klass.descricaoResumida,
          descricao_expandida: klass.descricaoExpandida,
          acoes_simples: klass.acoesSimples,
          acoes_intermediarias: klass.acoesIntermediarias,
          acoes_complexas: klass.acoesComplexas,
          pcmso_integracao: klass.pcmsoPgr.integracao,
          pcmso_prioridade: klass.pcmsoPgr.prioridade,
          pcmso_frequencia: klass.pcmsoPgr.frequencia_reavaliacao,
          dominio: null,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })
      .filter(Boolean) as Partial<HistoricoISESO>[]

    if (payload.length === 0) return

    // upsert na tabela historico_iseso (crie esta tabela no Supabase - ver README)
    const { error } = await (supabase as any)
      .from('historico_iseso')
      .upsert(payload, { onConflict: 'id' })
    if (error) console.error('Erro ao persistir historico_iseso:', error)
  } catch (e) {
    console.error('persistirHistoricoISESO falhou:', e)
  }
}

// Função para calcular médias por domínio
export function calculateDomainAverages(data: COPSQResposta[]) {
  const domains: Record<string, number[]> = {
    'Exigências do trabalho': [],
    'Demandas Físicas': [],
    'Autonomia e Controle no trabalho': [],
    'Suporte Social e Qualidade da Liderança': [],
    'Esforço e Recompensa': [],
    'Equilíbrio Trabalho - Vida': [],
    'Saúde Emocional e Bem-Estar': []
  }

  data.forEach(resposta => {
    // Mapear campos para domínios (baseado na estrutura COPSOQ)
    if (resposta.media_exigencias) {
      domains['Exigências do trabalho'].push(parseFloat(resposta.media_exigencias))
    }
    if (resposta.media_organizacao) {
      domains['Demandas Físicas'].push(parseFloat(resposta.media_organizacao))
    }
    if (resposta.media_relacoes) {
      domains['Autonomia e Controle no trabalho'].push(parseFloat(resposta.media_relacoes))
    }
    if (resposta.media_interface) {
      domains['Suporte Social e Qualidade da Liderança'].push(parseFloat(resposta.media_interface))
    }
    if (resposta.media_significado) {
      domains['Esforço e Recompensa'].push(parseFloat(resposta.media_significado))
    }
    if (resposta.media_inseguranca) {
      domains['Equilíbrio Trabalho - Vida'].push(parseFloat(resposta.media_inseguranca))
    }
    if (resposta.saude_emocional) {
      domains['Saúde Emocional e Bem-Estar'].push(parseFloat(resposta.saude_emocional))
    }
  })

  // Calcular médias
  const averages = Object.entries(domains).map(([domain, values]) => ({
    nome: domain,
    valor: values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  }))

  return averages
}

// Função para buscar dados por setor
export function getDataBySector(data: COPSQResposta[]) {
  const sectors: Record<string, any[]> = {}

  data.forEach(resposta => {
    if (resposta.area_setor && resposta.iseso) {
      const sector = resposta.area_setor
      if (!sectors[sector]) {
        sectors[sector] = []
      }
      sectors[sector].push({
        setor: sector,
        valor: parseFloat(resposta.iseso),
        mediaGeral: 55 // Média geral do ISESO
      })
    }
  })

  return Object.values(sectors).flat()
}

export function calculateDomainAveragesBySector(data: COPSQResposta[], targetSector: string) {
  console.log('🔍 calculateDomainAveragesBySector - Setor:', targetSector)

  const sectorData = data.filter(item => item.area_setor === targetSector)
  console.log('🔍 Dados do setor encontrados:', sectorData.length, 'registros')

  const averages = calculateDomainAverages(sectorData)

  console.log('📊 Médias do setor', targetSector, ':', averages)
  return averages
}

// Função para calcular médias por domínio usando o mesmo método do mapa de calor (média das médias dos setores)
export function calculateDomainAveragesBySectorAverages(data: COPSQResposta[]) {
  console.log('🔍 calculateDomainAveragesBySectorAverages - Calculando média das médias dos setores')

  // Obter setores únicos
  const setores = [...new Set(data.map(item => item.area_setor).filter(Boolean))]
  console.log('🔍 Setores encontrados:', setores)

  const domains: Record<string, number[]> = {
    'Exigências do trabalho': [],
    'Demandas Físicas': [],
    'Autonomia e Controle no trabalho': [],
    'Suporte Social e Qualidade da Liderança': [],
    'Esforço e Recompensa': [],
    'Equilíbrio Trabalho - Vida': [],
    'Saúde Emocional e Bem-Estar': []
  }

  // Mapear campos para domínios
  const domainFields = [
    'media_exigencias',
    'media_organizacao',
    'media_relacoes',
    'media_interface',
    'media_significado',
    'media_inseguranca',
    'saude_emocional'
  ]

  // Para cada setor, calcular a média e adicionar ao array do domínio
  setores.forEach(setor => {
    const dadosSetor = data.filter(item => item.area_setor === setor)

    domainFields.forEach((field, index) => {
      const domainName = Object.keys(domains)[index]
      const valores = dadosSetor
        .map(item => {
          const valor = (item as any)[field]
          return parseFloat(valor || '0')
        })
        .filter(valor => valor > 0)

      if (valores.length > 0) {
        const mediaSetor = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
        domains[domainName].push(mediaSetor)
        console.log(`📊 Setor ${setor} - ${domainName}: ${mediaSetor} (${valores.length} colaboradores)`)
      }
    })
  })

  // Calcular médias finais (média das médias dos setores)
  const averages = Object.entries(domains).map(([domain, values]) => ({
    nome: domain,
    valor: values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  }))

  console.log('📊 Médias finais (média das médias dos setores):', averages)
  return averages
}

export async function fetchAllSectorsForCompany(empresaId: string): Promise<COPSQResposta[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    console.log('🏢 Buscando dados de todos os setores da empresa para radar:', empresaId)

    const { data, error } = await supabase
      .from('COPSQ_respostas')
      .select('*')
      .eq('empresa_id', empresaId)
      .not('nome_completo', 'is', null)
      .not('area_setor', 'is', null)

    if (error) {
      console.error('❌ Erro ao buscar dados da empresa:', error)
      return []
    }

    console.log('✅ Dados de todos os setores encontrados:', data?.length || 0, 'registros')
    return data || []
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error)
    return []
  }
}

// ===== NOVAS FUNÇÕES PARA HISTÓRICO =====

// Função para buscar empresas
export async function fetchEmpresas(): Promise<Empresa[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome')

    if (error) {
      console.error('Erro ao buscar empresas:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    return []
  }
}

// Função para buscar intervenções
export async function fetchIntervencoes(filtros: {
  empresa_id?: string
  setor?: string
  data_inicio?: string
  data_fim?: string
} = {}): Promise<Intervencao[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('intervencoes')
      .select('*')
      .order('data_inicio', { ascending: false })

    // Aplicar filtros
    if (filtros.empresa_id) {
      query = query.eq('empresa_id', filtros.empresa_id)
    }
    // Tabela 'intervencoes' não possui coluna 'setor' neste schema
    if (filtros.data_inicio) {
      query = query.gte('data_inicio', filtros.data_inicio)
    }
    if (filtros.data_fim) {
      query = query.lte('data_inicio', filtros.data_fim)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar intervenções:', error)
      return []
    }
    // Mapear esquema real do banco (ex.: tipo_intervencao, objetivo, dominios_alvo, etc.)
    const mapped: Intervencao[] = (data || []).map((row: any) => {
      const impactoQualitativo = undefined as Intervencao['impacto_qualitativo'] | undefined
      let custo: number | undefined = undefined
      if (typeof row.custo_estimado === 'number') custo = row.custo_estimado
      else if (typeof row.custo_real === 'number') custo = row.custo_real

      return {
        id: row.id,
        empresa_id: row.empresa_id,
        setor: row.setor || undefined, // pode não existir na tabela
        tipo: row.tipo_intervencao || row.tipo || '',
        titulo: row.titulo || '',
        descricao: row.descricao || '',
        data_inicio: row.data_inicio,
        data_fim: row.data_fim || undefined,
        status: row.status,
        resultado_esperado: row.objetivo || '',
        resultado_observado: row.resultado_obtido || undefined,
        impacto_quantitativo: row.impacto_quantitativo || undefined,
        impacto_qualitativo: impactoQualitativo, // opcional: poderia ser derivado de 'observacoes'
        dominios_afetados: row.dominios_alvo || [],
        responsavel: row.responsavel || '',
        custo,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    })

    return mapped
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    return []
  }
}

// Criar intervenção
export async function createIntervencao(
  intervencao: Omit<Intervencao, 'id' | 'created_at' | 'updated_at'>
): Promise<Intervencao | null> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    // Mapear campos internos -> colunas reais da tabela (ex.: tipo_intervencao, objetivo, dominios_alvo)
    const nowIso = new Date().toISOString()
    const dbInsert: any = {
      id: generateUUID(),
      empresa_id: intervencao.empresa_id,
      titulo: intervencao.titulo,
      descricao: intervencao.descricao,
      tipo_intervencao: (intervencao as any).tipo || intervencao.tipo,
      // assegura formato 'YYYY-MM-DD' para colunas DATE
      data_inicio: (intervencao.data_inicio || '').slice(0, 10),
      data_fim: intervencao.data_fim ? intervencao.data_fim.slice(0, 10) : null,
      status: intervencao.status,
      objetivo: intervencao.resultado_esperado,
      resultado_obtido: intervencao.resultado_observado || null,
      dominios_alvo: Array.isArray(intervencao.dominios_afetados) ? intervencao.dominios_afetados : [],
      responsavel: intervencao.responsavel || null,
      custo_estimado: typeof intervencao.custo === 'number' ? intervencao.custo : null,
      observacoes: intervencao.impacto_qualitativo ? `Impacto qualitativo: ${intervencao.impacto_qualitativo}` : null,
      created_at: nowIso,
      updated_at: nowIso
    }

    console.log('[createIntervencao] dbInsert ->', dbInsert)

    const { error } = await supabase
      .from('intervencoes')
      .insert(dbInsert)

    if (error) {
      console.error('Erro ao criar intervenção:', error)
      // Logar campos úteis do erro para diagnóstico
      // @ts-ignore
      if (error && typeof error === 'object') {
        // @ts-ignore
        console.error('[createIntervencao] message:', error.message)
        // @ts-ignore
        console.error('[createIntervencao] details:', error.details)
        // @ts-ignore
        console.error('[createIntervencao] hint:', error.hint)
      }
      return null
    }
    // Retornar objeto mínimo (algumas RLS podem bloquear SELECT pós-insert)
    const mapped: Intervencao = {
      id: '',
      empresa_id: dbInsert.empresa_id,
      setor: undefined,
      tipo: dbInsert.tipo_intervencao,
      titulo: dbInsert.titulo,
      descricao: dbInsert.descricao,
      data_inicio: dbInsert.data_inicio,
      data_fim: dbInsert.data_fim || undefined,
      status: dbInsert.status,
      resultado_esperado: dbInsert.objetivo,
      resultado_observado: dbInsert.resultado_obtido || undefined,
      impacto_quantitativo: undefined,
      impacto_qualitativo: undefined,
      dominios_afetados: dbInsert.dominios_alvo || [],
      responsavel: dbInsert.responsavel || '',
      custo: dbInsert.custo_estimado || undefined,
      created_at: nowIso,
      updated_at: nowIso
    }

    return mapped
  } catch (error) {
    console.error('Erro na conexão com Supabase ao criar intervenção:', error)
    return null
  }
}

// Atualizar apenas o resultado observado de uma intervenção
export async function updateIntervencaoResultado(
  id: string,
  resultado_obtido: string | null
): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    const { error } = await supabase
      .from('intervencoes')
      .update({ resultado_obtido, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar resultado_obtido da intervenção:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Erro na conexão com Supabase ao atualizar intervenção:', error)
    return false
  }
}

// Atualizar uma intervenção completa
export async function updateIntervencao(
  id: string,
  dados: Partial<Omit<Intervencao, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    const { error } = await supabase
      .from('intervencoes')
      .update({ ...dados, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar intervenção:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro na conexão com Supabase ao atualizar intervenção:', error)
    return false
  }
}

// Deletar uma intervenção
export async function deleteIntervencao(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    const { error } = await supabase
      .from('intervencoes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar intervenção:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro na conexão com Supabase ao deletar intervenção:', error)
    return false
  }
}

// ===== FUNÇÕES PARA TÓPICOS =====

// Buscar todos os tópicos
export async function fetchTopicos(): Promise<Topico[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('topicos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar tópicos:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      descricao: row.descricao || undefined,
      cor: row.cor || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  } catch (error) {
    console.error('Erro na conexão com Supabase ao buscar tópicos:', error)
    return []
  }
}

// Criar tópico
export async function createTopico(
  topico: Omit<Topico, 'id' | 'created_at' | 'updated_at'>
): Promise<Topico | null> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    const nowIso = new Date().toISOString()
    const dbInsert = {
      id: generateUUID(),
      nome: topico.nome,
      descricao: topico.descricao || null,
      cor: topico.cor || null,
      created_at: nowIso,
      updated_at: nowIso
    }

    const { error } = await supabase
      .from('topicos')
      .insert(dbInsert)

    if (error) {
      console.error('Erro ao criar tópico:', error)
      return null
    }

    return {
      id: dbInsert.id,
      nome: dbInsert.nome,
      descricao: dbInsert.descricao || undefined,
      cor: dbInsert.cor || undefined,
      created_at: nowIso,
      updated_at: nowIso
    }
  } catch (error) {
    console.error('Erro na conexão com Supabase ao criar tópico:', error)
    return null
  }
}

// Atualizar tópico
export async function updateTopico(
  id: string,
  dados: Partial<Omit<Topico, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    const { error } = await supabase
      .from('topicos')
      .update({ ...dados, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar tópico:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro na conexão com Supabase ao atualizar tópico:', error)
    return false
  }
}

// Deletar tópico
export async function deleteTopico(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    const { error } = await supabase
      .from('topicos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar tópico:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro na conexão com Supabase ao deletar tópico:', error)
    return false
  }
}

// Função para processar dados históricos por ciclos
export async function fetchDadosHistoricos(filtros: {
  empresa_id?: string
  setor?: string
  periodo_inicio?: string
  periodo_fim?: string
} = {}): Promise<DadosHistoricoCompleto[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    // Buscar dados COPSOQ com filtros
    let query = supabase
      .from('COPSQ_respostas')
      .select('*')
      .not('nome_completo', 'is', null)
      .not('area_setor', 'is', null)

    if (filtros.empresa_id) {
      query = query.eq('empresa_id', filtros.empresa_id)
    }
    if (filtros.setor) {
      query = query.eq('area_setor', filtros.setor)
    }
    if (filtros.periodo_inicio) {
      query = query.gte('created_at', filtros.periodo_inicio)
    }
    if (filtros.periodo_fim) {
      query = query.lte('created_at', filtros.periodo_fim)
    }

    const { data: copsoqData, error: copsoqError } = await query

    if (copsoqError) {
      console.error('Erro ao buscar dados COPSOQ:', copsoqError)
      return []
    }

    // Buscar intervenções
    const intervencoes = await fetchIntervencoes(filtros)

    // Processar dados por ciclos (trimestres)
    const ciclos = processarCiclosAvaliacao(copsoqData || [], intervencoes)

    return ciclos
  } catch (error) {
    console.error('Erro ao buscar dados históricos:', error)
    return []
  }
}

// Função para processar ciclos de avaliação
function processarCiclosAvaliacao(
  copsoqData: COPSQResposta[],
  intervencoes: Intervencao[]
): DadosHistoricoCompleto[] {
  const ciclos: Record<string, DadosHistoricoCompleto> = {}

  // Agrupar dados por trimestre
  copsoqData.forEach(resposta => {
    if (resposta.created_at) {
      const data = new Date(resposta.created_at)
      const ano = data.getFullYear()
      const mes = data.getMonth()
      const trimestre = Math.floor(mes / 3) + 1
      const chave = `${ano}-T${trimestre}`

      if (!ciclos[chave]) {
        const meses = ['Jan', 'Abr', 'Jul', 'Out']
        const nomeCiclo = `${meses[trimestre - 1]}/${ano}`

        ciclos[chave] = {
          ciclo: {
            id: chave,
            empresa_id: resposta.empresa_id || '',
            setor: resposta.area_setor || undefined,
            data_inicio: new Date(ano, (trimestre - 1) * 3, 1).toISOString(),
            data_fim: new Date(ano, trimestre * 3, 0).toISOString(),
            nome: nomeCiclo,
            total_colaboradores: 0,
            dominios_medios: {},
            iseso_medio: 0,
            created_at: new Date().toISOString()
          },
          intervencoes: [],
          comparacao_anterior: undefined
        }
      }

      // Adicionar dados do colaborador
      ciclos[chave].ciclo.total_colaboradores++

      // Calcular médias dos domínios
      const dominios = [
        { key: 'media_exigencias', nome: 'Demandas Psicológicas' },
        { key: 'media_organizacao', nome: 'Demandas Físicas' },
        { key: 'media_relacoes', nome: 'Demandas de Trabalho' },
        { key: 'media_interface', nome: 'Suporte Social e Liderança' },
        { key: 'media_significado', nome: 'Esforço e Recompensa' },
        { key: 'media_inseguranca', nome: 'Interface Trabalho-Vida' },
        { key: 'saude_emocional', nome: 'Saúde Emocional' }
      ]

      dominios.forEach(dominio => {
        const raw = resposta[dominio.key as keyof COPSQResposta] as unknown as string | number | null
        const num = typeof raw === 'number' ? raw : raw ? parseFloat(raw) : NaN
        if (!isNaN(num)) {
          if (!ciclos[chave].ciclo.dominios_medios[dominio.nome]) {
            ciclos[chave].ciclo.dominios_medios[dominio.nome] = 0
          }
          ciclos[chave].ciclo.dominios_medios[dominio.nome] += num
        }
      })

      // Calcular ISESO médio
      if (resposta.iseso && !isNaN(parseFloat(resposta.iseso))) {
        ciclos[chave].ciclo.iseso_medio += parseFloat(resposta.iseso)
      }
    }
  })

  // Calcular médias finais
  Object.values(ciclos).forEach(ciclo => {
    Object.keys(ciclo.ciclo.dominios_medios).forEach(dominio => {
      if (ciclo.ciclo.total_colaboradores > 0) {
        ciclo.ciclo.dominios_medios[dominio] = Math.round(
          ciclo.ciclo.dominios_medios[dominio] / ciclo.ciclo.total_colaboradores
        )
      }
    })

    if (ciclo.ciclo.total_colaboradores > 0) {
      ciclo.ciclo.iseso_medio = Math.round(
        ciclo.ciclo.iseso_medio / ciclo.ciclo.total_colaboradores
      )
    }
  })

  // Adicionar intervenções aos ciclos
  intervencoes.forEach(intervencao => {
    const dataInicio = new Date(intervencao.data_inicio)
    const ano = dataInicio.getFullYear()
    const mes = dataInicio.getMonth()
    const trimestre = Math.floor(mes / 3) + 1
    const chave = `${ano}-T${trimestre}`

    if (ciclos[chave]) {
      ciclos[chave].intervencoes.push(intervencao)
    }
  })

  // Ordenar por data
  return Object.values(ciclos).sort((a, b) =>
    new Date(a.ciclo.data_inicio).getTime() - new Date(b.ciclo.data_inicio).getTime()
  )
}

// Função para calcular métricas de saúde mental
export function calcularMetricasSaudeMental(ciclos: DadosHistoricoCompleto[]) {
  if (ciclos.length === 0) return null

  const metricas = {
    tendencia_geral: 'estavel' as 'melhorando' | 'piorando' | 'estavel',
    dominios_criticos: [] as string[],
    dominios_melhorando: [] as string[],
    dominios_piorando: [] as string[],
    impacto_intervencoes: 0,
    recomendacoes: [] as string[]
  }

  // Analisar tendência geral do ISESO
  const isesoValues = ciclos.map(c => c.ciclo.iseso_medio)
  const primeiroISESO = isesoValues[0]
  const ultimoISESO = isesoValues[isesoValues.length - 1]
  const variacaoISESO = ultimoISESO - primeiroISESO

  if (variacaoISESO > 5) {
    metricas.tendencia_geral = 'melhorando'
  } else if (variacaoISESO < -5) {
    metricas.tendencia_geral = 'piorando'
  }

  // Analisar domínios específicos
  const dominios = [
    'Demandas Psicológicas',
    'Demandas Físicas',
    'Demandas de Trabalho',
    'Suporte Social e Liderança',
    'Esforço e Recompensa',
    'Interface Trabalho-Vida',
    'Saúde Emocional'
  ]

  dominios.forEach(dominio => {
    const valores = ciclos.map(c => c.ciclo.dominios_medios[dominio] || 0)
    const primeiro = valores[0]
    const ultimo = valores[valores.length - 1]
    const variacao = ultimo - primeiro

    // Identificar domínios críticos (< 40)
    if (ultimo < 40) {
      metricas.dominios_criticos.push(dominio)
    }

    // Identificar tendências
    if (variacao > 10) {
      metricas.dominios_melhorando.push(dominio)
    } else if (variacao < -10) {
      metricas.dominios_piorando.push(dominio)
    }
  })

  // Calcular impacto das intervenções
  const ciclosComIntervencoes = ciclos.filter(c => c.intervencoes.length > 0)
  if (ciclosComIntervencoes.length > 0) {
    metricas.impacto_intervencoes = Math.round(
      (ciclosComIntervencoes.length / ciclos.length) * 100
    )
  }

  // Gerar recomendações
  if (metricas.dominios_criticos.length > 0) {
    metricas.recomendacoes.push(
      `Atenção: ${metricas.dominios_criticos.length} domínio(s) em estado crítico`
    )
  }

  if (metricas.dominios_piorando.length > 0) {
    metricas.recomendacoes.push(
      `Intervenção urgente necessária em: ${metricas.dominios_piorando.join(', ')}`
    )
  }

  if (metricas.tendencia_geral === 'melhorando') {
    metricas.recomendacoes.push('Tendência positiva mantida - continuar ações')
  }

  return metricas
}

// Função para calcular comparação entre ciclos
export function calcularComparacaoCiclos(ciclos: DadosHistoricoCompleto[]): DadosHistoricoCompleto[] {
  return ciclos.map((ciclo, index) => {
    if (index === 0) return ciclo

    const cicloAnterior = ciclos[index - 1]
    const comparacao = {
      dominios: {} as { [key: string]: { antes: number; depois: number; variacao: number } },
      iseso: {
        antes: cicloAnterior.ciclo.iseso_medio,
        depois: ciclo.ciclo.iseso_medio,
        variacao: ciclo.ciclo.iseso_medio - cicloAnterior.ciclo.iseso_medio
      }
    }

    // Comparar domínios
    Object.keys(ciclo.ciclo.dominios_medios).forEach(dominio => {
      const antes = cicloAnterior.ciclo.dominios_medios[dominio] || 0
      const depois = ciclo.ciclo.dominios_medios[dominio] || 0

      comparacao.dominios[dominio] = {
        antes,
        depois,
        variacao: depois - antes
      }
    })

    return {
      ...ciclo,
      comparacao_anterior: comparacao
    }
  })
} 