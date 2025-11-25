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


const EPS10Card = () => {
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
  const [averageEPS, setAverageEPS] = useState(0)
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

        // Buscar empresas da tabela EPS_respostas
        const { data: empresasData, error: empresasError } = await supabase
          .from('EPS_respostas')
          .select('empresa_id')
          .not('empresa_id', 'is', null)

        if (empresasError) {
          console.error('EPS - Erro ao buscar empresas:', empresasError.message)
          setEmpresas([])
        } else if (empresasData && empresasData.length > 0) {
          const empresasUnicas = [...new Set(empresasData.map(item => item.empresa_id))].filter(Boolean)
          console.log('EPS - Empresas encontradas:', empresasUnicas.length, 'empresas:', empresasUnicas)
          setEmpresas(empresasUnicas)
        } else {
          console.log('EPS - Nenhuma empresa encontrada')
          setEmpresas([])
        }

        // Buscar setores da tabela EPS_respostas
        const { data: setoresData, error: setoresError } = await supabase
          .from('EPS_respostas')
          .select('area_setor')
          .not('area_setor', 'is', null)

        if (setoresError) {
          console.error('EPS - Erro ao buscar setores:', setoresError.message)
          setSetores([])
          setSetoresFiltrados([])
        } else if (setoresData && setoresData.length > 0) {
          const setoresUnicos = [...new Set(setoresData.map(item => item.area_setor))].filter(Boolean)
          console.log('EPS - Setores encontrados:', setoresUnicos.length, 'setores:', setoresUnicos)
          setSetores(setoresUnicos)
          setSetoresFiltrados(setoresUnicos)
        } else {
          console.log('EPS - Nenhum setor encontrado')
          setSetores([])
          setSetoresFiltrados([])
        }
      } catch (error) {
        console.error('EPS - Erro ao carregar opções de filtro:', error)
        setEmpresas([])
        setSetores([])
        setSetoresFiltrados([])
      }
    }

    loadFilterOptions()
  }, [])

  // Filtrar setores baseado na empresa selecionada
  useEffect(() => {
    console.log('EPS - useEffect setores triggered. Empresa:', filters.empresa, 'Setores gerais:', setores.length)

    if (filters.empresa) {
      const fetchSetoresDaEmpresa = async () => {
        try {
          if (!supabase) {
            console.error('EPS - Supabase client not initialized')
            return
          }

          console.log('EPS - Buscando setores para empresa:', filters.empresa)
          const { data, error } = await supabase
            .from('EPS_respostas')
            .select('area_setor')
            .eq('empresa_id', filters.empresa)
            .not('area_setor', 'is', null)

          if (error) {
            console.error('EPS - Erro ao buscar setores da empresa:', error.message)
            setSetoresFiltrados([])
            setFilters(prev => ({ ...prev, setor: '' }))
          } else if (data && data.length > 0) {
            const setoresUnicos = [...new Set(data.map(item => item.area_setor))].filter(Boolean)
            console.log('EPS - Setores da empresa encontrados:', setoresUnicos.length, 'setores:', setoresUnicos)
            setSetoresFiltrados(setoresUnicos)

            // Limpar setor selecionado se não estiver disponível na nova empresa
            if (filters.setor && !setoresUnicos.includes(filters.setor)) {
              console.log('EPS - Limpando setor selecionado pois não está disponível na nova empresa')
              setFilters(prev => ({ ...prev, setor: '' }))
            }
          } else {
            console.log('EPS - Nenhum setor encontrado para esta empresa')
            setSetoresFiltrados([])
            setFilters(prev => ({ ...prev, setor: '' }))
          }
        } catch (error) {
          console.error('EPS - Erro ao buscar setores da empresa:', error)
          setSetoresFiltrados([])
          setFilters(prev => ({ ...prev, setor: '' }))
        }
      }

      fetchSetoresDaEmpresa()
    } else {
      console.log('EPS - Nenhuma empresa selecionada, mostrando todos os setores')
      setSetoresFiltrados(setores)
      if (filters.setor) {
        setFilters(prev => ({ ...prev, setor: '' }))
      }
    }
  }, [filters.empresa, setores, supabase])

  // Carregar dados EPS
  const loadEPSData = async () => {
    try {
      setLoading(true)

      if (!supabase) {
        console.error('Supabase client not initialized')
        return
      }

      let query = supabase.from('EPS_respostas').select('*')

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

      const epsData = data || []

      // Calcular média
      if (epsData && epsData.length > 0) {
        const validScores = epsData
          .map(item => item.eps_total)
          .filter(score => score !== null && score !== undefined && !isNaN(score))

        if (validScores.length > 0) {
          const avg = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
          setAverageEPS(Math.round(avg * 10) / 10) // Uma casa decimal
        } else {
          setAverageEPS(0)
        }

        setTotalResponses(epsData.length)
      } else {
        setAverageEPS(0)
        setTotalResponses(0)
      }
    } catch (error) {
      console.error('Erro ao carregar dados EPS:', error)
      setAverageEPS(0)
      setTotalResponses(0)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando filtros mudarem
  useEffect(() => {
    loadEPSData()
  }, [filters])

  // Função para determinar cor baseada no score EPS
  const getEPSColor = (score: number) => {
    if (score <= 10) return 'green'
    if (score <= 26) return 'yellow'
    if (score <= 33) return 'orange'
    return 'red'
  }

  // Função para determinar risco baseado no score EPS
  const getEPSRisk = (score: number) => {
    if (score <= 10) return 'Baixo'
    if (score <= 26) return 'Moderado'
    if (score <= 33) return 'Alto'
    return 'Muito Alto'
  }

  // Converter score para percentual do gauge (0-100)
  const scoreToPercent = (score: number) => {
    // EPS vai de 0 a 40, mas normalmente ate 40
    // Vamos mapear para 0-100% onde 0 = 0%, 40 = 100%
    return Math.min(score / 40, 1)
  }

  const [gaugePercent, setGaugePercent] = useState(0)

  useEffect(() => {
    const target = totalResponses > 0 ? scoreToPercent(averageEPS) : 0
    const timeout = window.setTimeout(() => setGaugePercent(target), 120)
    return () => window.clearTimeout(timeout)
  }, [averageEPS, totalResponses])

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
                  Estresse Percebido (EPS-10)
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Perceived Stress Scale
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Badge
                variant="premium"
                bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
                color="white"
              >
                EPS-10
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
                  id="eps-gauge"
                  nrOfLevels={4}
                  colors={['#38A169', '#D69E2E', '#DD6B20', '#E53E3E']}
                  percent={gaugePercent}
                  arcWidth={0.2}
                  needleColor="#1A202C"
                  needleBaseColor="#1A202C"
                  textColor={textColor}
                  formatTextValue={() => `${averageEPS}`}
                  style={{ width: '240px', maxWidth: '100%' }}
                />
              </Box>
              <VStack spacing={1} align="center">
                <Text fontSize="sm" color="gray.500">
                  Média EPS
                </Text>
                <Badge
                  colorScheme={getEPSColor(averageEPS)}
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {getEPSRisk(averageEPS)}
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
                  <Text fontSize="2xl" fontWeight="bold" color={`${getEPSColor(averageEPS)}.600`}>
                    {averageEPS}
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
                    <Text fontSize="sm" color="gray.600">0-10: Baixo</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="yellow.500" borderRadius="full" />
                    <Text fontSize="sm" color="gray.600">11-26: Moderado</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="orange.500" borderRadius="full" />
                    <Text fontSize="sm" color="gray.600">27-33: Alto</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="red.500" borderRadius="full" />
                    <Text fontSize="sm" color="gray.600">34+: Muito Alto</Text>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </HStack>

          {loading && (
            <Box textAlign="center" py={4}>
              <Text color="gray.500">Carregando dados EPS...</Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </MotionCard>
  )
}

export default EPS10Card
