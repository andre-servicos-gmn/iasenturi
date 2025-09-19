import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

// Tipos para filtros
interface FilterState {
  empresa: string
  setor: string
  dataInicio: string
  dataFim: string
  tempoEmpresa?: string
  faixaEtaria?: string
}

// Tipos para sidebar
interface SidebarState {
  isOpen: boolean
}

// Tipos para dados filtrados
interface FilteredData {
  id: number
  nome_completo: string
  empresa_id: string
  area_setor: string
  demandas_psicologicas: string
  demandas_fisicas: string
  demandas_trabalho: string
  suporte_social_lideranca: string
  suporte_social: string
  esforco_recompensa: string
  saude_emocional: string
  interface_trabalho_vida: string
  created_at: string
}

// Tipos para contexto
interface FilterContextType {
  // Filtros
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  empresas: string[]
  setores: string[]
  setoresFiltrados: string[]
  temposEmpresa: string[]
  faixasEtarias: string[]
  filteredData: FilteredData[]
  loading: boolean
  applyFilters: () => Promise<void>
  
  // Sidebar
  sidebar: SidebarState
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

// Contexto
const FilterContext = createContext<FilterContextType | undefined>(undefined)

// Hook para usar o contexto
export const useFilters = () => {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

// Provider
export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estados para filtros
  const [filters, setFilters] = useState<FilterState>({
    empresa: '',
    setor: '',
    dataInicio: '',
    dataFim: '',
    tempoEmpresa: '',
    faixaEtaria: ''
  })
  const [empresas, setEmpresas] = useState<string[]>([])
  const [setores, setSetores] = useState<string[]>([])
  const [setoresFiltrados, setSetoresFiltrados] = useState<string[]>([])
  const [temposEmpresa, setTemposEmpresa] = useState<string[]>([])
  const [faixasEtarias, setFaixasEtarias] = useState<string[]>([])
  const [filteredData, setFilteredData] = useState<FilteredData[]>([])
  const [loading, setLoading] = useState(true)

  // Coluna dinâmica para tempo de empresa (tempo_empresa ou tempo_organizacao)
  const [tempoEmpresaColumn, setTempoEmpresaColumn] = useState<string>('tempo_empresa')

  // Estados para sidebar
  const [sidebar, setSidebar] = useState<SidebarState>({
    isOpen: true
  })

  // Funções para sidebar
  const toggleSidebar = () => {
    setSidebar(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }

  const openSidebar = () => {
    setSidebar(prev => ({ ...prev, isOpen: true }))
  }

  const closeSidebar = () => {
    setSidebar(prev => ({ ...prev, isOpen: false }))
  }

  // Carregar opções de filtro
  const loadFilterOptions = async () => {
    try {
      console.log('🔄 Carregando opções de filtro...')
      
      if (!supabase) {
        console.error('❌ Supabase não inicializado')
        return
      }

      // Buscar empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from('COPSQ_respostas')
        .select('empresa_id')
        .not('empresa_id', 'is', null)

      if (empresasError) {
        console.error('❌ Erro ao buscar empresas:', empresasError)
        return
      }

      const empresasUnicas = [...new Set(empresasData.map(item => item.empresa_id))].filter(Boolean)
      setEmpresas(empresasUnicas)
      console.log('🏢 Empresas encontradas:', empresasUnicas)

      // Buscar setores
      const { data: setoresData, error: setoresError } = await supabase
        .from('COPSQ_respostas')
        .select('area_setor')
        .not('area_setor', 'is', null)

      if (setoresError) {
        console.error('❌ Erro ao buscar setores:', setoresError)
        return
      }

      const setoresUnicos = [...new Set(setoresData.map(item => item.area_setor))].filter(Boolean)
      setSetores(setoresUnicos)
      setSetoresFiltrados(setoresUnicos)
      console.log('🏬 Setores encontrados:', setoresUnicos)

      // Detectar dinamicamente a coluna de tempo de empresa (tempo_empresa vs tempo_organizacao)
      let detectedTempoColumn = 'tempo_empresa'
      try {
        const { data: sampleData } = await supabase
          .from('COPSQ_respostas')
          .select('*')
          .limit(1)
        const sample: any = sampleData && sampleData.length > 0 ? sampleData[0] : {}
        if (!("tempo_empresa" in sample) && ("tempo_organizacao" in sample)) {
          detectedTempoColumn = 'tempo_organizacao'
        }
      } catch (e) {
        // mantém padrão
      }
      setTempoEmpresaColumn(detectedTempoColumn)

      // Buscar opções de tempo de empresa
      try {
        const { data: temposData, error: temposError }: any = await supabase
          .from('COPSQ_respostas')
          .select(detectedTempoColumn)
          .not(detectedTempoColumn, 'is', null)
        if (temposError) {
          console.error('❌ Erro ao buscar tempos de empresa:', temposError)
        } else {
          const valores = [...new Set(((temposData || []) as any[]).map((item: any) => String(item[detectedTempoColumn] ?? '')).filter(Boolean))]
          setTemposEmpresa(valores as string[])
          console.log('⏳ Tempos de empresa encontrados:', valores)
        }
      } catch (e) {
        console.error('❌ Erro inesperado ao carregar tempos de empresa:', e)
      }

      // Buscar opções de faixa etária
      try {
        const { data: faixasData, error: faixasError }: any = await supabase
          .from('COPSQ_respostas')
          .select('faixa_etaria')
          .not('faixa_etaria', 'is', null)
        if (faixasError) {
          console.error('❌ Erro ao buscar faixas etárias:', faixasError)
        } else {
          const valores = [...new Set(((faixasData || []) as any[]).map((item: any) => String(item.faixa_etaria ?? '')).filter(Boolean))]
          setFaixasEtarias(valores as string[])
          console.log('👤 Faixas etárias encontradas:', valores)
        }
      } catch (e) {
        console.error('❌ Erro inesperado ao carregar faixas etárias:', e)
      }

      // Carregar dados iniciais (sem filtros)
      console.log('📊 Carregando dados iniciais...')
      const { data: initialData, error: initialError } = await supabase
        .from('COPSQ_respostas')
        .select('*')
        .limit(100) // Limitar para não sobrecarregar

      if (initialError) {
        console.error('❌ Erro ao carregar dados iniciais:', initialError)
        return
      }

      console.log('✅ Dados iniciais carregados:', initialData?.length || 0, 'registros')
      setFilteredData(initialData || [])
      
    } catch (error) {
      console.error('❌ Erro ao carregar opções de filtro:', error)
    }
  }

  // Aplicar filtros
  const applyFilters = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 Aplicando filtros:', filters)
      
      if (!supabase) {
        console.log('❌ Supabase não inicializado')
        setFilteredData([])
        return
      }

      let query = supabase.from('COPSQ_respostas').select('*')

      // Aplicar filtros
      if (filters.empresa) {
        console.log('🏢 Filtrando por empresa:', filters.empresa)
        query = query.eq('empresa_id', filters.empresa)
      }
      if (filters.setor) {
        console.log('🏬 Filtrando por setor:', filters.setor)
        query = query.eq('area_setor', filters.setor)
      }
      if (filters.tempoEmpresa) {
        const pattern = `%${(filters.tempoEmpresa || '').trim()}%`
        console.log('⏳ Filtrando por tempo de empresa (ILIKE):', pattern, `(${tempoEmpresaColumn})`)
        query = (query as any).ilike(tempoEmpresaColumn, pattern)
      }
      if (filters.faixaEtaria) {
        const pattern = `%${(filters.faixaEtaria || '').trim()}%`
        console.log('👤 Filtrando por faixa etária (ILIKE):', pattern)
        query = (query as any).ilike('faixa_etaria', pattern)
      }
      if (filters.dataInicio) {
        console.log('📅 Filtrando por data início:', filters.dataInicio)
        query = query.gte('created_at', filters.dataInicio)
      }
      if (filters.dataFim) {
        console.log('📅 Filtrando por data fim:', filters.dataFim)
        query = query.lte('created_at', filters.dataFim)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro na consulta:', error)
        throw error
      }
      
      console.log('✅ Dados filtrados encontrados:', data?.length || 0, 'registros')
      if (data && data.length > 0) {
        console.log('📊 Primeiro registro:', data[0])
      }
      
      setFilteredData(data || [])
    } catch (error) {
      console.error('❌ Erro ao aplicar filtros:', error)
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  // Carregar opções de filtro na inicialização
  useEffect(() => {
    loadFilterOptions()
  }, [])

  // Filtrar setores baseado na empresa selecionada
  useEffect(() => {
    if (filters.empresa) {
      // Buscar setores específicos da empresa selecionada
      const fetchSetoresDaEmpresa = async () => {
        try {
          if (!supabase) return

          const { data, error } = await supabase
            .from('COPSQ_respostas')
            .select('area_setor')
            .eq('empresa_id', filters.empresa)
            .not('area_setor', 'is', null)

          if (error) throw error

          const setoresUnicos = [...new Set(data.map(item => item.area_setor))].filter(Boolean)
          setSetoresFiltrados(setoresUnicos)
          
          // Limpar setor selecionado se não estiver disponível na nova empresa
          if (filters.setor && !setoresUnicos.includes(filters.setor)) {
            setFilters(prev => ({ ...prev, setor: '' }))
          }
        } catch (error) {
          console.error('Erro ao buscar setores da empresa:', error)
          setSetoresFiltrados([])
          // Limpar setor se houver erro
          setFilters(prev => ({ ...prev, setor: '' }))
        }
      }

      fetchSetoresDaEmpresa()
    } else {
      setSetoresFiltrados(setores)
      // Limpar setor se nenhuma empresa estiver selecionada
      if (filters.setor) {
        setFilters(prev => ({ ...prev, setor: '' }))
      }
    }
  }, [filters.empresa, setores])

  // Aplicar filtros quando mudarem
  useEffect(() => {
    console.log('🔄 Filtros mudaram, aplicando...', filters)
    applyFilters()
  }, [filters])

  const value: FilterContextType = {
    // Filtros
    filters,
    setFilters,
    empresas,
    setores,
    setoresFiltrados,
    temposEmpresa,
    faixasEtarias,
    filteredData,
    loading,
    applyFilters,
    
    // Sidebar
    sidebar,
    toggleSidebar,
    openSidebar,
    closeSidebar
  }

  return React.createElement(FilterContext.Provider, { value }, children)
} 