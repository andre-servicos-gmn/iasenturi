import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Grid,
  Card,
  CardBody,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiAlertTriangle, FiTrendingUp, FiCheckCircle, FiClock, FiTarget } from 'react-icons/fi'
import { calculateDomainAverages, calculateDomainAveragesBySectorAverages, fetchAllSectorsForCompany } from '@/lib/supabase'
import { useFilters } from '@/contexts/store'
import acoesRecomendadas from '@/data/acoes_recomendadas.json'

const MotionBox = motion(Box)

type Domain = {
  nome: string
  valor: number
  classificacao?: 'critico' | 'vulneravel' | 'moderado'
}

const gradientByValue = (value: number) => {
  if (value < 40) return 'linear-gradient(135deg, #e53935, #b31224)'
  if (value < 55) return 'linear-gradient(135deg, #f08c2e, #c54b1f)'
  return 'linear-gradient(135deg, #eccc5c, #d8a722)'
}

const overlayByValue = (value: number) => {
  if (value < 40) return '#9c1328'
  if (value < 55) return '#b64b24'
  return '#b88f18'
}

const classificationLabel = (c: Domain['classificacao']) => {
  if (c === 'critico') return 'Ação imediata obrigatória'
  if (c === 'vulneravel') return 'Prevenção urgente'
  return 'Manter atenção'
}

const classificationBadge = (c: Domain['classificacao']) => {
  if (c === 'critico') return 'Ação Imediata'
  if (c === 'vulneravel') return 'Prevenção Urgente'
  return 'Manter Atenção'
}

const colorSchemeByValue = (value: number) => {
  if (value < 40) return 'red'
  if (value < 55) return 'orange'
  return 'yellow'
}

const domainMapping: Record<string, string> = {
  'Saúde Emocional': 'Saúde Emocional (Senturi)',
  'Demandas Psicológicas': 'Demandas Psicológicas',
  'Demandas Físicas': 'Demandas Físicas',
  'Demandas de Trabalho': 'Demandas de Trabalho',
  'Suporte Social e Liderança': 'Suporte Social e Liderança',
  'Esforço e Recompensa': 'Esforço e Recompensa',
  'Interface Trabalho-Vida': 'Interface Trabalho-Vida'
}

