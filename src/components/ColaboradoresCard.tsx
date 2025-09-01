import {
  Box, Card, CardBody, VStack, HStack, Text, Badge, useColorModeValue, Button, Avatar,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiUsers, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi'
import { fetchCOPSQData } from '@/lib/supabase'
import { useState, useEffect } from 'react'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

interface Colaborador {
  id: string
  nome: string
  setor: string
  dominioCritico: string
  isesoGeral: number
  status: 'critico' | 'atencao' | 'adequado'
}

const ColaboradoresCard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  const alternateBg = useColorModeValue('gray.50', 'gray.700')

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadColaboradores = async () => {
      try {
        setLoading(true)
        const data = await fetchCOPSQData()
        
        if (data.length > 0) {
          // Processar dados dos colaboradores
          const colaboradoresProcessados: Colaborador[] = data.map((item, index) => {
            // Calcular ISESO geral
            const dominios = [
              'demandas_psicologicas',
              'demandas_fisicas',
              'demandas_trabalho',
              'suporte_social_lideranca',
              'esforco_recompensa',
              'interface_trabalho_vida',
              'saude_emocional'
            ]
            
            let total = 0
            let count = 0
            let dominioCritico = ''
            let valorCritico = 0
            
            dominios.forEach(dominio => {
              const valor = parseFloat(item[dominio] || '0')
              if (valor > 0) {
                total += valor
                count++
                if (valor > valorCritico) {
                  valorCritico = valor
                  dominioCritico = dominio.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              }
            })
            
            const isesoGeral = count > 0 ? Math.round(total / count) : 0
            const status = isesoGeral > 70 ? 'critico' : isesoGeral > 50 ? 'atencao' : 'adequado'
            
            return {
              id: item.id || `colaborador-${index}`,
              nome: `Colaborador ${index + 1}`,
              setor: item.area_setor || 'Não informado',
              dominioCritico,
              isesoGeral,
              status
            }
          })

          setColaboradores(colaboradoresProcessados)
        }
      } catch (error) {
        console.error('Erro ao carregar colaboradores:', error)
      } finally {
        setLoading(false)
      }
    }

    loadColaboradores()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critico': return 'red'
      case 'atencao': return 'orange'
      case 'adequado': return 'green'
      default: return 'gray'
    }
  }

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'critico': return 'linear(to-r, #FEE2E2, #FECACA)'
      case 'atencao': return 'linear(to-r, #FEF3C7, #FDE68A)'
      case 'adequado': return 'linear(to-r, #D1FAE5, #A7F3D0)'
      default: return 'linear(to-r, #F3F4F6, #E5E7EB)'
    }
  }

  const totalPages = Math.ceil(colaboradores.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentColaboradores = colaboradores.slice(startIndex, endIndex)

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
                  <FiUsers size={20} />
                </Box>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Colaboradores
                </Text>
              </HStack>
              <Badge 
                variant="premium"
                bgGradient="linear(135deg, #0D249B 0%, #1A45FC 100%)"
                color="white"
              >
                {colaboradores.length}
              </Badge>
            </HStack>

            {currentColaboradores.length > 0 ? (
              <VStack spacing={3} align="stretch">
                {currentColaboradores.map((colaborador, index) => (
                  <MotionCard
                    key={colaborador.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    bg={index % 2 === 0 ? cardBg : alternateBg}
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
                      bg: `${getStatusColor(colaborador.status)}.500`,
                      borderRadius: '0 2px 2px 0'
                    }}
                  >
                    <CardBody p={5}>
                      <HStack justify="space-between" align="center" spacing={4}>
                        <VStack align="start" spacing={3} flex={1}>
                          <HStack spacing={3} align="center">
                            <Avatar 
                              size="md" 
                              name={colaborador.nome}
                              bg={`${getStatusColor(colaborador.status)}.100`}
                              color={`${getStatusColor(colaborador.status)}.700`}
                            />
                            <VStack align="start" spacing={1}>
                              <Text fontSize="md" fontWeight="bold" color={textColor}>
                                {colaborador.nome}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                ID: {colaborador.id}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <HStack spacing={4} fontSize="sm" color="gray.500">
                            <HStack spacing={2}>
                              <FiTrendingUp size={16} />
                              <Text fontWeight="medium">{colaborador.setor}</Text>
                            </HStack>
                            {colaborador.dominioCritico && (
                              <HStack spacing={2}>
                                <FiAlertTriangle size={16} />
                                <Text fontWeight="medium">{colaborador.dominioCritico}</Text>
                              </HStack>
                            )}
                          </HStack>
                        </VStack>
                        
                        <VStack align="end" spacing={2}>
                          <Badge
                            size="sm"
                            bgGradient={getStatusGradient(colaborador.status)}
                            color={`${getStatusColor(colaborador.status)}.800`}
                            fontWeight="semibold"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            {colaborador.status.toUpperCase()}
                          </Badge>
                          
                          <VStack align="end" spacing={1}>
                            <Text 
                              fontSize="3xl" 
                              fontWeight="black" 
                              color={`${getStatusColor(colaborador.status)}.600`}
                              lineHeight="1"
                            >
                              {colaborador.isesoGeral}
                            </Text>
                            <Text 
                              fontSize="xs" 
                              color={`${getStatusColor(colaborador.status)}.500`}
                              fontWeight="medium"
                              textTransform="uppercase"
                            >
                              ISESO
                            </Text>
                          </VStack>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </MotionCard>
                ))}
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">Nenhum colaborador encontrado</Text>
              </Box>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <HStack justify="center" spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Text fontSize="sm" color={textColor}>
                  Página {currentPage} de {totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </HStack>
            )}
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}

export default ColaboradoresCard 