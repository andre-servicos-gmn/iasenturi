import {
  Box, Card, CardBody, VStack, HStack, Text, Badge, useColorModeValue, Avatar,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiUsers, FiActivity } from 'react-icons/fi'
import { fetchCOPSQData } from '@/lib/supabase'
import { classificarISESOCompleto } from '@/lib/utils'
import { useState, useEffect } from 'react'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

interface TopRisco {
  dominio: string
  setor: string
  valor: number
  colaboradores: number
  nivel: 'alto' | 'medio' | 'baixo'
}

const TopRiscosCard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  const [topRiscos, setTopRiscos] = useState<TopRisco[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTopRiscos = async () => {
      try {
        setLoading(true)
        const data = await fetchCOPSQData()
        
        if (data.length > 0) {
          // Agrupar dados por setor
          const riscosPorSetor: { [key: string]: any } = {}
          
          data.forEach(item => {
            if (item.area_setor) {
              if (!riscosPorSetor[item.area_setor]) {
                riscosPorSetor[item.area_setor] = {
                  setor: item.area_setor,
                  isesoValues: [],
                  colaboradores: 0
                }
              }
              
              // Calcular ISESO para este item
              const isesoValue = calculateISESO(item)
              riscosPorSetor[item.area_setor].isesoValues.push(isesoValue)
              riscosPorSetor[item.area_setor].colaboradores++
            }
          })

          // Converter para array e calcular médias
          const riscosArray = Object.values(riscosPorSetor).map((setorData: any) => {
            const mediaISESO = Math.round(setorData.isesoValues.reduce((a: number, b: number) => a + b, 0) / setorData.isesoValues.length)
            
            return {
              dominio: `ISESO - ${setorData.setor}`,
              setor: setorData.setor,
              valor: mediaISESO,
              colaboradores: setorData.colaboradores
            }
          })

          // Ordenar por valor e pegar top 3
          const top3 = riscosArray
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 3)
            .map(risco => ({
              ...risco,
              nivel: risco.valor > 70 ? 'alto' as const : risco.valor > 50 ? 'medio' as const : 'baixo' as const
            }))

          setTopRiscos(top3)
        }
      } catch (error) {
        console.error('Erro ao carregar top riscos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTopRiscos()
  }, [])

  const calculateISESO = (item: any) => {
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
    
    let total = 0
    let count = 0
    
    dominios.forEach(dominio => {
      const valor = parseFloat(item[dominio] || '0')
      if (valor > 0) {
        total += valor
        count++
      }
    })
    
    return count > 0 ? Math.round(total / count) : 0
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'alto': return 'red'
      case 'medio': return 'orange'
      case 'baixo': return 'green'
      default: return 'gray'
    }
  }

  const getNivelGradient = (nivel: string) => {
    switch (nivel) {
      case 'alto': return 'linear(to-r, #FEE2E2, #FECACA)'
      case 'medio': return 'linear(to-r, #FEF3C7, #FDE68A)'
      case 'baixo': return 'linear(to-r, #D1FAE5, #A7F3D0)'
      default: return 'linear(to-r, #F3F4F6, #E5E7EB)'
    }
  }

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
                  <FiTrendingUp size={20} />
                </Box>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Top 3 Riscos Críticos
                </Text>
              </HStack>
              <Badge 
                variant="premium"
                bgGradient="linear(135deg, #0D249B 0%, #1A45FC 100%)"
                color="white"
              >
                ISESO
              </Badge>
            </HStack>

            {topRiscos.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {topRiscos.map((risco, index) => (
                  <MotionCard
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    bg={cardBg}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                    overflow="hidden"
                    position="relative"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      bg: `${getNivelColor(risco.nivel)}.500`,
                      borderRadius: '0 2px 2px 0'
                    }}
                  >
                    <CardBody p={5}>
                      <HStack justify="space-between" align="center" spacing={4}>
                        <VStack align="start" spacing={3} flex={1}>
                          <HStack spacing={3} align="center">
                            <Avatar 
                              size="sm" 
                              name={risco.setor}
                              bg={`${getNivelColor(risco.nivel)}.100`}
                              color={`${getNivelColor(risco.nivel)}.700`}
                            />
                            <VStack align="start" spacing={1}>
                              <Text fontSize="md" fontWeight="bold" color={textColor}>
                                {risco.setor}
                              </Text>
                              <Badge
                                size="sm"
                                bgGradient={getNivelGradient(risco.nivel)}
                                color={`${getNivelColor(risco.nivel)}.800`}
                                fontWeight="semibold"
                                px={3}
                                py={1}
                                borderRadius="full"
                              >
                                {risco.nivel.toUpperCase()}
                              </Badge>
                            </VStack>
                          </HStack>
                          
                          <HStack spacing={4} fontSize="sm" color="gray.500">
                            <HStack spacing={2}>
                              <FiUsers size={16} />
                              <Text fontWeight="medium">{risco.colaboradores} colaboradores</Text>
                            </HStack>
                            <HStack spacing={2}>
                              <FiActivity size={16} />
                              <Text fontWeight="medium">ISESO: {risco.valor} — {classificarISESOCompleto(risco.valor).nome}</Text>
                            </HStack>
                          </HStack>
                        </VStack>
                        
                        <VStack align="end" spacing={1}>
                          <Text 
                            fontSize="4xl" 
                            fontWeight="black" 
                            color={`${getNivelColor(risco.nivel)}.600`}
                            lineHeight="1"
                          >
                            {risco.valor}
                          </Text>
                          <Text 
                            fontSize="xs" 
                            color={`${getNivelColor(risco.nivel)}.500`}
                            fontWeight="medium"
                            textTransform="uppercase"
                          >
                            Score
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </MotionCard>
                ))}
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">Nenhum risco encontrado</Text>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}

export default TopRiscosCard 