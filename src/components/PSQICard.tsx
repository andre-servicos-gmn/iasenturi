import {
  Box, Card, CardBody, VStack, HStack, Text, useColorModeValue,
  Badge, Circle
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiMoon, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import GaugeChart from 'react-gauge-chart'
import FiltrosEPSPSQI from './FiltrosEPSPSQI'

const MotionBox = motion(Box)
const MotionCard = motion(Card)
const MotionText = motion(Text)
const MotionBadge = motion(Badge)
const MotionCircle = motion(Circle)

// Variantes para alinhar o visual com o card de EPS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

const meterVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }
  }
}

const PSQICard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')

  const [psqiScore, setPsqiScore] = useState(0)
  const [totalColaboradores, setTotalColaboradores] = useState(0)
  const [loading, setLoading] = useState(true)
  const [meterProgress, setMeterProgress] = useState(0)
  
  // Filtros do componente de filtros
  const [filtros, setFiltros] = useState({ empresa: '', setor: '', setorColumn: 'Área/Setor' })

  // Callback que recebe os filtros, incluindo o nome da coluna do setor
  const handleFiltrosChange = useCallback((novosFiltros: { empresa: string; setor: string; setorColumn: string }) => {
    console.log('🔄 Filtros PSQI recebidos:', novosFiltros)
    setFiltros(novosFiltros)
  }, [])

  // Carregar dados com filtros
  useEffect(() => {
    const loadPsqi = async () => {
      try {
        setLoading(true)
        if (!supabase) {
          setTotalColaboradores(0)
          setPsqiScore(0)
          return
        }
        
        let query = supabase.from('PSQI_respostas').select('*')
        
        console.log(`🔍 Aplicando filtros PSQI:`, filtros)
        
        // Aplicar filtros
        if (filtros.empresa) {
          query = query.eq('empresa_id', filtros.empresa)
          console.log(`🏢 Filtro empresa aplicado: ${filtros.empresa}`)
        }
        if (filtros.setor && filtros.setorColumn) {
          // Usa o nome da coluna de setor dinamicamente descoberto pelo componente de filtro
          query = query.eq(filtros.setorColumn, filtros.setor)
          console.log(`🏬 Filtro setor aplicado: [${filtros.setorColumn}] = "${filtros.setor}"`)
        }
        
        console.log(`🔍 Query PSQI final:`, query)
        const { data, error } = await query
        if (error) {
          console.error('❌ Erro na query PSQI:', error)
          throw error
        }
        
        const rows = Array.isArray(data) ? data : []
        console.log(`📊 Dados PSQI encontrados: ${rows.length} registros`)
        
        if (rows.length > 0) {
          console.log(`📊 Primeiro registro PSQI:`, rows[0])
          console.log(`📊 Campos disponíveis:`, Object.keys(rows[0]))
          
          // Verificar se os filtros estão sendo aplicados corretamente
          if (filtros.empresa) {
            const empresasEncontradas = [...new Set(rows.map(r => r.empresa_id))]
            console.log(`🏢 Empresas encontradas nos dados:`, empresasEncontradas)
            if (!empresasEncontradas.includes(filtros.empresa)) {
              console.warn(`⚠️ Empresa "${filtros.empresa}" não encontrada nos dados!`)
            }
          }
          
          if (filtros.setor) {
            const setoresEncontrados = [...new Set(rows.map(r => r['Área/Setor'] || r.area_setor || r.Area_Setor || r.setor || r.Setor || r.area || r.Area))]
            console.log(`🏬 Setores encontrados nos dados:`, setoresEncontrados)
            if (!setoresEncontrados.includes(filtros.setor)) {
              console.warn(`⚠️ Setor "${filtros.setor}" não encontrado nos dados!`)
            }
          }
        }
        
        setTotalColaboradores(rows.length)
        
        const valores = rows
          .map((r: any) => {
            const v = r.psqi_total
            const num = typeof v === 'number' ? v : v ? parseFloat(v) : NaN
            return isNaN(num) ? null : num
          })
          .filter((n): n is number => n !== null)
        
        console.log(`📊 Valores PSQI válidos: ${valores.length} de ${rows.length}`)
        console.log(`📊 Valores PSQI:`, valores)
        
        const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
        setPsqiScore(media)
        
        console.log(`✅ PSQI carregado: ${rows.length} colaboradores, score médio: ${media.toFixed(2)}`)
        console.log(`✅ Filtros aplicados - Empresa: ${filtros.empresa || 'Todas'}, Setor: ${filtros.setor || 'Todos'}`)
      } catch (error) {
        console.error('❌ Erro ao carregar dados PSQI:', error)
        setTotalColaboradores(0)
        setPsqiScore(0)
      } finally {
        setLoading(false)
      }
    }
    
    loadPsqi()
  }, [filtros])

  // Animar o medidor após o carregamento
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setMeterProgress(psqiScore)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, psqiScore])

  // Classificação da qualidade do sono (mantida)
  const getSleepQuality = (score: number) => {
    if (score <= 5) {
      return {
        status: 'Favorável',
        color: 'green',
        icon: <FiCheckCircle />,
        description: 'Baixo risco - Qualidade do sono satisfatória',
        bgColor: 'green.50',
        borderColor: 'green.200',
        iconBg: 'green.100',
        iconColor: 'green.600',
        badgeColor: 'green'
      }
    } else if (score <= 10) {
      return {
        status: 'Atenção',
        color: 'orange',
        icon: <FiAlertTriangle />,
        description: 'Atenção - Qualidade do sono pode ser melhorada',
        bgColor: 'orange.50',
        borderColor: 'orange.200',
        iconBg: 'orange.100',
        iconColor: 'orange.600',
        badgeColor: 'orange'
      }
    } else {
      return {
        status: 'Crítico',
        color: 'red',
        icon: <FiAlertTriangle />,
        description: 'Alto risco - Qualidade do sono comprometida',
        bgColor: 'red.50',
        borderColor: 'red.200',
        iconBg: 'red.100',
        iconColor: 'red.600',
        badgeColor: 'red'
      }
    }
  }

  const sleepQuality = getSleepQuality(psqiScore)

  // Velocímetro (0-21 mapeado para 0-1)
  const gaugePercent = Math.min(Math.max(meterProgress / 21, 0), 1)
  const arcsLength = [5 / 21, 5 / 21, 11 / 21]
  const arcsColors = ['#22c55e', '#f59e0b', '#ef4444']

  if (loading) {
    return (
      <MotionCard
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
        minH="360px"
      >
        <CardBody p={5}>
          <VStack spacing={4}>
            <MotionText
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              Carregando PSQI...
            </MotionText>
          </VStack>
        </CardBody>
      </MotionCard>
    )
  }

  return (
    <MotionBox initial="hidden" animate="visible" variants={containerVariants}>
      <MotionCard
        variants={itemVariants}
        whileHover={{ 
          scale: 1.008,
          boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.08)',
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
        overflow="hidden"
        h="100%"
      >
        <CardBody p={5} h="100%">
          <VStack spacing={4} align="stretch">
            {/* Cabeçalho */}
            <MotionBox variants={itemVariants}>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <MotionBox
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 5,
                      transition: { duration: 0.2 }
                    }}
                    p={2}
                    bg={sleepQuality.iconBg}
                    borderRadius="lg"
                    color={sleepQuality.iconColor}
                  >
                    <FiMoon size={20} />
                  </MotionBox>
                  <VStack align="start" spacing={1}>
                    <MotionText
                      variants={itemVariants}
                      fontSize="lg" 
                      fontWeight="bold" 
                      color={textColor}
                    >
                      PSQI – Qualidade do Sono
                    </MotionText>
                    <MotionText
                      variants={itemVariants}
                      fontSize="sm" 
                      color="gray.500"
                    >
                      Índice de Qualidade do Sono (PSQI). Indicador Satélite.
                    </MotionText>
                  </VStack>
                </HStack>

                {/* Score principal */}
                <VStack 
                  align="center" 
                  spacing={1}
                >
                  <MotionCircle
                    size="60px"
                    bg={`${sleepQuality.color}.50`}
                    border="3px solid"
                    borderColor={`${sleepQuality.color}.200`}
                    whileHover={{ 
                      boxShadow: `0 0 20px ${sleepQuality.color}.200`,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <MotionText
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      fontSize="xl"
                      fontWeight="black"
                      color={`${sleepQuality.color}.600`}
                    >
                      {psqiScore.toFixed(1)}
                    </MotionText>
                  </MotionCircle>
                  <MotionBadge
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    colorScheme={sleepQuality.badgeColor}
                    variant="subtle"
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    {sleepQuality.status.toUpperCase()}
                  </MotionBadge>
                </VStack>
              </HStack>
            </MotionBox>

            {/* Filtros EPS/PSQI */}
            <FiltrosEPSPSQI 
              tipo="PSQI" 
              onFiltrosChange={handleFiltrosChange} 
            />

            {/* Velocímetro central */}
            <MotionBox variants={meterVariants}>
              <HStack align="center" justify="center" spacing={8} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                <Box w={{ base: '220px', md: '260px' }} flexShrink={0} mx="auto">
                  <GaugeChart
                    id="psqi-gauge"
                    nrOfLevels={3}
                    arcsLength={arcsLength}
                    colors={arcsColors}
                    percent={gaugePercent}
                    arcPadding={0.02}
                    cornerRadius={2}
                    arcWidth={0.18}
                    needleColor="#4B5563"
                    needleBaseColor="#9CA3AF"
                    textColor="#374151"
                    style={{ width: '100%' }}
                    formatTextValue={() => psqiScore.toFixed(1)}
                  />
                </Box>
                <VStack align="start" spacing={2} minW="220px">
                  <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                    Classificação por Níveis:
                  </Text>
                  <VStack align="start" spacing={2}>
                    {[
                      { color: 'green.500', text: 'Favorável: 0–5' },
                      { color: 'orange.500', text: 'Atenção: 6–10' },
                      { color: 'red.500', text: 'Crítico: 11–21' }
                    ].map((item, index) => (
                      <HStack key={index} spacing={2}>
                        <Circle size="3" bg={item.color} />
                        <Text fontSize="xs" color="gray.600">{item.text}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </HStack>
            </MotionBox>

            {/* Total de colaboradores */}
            <MotionText
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.8 }}
              fontSize="xs" 
              color="gray.400" 
              textAlign="center"
            >
              {totalColaboradores} colaboradores avaliados
            </MotionText>
          </VStack>
        </CardBody>
      </MotionCard>
    </MotionBox>
  )
}

export default PSQICard
