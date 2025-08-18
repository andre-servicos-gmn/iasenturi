import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

// Tipos para filtros
interface FilterState {
  empresa: string
  setor: string
  dataInicio: string
  dataFim: string
  dominio?: string // novo filtro por domínio avaliado
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
    dominio: ''
  })
  const [empresas, setEmpresas] = useState<string[]>([])
  const [setores, setSetores] = useState<string[]>([])
  const [setoresFiltrados, setSetoresFiltrados] = useState<string[]>([])
  const [filteredData, setFilteredData] = useState<FilteredData[]>([])
  const [loading, setLoading] = useState(true)

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
      // Filtragem por domínio (mapeia para colunas COPSOQ)
      if (filters.dominio) {
        const map: Record<string, string> = {
          'Demandas Psicológicas': 'demandas_psicologicas',
          'Demandas Físicas': 'demandas_fisicas',
          'Demandas de Trabalho': 'demandas_trabalho',
          'Suporte Social e Liderança': 'suporte_social_lideranca',
          'Suporte Social': 'suporte_social',
          'Esforço e Recompensa': 'esforco_recompensa',
          'Saúde Emocional': 'saude_emocional',
          'Interface Trabalho-Vida': 'interface_trabalho_vida'
        }
        const col = map[filters.dominio]
        if (col) {
          console.log('🎯 Filtrando por domínio (pontuação > 0):', filters.dominio, '->', col)
          // Mantém somente respostas com valor do domínio presente
          query = query.gt(col, 0)
        }
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