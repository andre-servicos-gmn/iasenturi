import {
  Box, VStack, HStack, Text, useColorModeValue, Card, CardBody,
  Badge, Button, Divider, Collapse
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import GaugeChart from 'react-gauge-chart'
import {
  FiBarChart2, FiChevronDown, FiChevronUp
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import FiltrosEPSPSQI from './FiltrosEPSPSQI'
import { supabase } from '@/lib/supabase'

const MotionCard = motion(Card)


const PSQICard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')

  // Estados para filtros independentes
  const [filters, setFilters] = useState({
    empresa: '',
    setor: '',
    dataInicio: '',
    dataFim: ''
  })

  // Estados para dados
  const [loading, setLoading] = useState(true)
  const [averagePSQI, setAveragePSQI] = useState(0)
  const [totalResponses, setTotalResponses] = useState(0)
  const [expanded, setExpanded] = useState(false)

  // Opções de filtros
  const [empresas, setEmpresas] = useState<string[]>([])
  const [setores, setSetores] = useState<string[]>([])
  const [setoresFiltrados, setSetoresFiltrados] = useState<string[]>([])

  // Carregar opções de filtro
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        if (!supabase) {
          console.error('Supabase client not initialized')
          return
        }

        // Buscar empresas da tabela PSQI_respostas
        const { data: empresasData, error: empresasError } = await supabase
          .from('PSQI_respostas')
          .select('empresa_id')
          .not('empresa_id', 'is', null)

        if (!empresasError && empresasData) {
          const empresasUnicas = [...new Set(empresasData.map(item => item.empresa_id))].filter(Boolean)
          console.log('PSQI - Empresas encontradas:', empresasUnicas)
          setEmpresas(empresasUnicas)
        } else {
          console.error('PSQI - Erro ao buscar empresas:', empresasError)
        }

        // Buscar setores da tabela PSQI_respostas
        const { data: setoresData, error: setoresError } = await supabase
          .from('PSQI_respostas')
          .select('area_setor')
          .not('area_setor', 'is', null)

        if (!setoresError && setoresData) {
          const setoresUnicos = [...new Set(setoresData.map(item => item.area_setor))].filter(Boolean)
          console.log('PSQI - Setores encontrados:', setoresUnicos)
          setSetores(setoresUnicos)
          setSetoresFiltrados(setoresUnicos)
        } else {
          console.error('PSQI - Erro ao buscar setores:', setoresError)
        }
      } catch (error) {
        console.error('PSQI - Erro ao carregar opções de filtro:', error)
      }
    }

    loadFilterOptions()
  }, [])

  // Filtrar setores baseado na empresa selecionada
  useEffect(() => {
    console.log('PSQI - useEffect setores triggered. Empresa:', filters.empresa, 'Setores gerais:', setores.length)

    if (filters.empresa) {
      const fetchSetoresDaEmpresa = async () => {
        try {
          if (!supabase) {
            console.error('PSQI - Supabase client not initialized')
            return
          }

          console.log('PSQI - Buscando setores para empresa:', filters.empresa)
          const { data, error } = await supabase
            .from('PSQI_respostas')
            .select('area_setor')
            .eq('empresa_id', filters.empresa)
            .not('area_setor', 'is', null)

          if (error) {
            console.error('PSQI - Erro ao buscar setores da empresa:', error.message)
            setSetoresFiltrados([])
            setFilters(prev => ({ ...prev, setor: '' }))
          } else if (data && data.length > 0) {
            const setoresUnicos = [...new Set(data.map(item => item.area_setor))].filter(Boolean)
            console.log('PSQI - Setores da empresa encontrados:', setoresUnicos.length, 'setores:', setoresUnicos)
            setSetoresFiltrados(setoresUnicos)

            // Limpar setor selecionado se não estiver disponível na nova empresa
            if (filters.setor && !setoresUnicos.includes(filters.setor)) {
              console.log('PSQI - Limpando setor selecionado pois não está disponível na nova empresa')
              setFilters(prev => ({ ...prev, setor: '' }))
            }
          } else {
            console.log('PSQI - Nenhum setor encontrado para esta empresa')
            setSetoresFiltrados([])
            setFilters(prev => ({ ...prev, setor: '' }))
          }
        } catch (error) {
          console.error('PSQI - Erro ao buscar setores da empresa:', error)
          setSetoresFiltrados([])
          setFilters(prev => ({ ...prev, setor: '' }))
        }
      }

      fetchSetoresDaEmpresa()
    } else {
      console.log('PSQI - Nenhuma empresa selecionada, mostrando todos os setores')
      setSetoresFiltrados(setores)
      if (filters.setor) {
        setFilters(prev => ({ ...prev, setor: '' }))
      }
    }
  }, [filters.empresa, setores, supabase])

  // Carregar dados PSQI
  const loadPSQIData = async () => {
    try {
      setLoading(true)

      if (!supabase) {
        console.error('Supabase client not initialized')
        return
      }

      let query = supabase.from('PSQI_respostas').select('*')

      // Aplicar filtros
      if (filters.empresa) {
        query = query.eq('empresa_id', filters.empresa)
      }
      if (filters.setor) {
        query = query.eq('area_setor', filters.setor)
      }
      if (filters.dataInicio) {
        query = query.gte('created_at', filters.dataInicio)
      }
      if (filters.dataFim) {
        query = query.lte('created_at', filters.dataFim)
      }

      const { data, error } = await query

      if (error) throw error

      const psqiData = data || []

      // Calcular média
      if (psqiData && psqiData.length > 0) {
        const validScores = psqiData
          .map(item => item.psqi_total)
          .filter(score => score !== null && score !== undefined && !isNaN(score))

        if (validScores.length > 0) {
          const avg = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
          setAveragePSQI(Math.round(avg * 10) / 10) // Uma casa decimal
        } else {
          setAveragePSQI(0)
        }

        setTotalResponses(psqiData.length)
      } else {
        setAveragePSQI(0)
        setTotalResponses(0)
      }
    } catch (error) {
      console.error('Erro ao carregar dados PSQI:', error)
      setAveragePSQI(0)
      setTotalResponses(0)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando filtros mudarem
  useEffect(() => {
    loadPSQIData()
  }, [filters])

  // Função para determinar cor baseada no score PSQI
  const getPSQIColor = (score: number) => {
    if (score <= 5) return 'green'
    if (score <= 10) return 'yellow'
    return 'red'
  }

  // Função para determinar risco baseado no score PSQI
  const getPSQIRisk = (score: number) => {
    if (score <= 5) return 'Baixo risco'
    if (score <= 10) return 'Atenção'
    return 'Alto risco'
  }

  // Converter score para percentual do gauge (0-100)
  const scoreToPercent = (score: number) => {
    // PSQI vai de 0 a 21
    // Vamos mapear para 0-100% onde 0 = 0%, 21 = 100%
    return Math.min(score / 21, 1)
  }

  const [gaugePercent, setGaugePercent] = useState(0)

  useEffect(() => {
    const target = totalResponses > 0 ? scoreToPercent(averagePSQI) : 0
    const timeout = window.setTimeout(() => setGaugePercent(target), 120)
    return () => window.clearTimeout(timeout)
  }, [averagePSQI, totalResponses])

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
    >
      <CardBody p={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Box
                p={2}
                bg="senturi.azulProfundo"
                borderRadius="lg"
                color="white"
              >
                <FiBarChart2 size={20} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Qualidade do Sono (PSQI)
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Pittsburgh Sleep Quality Index
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Badge
                variant="premium"
                bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
                color="white"
              >
                PSQI
              </Badge>
              <Button
                leftIcon={expanded ? <FiChevronUp /> : <FiChevronDown />}
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                color="gray.600"
                _hover={{ bg: 'gray.100', color: 'gray.800' }}
              >
                {expanded ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </HStack>
          </HStack>

          {/* Filtros */}
          <Collapse in={expanded} animateOpacity>
            <FiltrosEPSPSQI
              filters={filters}
              onFiltersChange={setFilters}
              empresas={empresas}
              setoresFiltrados={setoresFiltrados}
            />
          </Collapse>

          {/* Gauge Chart */}
          <HStack justify="center" spacing={8}>
            <VStack spacing={4} align="center">
              <Box position="relative">
                <GaugeChart
                  id="psqi-gauge"
                  nrOfLevels={3}
                  colors={['#38A169', '#D69E2E', '#E53E3E']}
                  percent={gaugePercent}
                  arcWidth={0.2}
                  animate
                  needleTransition="easeQuadInOut"
                  needleTransitionDuration={1500}
                  needleColor="#1A202C"
                  needleBaseColor="#1A202C"
                  textColor={textColor}
                  formatTextValue={() => `${averagePSQI}`}
                  style={{ width: '240px', maxWidth: '100%' }}
                />
              </Box>
              <VStack spacing={1} align="center">
                <Text fontSize="sm" color="gray.500">
                  Média PSQI
                </Text>
                <Badge
                  colorScheme={getPSQIColor(averagePSQI)}
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {getPSQIRisk(averagePSQI)}
                </Badge>
              </VStack>
            </VStack>

            <VStack spacing={4} align="start" flex={1}>
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Total de Respostas</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {totalResponses}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Média Geral</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={`${getPSQIColor(averagePSQI)}.600`}>
                    {averagePSQI}
                  </Text>
                </Box>
              </HStack>

              <Divider />

              <VStack spacing={2} align="start">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Classificação:
                </Text>
                <VStack spacing={1} align="start">
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="green.500" borderRadius="full" />
                    <Text fontSize="sm" color="gray.600">0-5: Sono adequado (Baixo risco)</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="yellow.500" borderRadius="full" />
                    <Text fontSize="sm" color="gray.600">6-10: Sono intermediário (Atenção)</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="red.500" borderRadius="full" />
                    <Text fontSize="sm" color="gray.600">11+: Alto risco má qualidade do sono</Text>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </HStack>

          {loading && (
            <Box textAlign="center" py={4}>
              <Text color="gray.500">Carregando dados PSQI...</Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </MotionCard>
  )
}

export default PSQICard