const AcoesRecomendadasPage: React.FC = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { filteredData, loading: filtersLoading, filters } = useFilters()
  const [domainAverages, setDomainAverages] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true)
        const validData = filteredData.filter(item => item.empresa_id !== null && item.empresa_id !== undefined)

        let radarData: any[] = []
        if (filters.setor) {
          radarData = validData.filter(item => item.area_setor === filters.setor)
        } else if (filters.empresa) {
          radarData = await fetchAllSectorsForCompany(filters.empresa) as any[]
        } else {
          radarData = validData
        }

        if (radarData.length > 0) {
          const averages = (filters.empresa && !filters.setor)
            ? calculateDomainAveragesBySectorAverages(radarData as any[])
            : calculateDomainAverages(radarData as any[])

          const critical = (averages as any[])
            .filter(domain => domain.valor < 70)
            .map(domain => ({
              ...domain,
              classificacao:
                domain.valor < 40 ? 'critico' :
                domain.valor < 55 ? 'vulneravel' : 'moderado'
            }))

          setDomainAverages(critical)
        } else {
          setDomainAverages([])
        }
      } catch (error) {
        console.error('Erro ao processar dados dos domínios críticos:', error)
      } finally {
        setLoading(false)
      }
    }

    processData()
  }, [filteredData, filters.setor, filters.empresa])

  const handleDomainClick = (domain: Domain) => {
    setSelectedDomain(domain)
    onOpen()
  }

  if (loading || filtersLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Text>Carregando domínios críticos...</Text>
      </VStack>
    )
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      w="full"
      minH="100vh"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
      p={6}
    >
      <VStack spacing={6} align="stretch" w="full" h="full" minH="100vh">
        {/* Header */}
        <Box w="full">
          <HStack spacing={3} mb={2}>
            <FiAlertTriangle size={24} color="#e53935" />
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Ações Recomendadas
            </Text>
          </HStack>
          <Text color="gray.500" fontSize="lg">
            Domínios com índice ISESO abaixo de 70 que necessitam de atenção
          </Text>
        </Box>

        {/* Lista de Domínios Críticos */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4} w="full">
          {domainAverages.length > 0 ? (
            domainAverages.map((domain, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card
                  variant="premium"
                  cursor="pointer"
                  onClick={() => handleDomainClick(domain)}
                  bgGradient={gradientByValue(domain.valor)}
                  color="white"
                  border="1px solid"
                  borderColor="transparent"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'xl',
                    filter: 'brightness(1.05)'
                  }}
                  transition="all 0.3s"
                >
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <Box
                          w={4}
                          h={4}
                          borderRadius="full"
                          bg={overlayByValue(domain.valor)}
                          boxShadow="0 0 0 3px rgba(255,255,255,0.2)"
                        />
                        <Text fontSize="sm" color="whiteAlpha.900">
                          ISESO: {domain.valor}%
                        </Text>
                      </HStack>

                      <Text fontSize="lg" fontWeight="bold" color="white">
                        {domain.nome}
                      </Text>

                      <Text fontSize="sm" color="whiteAlpha.900" noOfLines={2}>
                        {classificationLabel(domain.classificacao)}
                      </Text>

                      <Button
                        size="sm"
                        bg={overlayByValue(domain.valor)}
                        color="white"
                        _hover={{ bg: overlayByValue(domain.valor), filter: 'brightness(1.1)' }}
                        w="full"
                      >
                        Ver Ações Recomendadas
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            ))
          ) : (
            <Box textAlign="center" py={12} gridColumn="1 / -1">
              <FiTrendingUp size={48} color="#0D249B" />
              <Text fontSize="lg" color="gray.500" mt={4}>
                Nenhum domínio crítico encontrado
              </Text>
              <Text fontSize="sm" color="gray.400">
                Todos os domínios estão com índice ISESO ≥ 70
              </Text>
            </Box>
          )}
        </Grid>
      </VStack>

      {/* Modal de Ações Recomendadas */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <MotionBox
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HStack spacing={3}>
                <Box
                  w={5}
                  h={5}
                  borderRadius="full"
                  bgGradient={selectedDomain ? gradientByValue(selectedDomain.valor) : undefined}
                  boxShadow="md"
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold">{selectedDomain?.nome}</Text>
                  <HStack spacing={2}>
                    <Badge
                      colorScheme={selectedDomain ? colorSchemeByValue(selectedDomain.valor) : 'gray'}
                      variant="subtle"
                      fontSize="xs"
                    >
                      ISESO: {selectedDomain?.valor}%
                    </Badge>
                    <Badge variant="outline" fontSize="xs">
                      {selectedDomain ? classificationBadge(selectedDomain.classificacao) : ''}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
            </MotionBox>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <VStack spacing={6} align="stretch">
                {/* Informações do Domínio */}
                <Box p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    <strong>Descrição:</strong> {selectedDomain?.classificacao === 'critico'
                      ? 'Alto risco psicossocial com impacto em saúde, absenteísmo e performance.'
                      : selectedDomain?.classificacao === 'vulneravel'
                      ? 'Risco significativo com sinais iniciais de queda de engajamento e saúde.'
                      : 'Nível aceitável com fatores pontuais de risco.'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    <strong>Faixa ISESO:</strong> {selectedDomain && selectedDomain.valor < 40 ? '< 40%' :
                                                  selectedDomain && selectedDomain.valor < 55 ? '40-55%' : '55-70%'}
                  </Text>
                </Box>

                {/* Ações Recomendadas */}
                <Box>
                  <HStack spacing={2} mb={4}>
                    <FiTarget size={20} color="#0D249B" />
                    <Text fontSize="lg" fontWeight="bold" color="gray.700">
                      Ações Recomendadas
                    </Text>
                  </HStack>

                  <Accordion allowMultiple defaultIndex={[0]}>
                    {((acoesRecomendadas as any).Dimensões || (acoesRecomendadas as any).Dimensoes || [])
                      .filter((dimensao: any) => {
                        const mappedName = domainMapping[selectedDomain?.nome || ''] || selectedDomain?.nome
                        return dimensao.nome === mappedName
                      })
                      .map((dimensao: any, dimIndex: number) => (
                        <AccordionItem key={dimIndex}>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <Text fontWeight="semibold" fontSize="md">
                                {dimensao.nome}
                              </Text>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack spacing={4} align="stretch">
                              {(dimensao as any).ações
                                .filter((acao: any) => {
                                  const nivelNormalizado = acao.nível.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                                  return selectedDomain ? nivelNormalizado === selectedDomain.classificacao : false
                                })
                                .map((acao: any, acaoIndex: number) => (
                                  <MotionBox
                                    key={acaoIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: acaoIndex * 0.1 }}
                                  >
                                    <VStack spacing={3} align="stretch">
                                      <Card variant="outline" borderColor="green.200" bg="green.50">
                                        <CardBody p={4}>
                                          <HStack spacing={3} align="start">
                                            <FiCheckCircle size={20} color="#00BFA6" />
                                            <VStack align="start" spacing={1} flex={1}>
                                              <HStack spacing={2}>
                                                <Badge colorScheme="green" variant="solid" fontSize="xs">
                                                  SIMPLES
                                                </Badge>
                                                <Text fontSize="xs" color="green.600">
                                                  Implementação rápida (1-7 dias)
                                                </Text>
                                              </HStack>
                                              <Text fontSize="sm" color="green.700">
                                                {acao.simples}
                                              </Text>
                                            </VStack>
                                          </HStack>
                                        </CardBody>
                                      </Card>

                                      <Card variant="outline" borderColor="orange.200" bg="orange.50">
                                        <CardBody p={4}>
                                          <HStack spacing={3} align="start">
                                            <FiClock size={20} color="#FFD43B" />
                                            <VStack align="start" spacing={1} flex={1}>
                                              <HStack spacing={2}>
                                                <Badge colorScheme="orange" variant="solid" fontSize="xs">
                                                  MODERADA
                                                </Badge>
                                                <Text fontSize="xs" color="orange.600">
                                                  Implementação média (1-4 semanas)
                                                </Text>
                                              </HStack>
                                              <Text fontSize="sm" color="orange.700">
                                                {acao.moderada}
                                              </Text>
                                            </VStack>
                                          </HStack>
                                        </CardBody>
                                      </Card>

                                      <Card variant="outline" borderColor="red.200" bg="red.50">
                                        <CardBody p={4}>
                                          <HStack spacing={3} align="start">
                                            <FiAlertTriangle size={20} color="#FF6F00" />
                                            <VStack align="start" spacing={1} flex={1}>
                                              <HStack spacing={2}>
                                                <Badge colorScheme="red" variant="solid" fontSize="xs">
                                                  COMPLEXA
                                                </Badge>
                                                <Text fontSize="xs" color="red.600">
                                                  Implementação avançada (1-6 meses)
                                                </Text>
                                              </HStack>
                                              <Text fontSize="sm" color="red.700">
                                                {acao.complexa}
                                              </Text>
                                            </VStack>
                                          </HStack>
                                        </CardBody>
                                      </Card>
                                    </VStack>
                                  </MotionBox>
                                ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </Box>
              </VStack>
            </MotionBox>
          </ModalBody>
        </ModalContent>
      </Modal>
    </MotionBox>
  )
}

export default AcoesRecomendadasPage
