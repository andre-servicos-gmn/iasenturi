import {
  Box, Card, CardBody, VStack, HStack, Text, useColorModeValue,
  Badge, Circle
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import GaugeChart from 'react-gauge-chart'
import FiltrosEPSPSQI from './FiltrosEPSPSQI'

const MotionBox = motion(Box)
const MotionCard = motion(Card)
const MotionText = motion(Text)
const MotionBadge = motion(Badge)
const MotionCircle = motion(Circle)

// Variantes de animação elegantes
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] // Curva elegante
    }
  }
}

const meterVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.6
    }
  }
}

const sectorVariants = {
  hidden: { 
    opacity: 0, 
    x: 30,
    scale: 0.95
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.8 + (i * 0.1)
    }
  }),
  hover: {
    scale: 1.02,
    x: -5,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

const EPS10Card = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  
  // Estado para dados do EPS-10
  const [eps10Score, setEps10Score] = useState(0)
  const [totalColaboradores, setTotalColaboradores] = useState(0)
  const [setoresData, setSetoresData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [meterProgress, setMeterProgress] = useState(0)
  
  // Filtros do componente de filtros
  const [filtros, setFiltros] = useState({ empresa: '', setor: '', setorColumn: 'Área/Setor' })
  
  // Callback que recebe os filtros, incluindo o nome da coluna do setor
  const handleFiltrosChange = useCallback((novosFiltros: { empresa: string; setor: string; setorColumn: string }) => {
    console.log('🔄 Filtros EPS recebidos:', novosFiltros)
    setFiltros(novosFiltros)
  }, [])
  
  // Carregar dados do EPS com filtros
  useEffect(() => {
    const loadEps = async () => {
      try {
        setLoading(true)
        if (!supabase) {
          setTotalColaboradores(0)
          setEps10Score(0)
          setSetoresData([])
          return
        }
        
        let query = supabase.from('EPS_respostas').select('*')
        
        console.log(`🔍 Aplicando filtros EPS:`, filtros)
        
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
        
        console.log(`🔍 Query EPS final:`, query)
        const { data, error } = await query
        if (error) {
          console.error('❌ Erro na query EPS:', error)
          throw error
        }
        
        const rows = Array.isArray(data) ? data : []
        console.log(`📊 Dados EPS encontrados: ${rows.length} registros`)
        
        if (rows.length > 0) {
          console.log(`📊 Primeiro registro EPS:`, rows[0])
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
            const v = r.eps_total
            const num = typeof v === 'number' ? v : v ? parseFloat(v) : NaN
            return isNaN(num) ? null : num
          })
          .filter((n): n is number => n !== null)
        
        console.log(`📊 Valores EPS válidos: ${valores.length} de ${rows.length}`)
        console.log(`📊 Valores EPS:`, valores)
        
        const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
        setEps10Score(media)
        setSetoresData([])
        
        console.log(`✅ EPS-10 carregado: ${rows.length} colaboradores, score médio: ${media.toFixed(2)}`)
        console.log(`✅ Filtros aplicados - Empresa: ${filtros.empresa || 'Todas'}, Setor: ${filtros.setor || 'Todos'}`)
      } catch (error) {
        console.error('❌ Erro ao carregar dados EPS-10:', error)
        setTotalColaboradores(0)
        setEps10Score(0)
        setSetoresData([])
      } finally {
        setLoading(false)
      }
    }
    
    loadEps()
  }, [filtros])

  // Animar o medidor após o componente carregar
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setMeterProgress(eps10Score)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, eps10Score])
  
  // Função para classificar o stress baseado no EPS-10
  const getStressLevel = (score: number) => {
    if (score >= 34) {
      return {
        status: 'Muito Alto',
        color: 'red',
        icon: <FiAlertTriangle />,
        description: 'Stress muito elevado - Intervenção urgente necessária',
        bgColor: 'red.50',
        borderColor: 'red.200',
        iconBg: 'red.100',
        iconColor: 'red.600',
        badgeColor: 'red'
      }
    } else if (score >= 27) {
      return {
        status: 'Alto',
        color: 'orange',
        icon: <FiAlertTriangle />,
        description: 'Stress alto - Atenção e ações preventivas necessárias',
        bgColor: 'orange.50',
        borderColor: 'orange.200',
        iconBg: 'orange.100',
        iconColor: 'orange.600',
        badgeColor: 'orange'
      }
    } else if (score >= 20) {
      return {
        status: 'Moderado',
        color: 'yellow',
        icon: <FiClock />,
        description: 'Stress moderado - Monitoramento e ações preventivas',
        bgColor: 'yellow.50',
        borderColor: 'yellow.200',
        iconBg: 'yellow.100',
        iconColor: 'yellow.600',
        badgeColor: 'yellow'
      }
    } else {
      return {
        status: 'Baixo',
        color: 'green',
        icon: <FiCheckCircle />,
        description: 'Stress baixo - Situação favorável',
        bgColor: 'green.50',
        borderColor: 'green.200',
        iconBg: 'green.100',
        iconColor: 'green.600',
        badgeColor: 'green'
      }
    }
  }

  const stressLevel = getStressLevel(eps10Score)
  
  // Velocímetro (0-40 mapeado para 0-1)
  const gaugePercent = Math.min(Math.max(meterProgress / 40, 0), 1)
  const arcsLength = [0.5, 0.175, 0.175, 0.15] // 0-19, 20-26, 27-33, 34-40
  const arcsColors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444']

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
              Carregando EPS-10...
            </MotionText>
          </VStack>
        </CardBody>
      </MotionCard>
    )
  }

  return (
    <MotionBox 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
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
                    bg={stressLevel.iconBg}
                    borderRadius="lg"
                    color={stressLevel.iconColor}
                  >
                    <FiActivity size={20} />
                  </MotionBox>
                  <VStack align="start" spacing={1}>
                    <MotionText
                      variants={itemVariants}
                      fontSize="lg" 
                      fontWeight="bold" 
                      color={textColor}
                    >
                      EPS-10 – Estresse Percebido
                    </MotionText>
                    <MotionText
                      variants={itemVariants}
                      fontSize="sm" 
                      color="gray.500"
                    >
                      Escala de Estresse Percebido (EPS-10). Indicador Satélite.
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
                    bg={`${stressLevel.color}.50`}
                    border="3px solid"
                    borderColor={`${stressLevel.color}.200`}
                    whileHover={{ 
                      boxShadow: `0 0 20px ${stressLevel.color}.200`,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <MotionText
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      fontSize="xl"
                      fontWeight="black"
                      color={`${stressLevel.color}.600`}
                    >
                      {eps10Score.toFixed(1)}
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
                    colorScheme={stressLevel.badgeColor}
                    variant="subtle"
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    {stressLevel.status.toUpperCase()}
                  </MotionBadge>
                </VStack>
              </HStack>
            </MotionBox>

            {/* Filtros EPS/PSQI */}
            <FiltrosEPSPSQI 
              tipo="EPS" 
              onFiltrosChange={handleFiltrosChange} 
            />

            {/* Velocímetro central */}
            <MotionBox variants={meterVariants}>
              <HStack align="center" justify="center" spacing={8} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                <Box w={{ base: '220px', md: '260px' }} flexShrink={0} mx="auto">
                  <GaugeChart
                    id="eps10-gauge"
                    nrOfLevels={4}
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
                    formatTextValue={() => eps10Score.toFixed(1)}
                />
              </Box>
                <VStack align="start" spacing={2} minW="220px">
                  <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  Classificação por Níveis:
                  </Text>
                  <VStack align="start" spacing={2}>
                                     {[
                     { color: 'red.500', text: 'Muito Alto: 34+' },
                      { color: 'orange.500', text: 'Alto: 27–33' },
                      { color: 'yellow.500', text: 'Moderado: 20–26' },
                      { color: 'green.500', text: 'Baixo: 10–19' }
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

            {/* Removido bloco duplicado de classificação por níveis para manter legenda apenas ao lado do velocímetro */}

            {/* Dados por setor (exibir apenas quando houver dados) */}
            {setoresData.length > 0 && (
              <MotionBox variants={itemVariants}>
                <VStack spacing={3} align="stretch">
                  <MotionText
                    variants={itemVariants}
                    fontSize="sm" 
                    fontWeight="semibold" 
                    color={textColor}
                  >
                    Análise por Itens Respondidos:
                  </MotionText>
                  <AnimatePresence>
                    {setoresData.map((setor, index) => (
                      <MotionBox
                        key={index}
                        custom={index}
                        variants={sectorVariants}
                        whileHover="hover"
                        p={3} 
                        bg="gray.50" 
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{
                          bg: "gray.100",
                          transform: "translateX(-2px)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                        }}
                      >
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              {setor.setor}
                            </Text>
                            
                          </VStack>
                          <HStack spacing={2} align="center">
                            <MotionText
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 2.0 + (index * 0.1), duration: 0.4 }}
                              fontSize="lg" 
                              fontWeight="bold" 
                              color={getStressLevel(setor.score).iconColor}
                            >
                              {setor.score}
                            </MotionText>
                            <MotionBadge
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 2.1 + (index * 0.1), duration: 0.4 }}
                              whileHover={{ scale: 1.05 }}
                              colorScheme={getStressLevel(setor.score).badgeColor}
                              variant="subtle"
                              fontSize="xs"
                            >
                              {getStressLevel(setor.score).status}
                            </MotionBadge>
                          </HStack>
                        </HStack>
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                </VStack>
              </MotionBox>
            )}

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

export default EPS10Card
