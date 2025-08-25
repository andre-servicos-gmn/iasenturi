import {
  Box, Card, CardBody, VStack, HStack, Text, useColorModeValue,
  Badge, Circle, Select
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiMoon, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import GaugeChart from 'react-gauge-chart'

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
  // Filtros locais
  const [empresaId, setEmpresaId] = useState<string>('')
  const [setor, setSetor] = useState<string>('')
  const [empresaOptions, setEmpresaOptions] = useState<string[]>([])
  const [setorOptions, setSetorOptions] = useState<string[]>([])

  // Carregar opções de filtros
  useEffect(() => {
    const loadOptions = async () => {
      try {
        if (!supabase) {
          setEmpresaOptions([])
          setSetorOptions([])
          return
        }
        const client = supabase!
        const { data, error } = await client
          .from('PSQI_respostas')
          .select('empresa_id, area_setor')
        if (error) throw error
        const rows = Array.isArray(data) ? data : []
        const empresas = Array.from(new Set(rows.map((r: any) => r.empresa_id).filter((v: any) => v != null))).map(String).sort()
        const setores = Array.from(new Set(rows.map((r: any) => r.area_setor).filter((v: any) => v != null))).map(String).sort()
        setEmpresaOptions(empresas)
        setSetorOptions(setores)
      } catch {
        setEmpresaOptions([])
        setSetorOptions([])
      }
    }
    loadOptions()
  }, [])

  // Atualizar opções de setor quando empresa muda (opcional)
  useEffect(() => {
    const loadSetores = async () => {
      try {
        if (!supabase) {
          setSetorOptions([])
          return
        }
        const client = supabase!
        let query = client.from('PSQI_respostas').select('area_setor')
        if (empresaId) query = query.eq('empresa_id', empresaId)
        const { data, error } = await query
        if (error) throw error
        const rows = Array.isArray(data) ? data : []
        const setores = Array.from(new Set(rows.map((r: any) => r.area_setor).filter((v: any) => v != null))).map(String).sort()
        setSetorOptions(setores)
      } catch {
        setSetorOptions([])
      }
    }
    loadSetores()
  }, [empresaId])

  // Carregar dados com filtros locais
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
        if (empresaId) query = query.eq('empresa_id', empresaId)
        if (setor) query = query.eq('area_setor', setor)
        const { data, error } = await query
        if (error) throw error
        const rows = Array.isArray(data) ? data : []
        setTotalColaboradores(rows.length)
        const valores = rows
          .map((r: any) => {
            const v = r.psqi_total
            const num = typeof v === 'number' ? v : v ? parseFloat(v) : NaN
            return isNaN(num) ? null : num
          })
          .filter((n): n is number => n !== null)
        const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
        setPsqiScore(media)
      } catch {
        setTotalColaboradores(0)
        setPsqiScore(0)
      } finally {
        setLoading(false)
      }
    }
    loadPsqi()
  }, [empresaId, setor])

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

            {/* Filtros locais */}
            <HStack spacing={3} flexWrap="wrap">
              <Select size="sm" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} w={{ base: '100%', md: 'auto' }}>
                <option value="">Todas as empresas</option>
                {empresaOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
              <Select size="sm" value={setor} onChange={(e) => setSetor(e.target.value)} w={{ base: '100%', md: 'auto' }}>
                <option value="">Todos os setores</option>
                {setorOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            </HStack>

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
