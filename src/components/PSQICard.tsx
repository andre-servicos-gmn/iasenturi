import {
  Box, Card, CardBody, VStack, HStack, Text, useColorModeValue
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiMoon, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from '@/contexts/store'
import GaugeChart from 'react-gauge-chart'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

const PSQICard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  
  // Estado temporário para demonstração - será substituído por dados reais do Supabase
  const [psqiScore, setPsqiScore] = useState(0)
  const [totalColaboradores, setTotalColaboradores] = useState(0)
  const { filters } = useFilters()
  
  // Carregar dados reais do PSQI a partir do Supabase usando filtros globais
  useEffect(() => {
    const loadPsqi = async () => {
      try {
        if (!supabase) {
          setTotalColaboradores(0)
          setPsqiScore(0)
          return
        }
        let query = supabase.from('PSQI_respostas').select('*')
        if (filters.empresa) query = query.eq('empresa_id', filters.empresa)
        if (filters.dataInicio) query = query.gte('created_at', filters.dataInicio)
        if (filters.dataFim) query = query.lte('created_at', filters.dataFim)
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
      }
    }
    loadPsqi()
  }, [filters])
  
  // Função para classificar a qualidade do sono baseada no PSQI
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
  
  // Calcular a porcentagem para o gauge (0-21 = 0-100%)
  const percentage = (psqiScore / 21) * 100
  
  // Configuração das cores do gauge com gradiente
  const gaugeColors = ['#22C55E', '#F59E0B', '#EF4444'] // Verde → Amarelo → Vermelho
  const gaugePercent = percentage / 100

  return (
    <MotionBox 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        whileHover={{ 
          scale: 1.005,
          boxShadow: '0 4px 14px -5px rgba(0, 0, 0, 0.08), 0 2px 6px -5px rgba(0, 0, 0, 0.03)'
        }}
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
      >
        <CardBody p={5}>
          <HStack justify="space-between" align="center" spacing={4}>
            <VStack align="start" spacing={2} flex={1}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg={sleepQuality.iconBg}
                  borderRadius="lg"
                  color={sleepQuality.iconColor}
                >
                  <FiMoon size={20} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>
                    PSQI - Qualidade do Sono
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Pittsburgh Sleep Quality Index
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {sleepQuality.description}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            
            {/* Gauge Chart Moderno */}
            <VStack align="center" spacing={2} position="relative">
              <Box position="relative" width="80px" height="80px">
                <GaugeChart
                  id="psqi-gauge"
                  nrOfLevels={3}
                  colors={gaugeColors}
                  percent={gaugePercent}
                  arcWidth={0.3}
                  textColor={textColor}
                  hideText={true}
                  needleColor={sleepQuality.iconColor}
                  needleBaseColor={sleepQuality.iconColor}
                  formatTextValue={() => ''}
                  style={{ width: '100%', height: '100%' }}
                />
                
                {/* Número central grande */}
                <Text
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  fontSize="2xl"
                  fontWeight="black"
                  color={`${sleepQuality.color}.600`}
                  textAlign="center"
                  lineHeight="1"
                  zIndex={10}
                >
                  {psqiScore.toFixed(1)}
                </Text>
              </Box>
              
              {/* Status da qualidade do sono */}
              <VStack align="center" spacing={1}>
                <HStack spacing={1}>
                  {sleepQuality.icon}
                  <Text 
                    fontSize="xs" 
                    color={`${sleepQuality.color}.600`} 
                    fontWeight="medium" 
                    textTransform="uppercase"
                  >
                    {sleepQuality.status}
                  </Text>
                </HStack>
                
                {/* Escala 0-21 */}
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  0-21 pontos
                </Text>
                
                {/* Total de colaboradores avaliados */}
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  {totalColaboradores} colaboradores
                </Text>
              </VStack>
            </VStack>
          </HStack>
        </CardBody>
      </MotionCard>
    </MotionBox>
  )
}

export default PSQICard
