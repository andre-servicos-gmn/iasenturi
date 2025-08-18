import {
  Box, Card, CardBody, VStack, HStack, Text, Badge, useColorModeValue, Button,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiUsers, FiAlertTriangle, FiCalendar, FiEye, FiBarChart } from 'react-icons/fi'
import { fetchCOPSQData } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { classificarISESOCompleto, getChakraColorFromISESO } from '@/lib/utils'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

const ISESOCard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  const [isesoGeral, setIsesoGeral] = useState(0)
  const [totalColaboradores, setTotalColaboradores] = useState(0)
  const [setoresCriticos, setSetoresCriticos] = useState(0)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadISESOData = async () => {
      try {
        setLoading(true)
        const data = await fetchCOPSQData()
        
        if (data.length > 0) {
          // Calcular ISESO geral
          let totalISESO = 0
          let count = 0
          
          data.forEach(item => {
            const dominios = [
              'demandas_psicologicas',
              'demandas_fisicas',
              'demandas_trabalho',
              'suporte_social_lideranca',
              'suporte_social',
              'esforco_recompensa',
              'saude_emocional',
              'interface_trabalho_vida'
            ]
            
            let itemTotal = 0
            let itemCount = 0
            
            dominios.forEach(dominio => {
              const valor = parseFloat(item[dominio] || '0')
              if (valor > 0) {
                itemTotal += valor
                itemCount++
              }
            })
            
            if (itemCount > 0) {
              totalISESO += Math.round(itemTotal / itemCount)
              count++
            }
          })
          
          const mediaISESO = count > 0 ? Math.round(totalISESO / count) : 0
          setIsesoGeral(mediaISESO)
          setTotalColaboradores(data.length)
          
          // Calcular setores críticos (ISESO > 70)
          const setoresCriticosCount = data.filter(item => {
            const dominios = [
              'demandas_psicologicas',
              'demandas_fisicas',
              'demandas_trabalho',
              'suporte_social_lideranca',
              'suporte_social',
              'esforco_recompensa',
              'saude_emocional',
              'interface_trabalho_vida'
            ]
            
            let itemTotal = 0
            let itemCount = 0
            
            dominios.forEach(dominio => {
              const valor = parseFloat(item[dominio] || '0')
              if (valor > 0) {
                itemTotal += valor
                itemCount++
              }
            })
            
            const itemISESO = itemCount > 0 ? Math.round(itemTotal / itemCount) : 0
            return itemISESO > 70
          }).length
          
          setSetoresCriticos(setoresCriticosCount)
          
          // Última atualização
          const ultimaData = data.reduce((latest, item) => {
            const itemDate = new Date(item.created_at || '')
            return itemDate > latest ? itemDate : latest
          }, new Date(0))
          
          setUltimaAtualizacao(ultimaData.toLocaleDateString('pt-BR'))
        }
      } catch (error) {
        console.error('Erro ao carregar dados ISESO:', error)
      } finally {
        setLoading(false)
      }
    }

    loadISESOData()
  }, [])

  const getISESOColor = (valor: number) => getChakraColorFromISESO(valor)

  if (loading) {
    return (
      <Card variant="premium">
        <CardBody>
          <VStack spacing={4}>
            <Text>Carregando...</Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <MotionBox 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <Card 
        variant="premium"
        boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        border="1px solid"
        borderColor={borderColor}
      >
        <CardBody p={6}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg="#0D249B"
                  borderRadius="lg"
                  color="white"
                >
                  <FiBarChart size={20} />
                </Box>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Estatísticas Rápidas
                </Text>
              </HStack>
              <Badge 
                variant="premium"
                bgGradient="linear(135deg, #0D249B 0%, #1A45FC 100%)"
                color="white"
              >
                Métrica
              </Badge>
            </HStack>

            <VStack spacing={5} align="stretch">
              {/* ISESO Geral */}
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                bg={cardBg}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  bg: `${getISESOColor(isesoGeral)}.500`,
                  borderRadius: '0 2px 2px 0'
                }}
              >
                <CardBody p={5}>
                  <HStack justify="space-between" align="center" spacing={4}>
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack spacing={3}>
                        <Box
                          p={2}
                          bg={`${getISESOColor(isesoGeral)}.100`}
                          borderRadius="lg"
                          color={`${getISESOColor(isesoGeral)}.600`}
                        >
                          <FiTrendingUp size={20} />
                        </Box>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            ISESO Geral
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Índice Senturi Saúde Emocional e Organizacional
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                    
                    <VStack align="end" spacing={1}>
                      <Text 
                        fontSize="5xl" 
                        fontWeight="black" 
                        color={`${getISESOColor(isesoGeral)}.600`}
                        lineHeight="1"
                      >
                        {isesoGeral}
                      </Text>
                      <Text 
                        fontSize="xs" 
                        color={`${getISESOColor(isesoGeral)}.500`}
                        fontWeight="medium"
                        textTransform="uppercase"
                      >
                        {classificarISESOCompleto(isesoGeral).icone} {classificarISESOCompleto(isesoGeral).nome}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </MotionCard>

              {/* Estatísticas */}
              <HStack spacing={4}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  flex={1}
                  bg="blue.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="blue.200"
                  boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                  position="relative"
                  overflow="hidden"
                >
                  <CardBody p={4}>
                    <VStack spacing={3} align="center">
                      <Box
                        p={2}
                        bg="blue.100"
                        borderRadius="lg"
                        color="blue.600"
                      >
                        <FiUsers size={20} />
                      </Box>
                      <VStack spacing={1} align="center">
                        <Text fontSize="2xl" fontWeight="black" color="blue.700">
                          {totalColaboradores}
                        </Text>
                        <Text fontSize="sm" fontWeight="medium" color="blue.600">
                          Colaboradores
                        </Text>
                      </VStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="blue.600"
                        rightIcon={<FiEye size={12} />}
                        _hover={{ bg: 'blue.100' }}
                      >
                        Ver Detalhes
                      </Button>
                    </VStack>
                  </CardBody>
                </MotionCard>

                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  flex={1}
                  bg="red.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="red.200"
                  boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                  position="relative"
                  overflow="hidden"
                >
                  <CardBody p={4}>
                    <VStack spacing={3} align="center">
                      <Box
                        p={2}
                        bg="red.100"
                        borderRadius="lg"
                        color="red.600"
                      >
                        <FiAlertTriangle size={20} />
                      </Box>
                      <VStack spacing={1} align="center">
                        <Text fontSize="2xl" fontWeight="black" color="red.700">
                          {setoresCriticos}
                        </Text>
                        <Text fontSize="sm" fontWeight="medium" color="red.600">
                          Críticos
                        </Text>
                      </VStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="red.600"
                        rightIcon={<FiEye size={12} />}
                        _hover={{ bg: 'red.100' }}
                      >
                        Ver Detalhes
                      </Button>
                    </VStack>
                  </CardBody>
                </MotionCard>

                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  flex={1}
                  bg="green.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="green.200"
                  boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                  position="relative"
                  overflow="hidden"
                >
                  <CardBody p={4}>
                    <VStack spacing={3} align="center">
                      <Box
                        p={2}
                        bg="green.100"
                        borderRadius="lg"
                        color="green.600"
                      >
                        <FiCalendar size={20} />
                      </Box>
                      <VStack spacing={1} align="center">
                        <Text fontSize="lg" fontWeight="black" color="green.700">
                          {ultimaAtualizacao}
                        </Text>
                        <Text fontSize="sm" fontWeight="medium" color="green.600">
                          Última Atualização
                        </Text>
                      </VStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="green.600"
                        rightIcon={<FiEye size={12} />}
                        _hover={{ bg: 'green.100' }}
                      >
                        Ver Detalhes
                      </Button>
                    </VStack>
                  </CardBody>
                </MotionCard>
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}

export default ISESOCard 