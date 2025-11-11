import {
  Box, VStack, HStack, Text, useColorModeValue, Grid, Card, CardBody, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiAlertTriangle, FiTrendingUp, FiCheckCircle, FiClock, FiTarget } from 'react-icons/fi'
import { calculateDomainAverages, calculateDomainAveragesBySectorAverages, fetchAllSectorsForCompany } from '@/lib/supabase'
import { useFilters } from '@/contexts/store'
import { useState, useEffect } from 'react'
import acoesRecomendadas from '@/data/acoes_recomendadas.json'

const MotionBox = motion(Box)

const AcoesRecomendadasPage = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { filteredData, loading: filtersLoading, filters } = useFilters()
  const [domainAverages, setDomainAverages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDomain, setSelectedDomain] = useState<any>(null)

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true)

        console.log('🔍 AcoesRecomendadasPage - filters:', filters)

        // Filtrar dados válidos (empresa_id não nulo)
        const validData = filteredData.filter(item => item.empresa_id !== null && item.empresa_id !== undefined)
        console.log('🔍 Dados válidos (empresa_id não nulo):', validData.length, 'de', filteredData.length)

        // Determinar quais dados usar para o radar
        let radarData: any[] = []

        if (filters.setor) {
          // Se setor está selecionado, usar apenas dados do setor selecionado
          console.log('🏭 Setor selecionado - usando dados do setor:', filters.setor)
          radarData = validData.filter(item => item.area_setor === filters.setor)
          console.log('🔍 Dados do setor encontrados:', radarData.length, 'registros')
        } else if (filters.empresa) {
          // Se empresa está selecionada mas nenhum setor, usar dados de TODOS os setores da empresa
          console.log('🏢 Empresa selecionada - buscando dados de todos os setores:', filters.empresa)
          radarData = await fetchAllSectorsForCompany(filters.empresa) as any[]
          console.log('🔍 Dados de todos os setores encontrados:', radarData.length, 'registros')
        } else {
          // Se nenhum filtro específico, usar validData
          radarData = validData
          console.log('🔍 Usando validData geral:', radarData.length, 'registros')
        }

        console.log('🔍 AcoesRecomendadasPage - radarData length:', radarData.length)

        if (radarData.length > 0) {
          // Calcular médias por domínio
          let averages: any[]

          if (filters.empresa && !filters.setor) {
            // Se empresa está selecionada mas nenhum setor, usar o mesmo método do mapa de calor
            console.log('🏢 Usando método do mapa de calor (média das médias dos setores)')
            averages = calculateDomainAveragesBySectorAverages(radarData as any[])
          } else {
            // Para setor específico ou dados gerais, usar método direto
            console.log('🏭 Usando método direto (média de todos os colaboradores)')
            averages = calculateDomainAverages(radarData as any[])
          }

          // Filtrar apenas domínios com ISESO < 70
          const criticalDomains = averages.filter(domain => domain.valor < 70)

          // Adicionar classificação baseada no valor (5 categorias)
          const criticalDomainsWithClassification = criticalDomains.map(domain => ({
            ...domain,
            classificacao:
              domain.valor < 40
                ? 'critico'
                : domain.valor < 55
                ? 'vulneravel'
                : 'moderado'
          }))

          setDomainAverages(criticalDomainsWithClassification)
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

  const handleDomainClick = (domain: any) => {
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
            <FiAlertTriangle size={24} color="#FF6F00" />
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
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
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
                          bg={domain.valor < 40 ? 'red.500' :
                              domain.valor < 55 ? 'orange.500' : 'yellow.500'}
                        />
                        <Text fontSize="sm" color="gray.500">
                          ISESO: {domain.valor}%
                        </Text>
                      </HStack>

                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        {domain.nome}
                      </Text>

                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {domain.classificacao === 'critico' ? 'Ação imediata obrigatória' :
                         domain.classificacao === 'vulneravel' ? 'Prevenção urgente' :
                         'Manter atenção'}
                      </Text>

                      <Button
                        size="sm"
                        colorScheme={domain.valor < 40 ? 'red' : domain.valor < 55 ? 'orange' : 'yellow'}
                        variant="outline"
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
                  bg={selectedDomain?.valor < 40 ? 'red.500' :
                      selectedDomain?.valor < 55 ? 'orange.500' : 'yellow.500'}
                  boxShadow="md"
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold">{selectedDomain?.nome}</Text>
                  <HStack spacing={2}>
                    <Badge
                      colorScheme={selectedDomain?.valor < 40 ? 'red' :
                                   selectedDomain?.valor < 55 ? 'orange' : 'yellow'}
                      variant="subtle"
                      fontSize="xs"
                    >
                      ISESO: {selectedDomain?.valor}%
                    </Badge>
                    <Badge variant="outline" fontSize="xs">
                      {selectedDomain?.classificacao === 'critico' ? 'Ação Imediata' :
                       selectedDomain?.classificacao === 'vulneravel' ? 'Prevenção Urgente' :
                       'Manter Atenção'}
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
                    <strong>Faixa ISESO:</strong> {selectedDomain?.valor < 40 ? '< 40%' :
                                                  selectedDomain?.valor < 55 ? '40-55%' : '55-70%'}
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
                    {acoesRecomendadas.Dimensões
                      .filter(dimensao => {
                        console.log('🔍 Filtrando dimensão:', dimensao.nome, 'vs', selectedDomain?.nome)
                        // Mapeamento correto dos nomes dos domínios
                        const domainMapping: { [key: string]: string } = {
                          'Saúde Emocional': 'Saúde Emocional (Senturi)',
                          'Demandas Psicológicas': 'Demandas Psicológicas',
                          'Demandas Físicas': 'Demandas Físicas',
                          'Demandas de Trabalho': 'Demandas de Trabalho',
                          'Suporte Social e Liderança': 'Suporte Social e Liderança',
                          'Esforço e Recompensa': 'Esforço e Recompensa',
                          'Interface Trabalho-Vida': 'Interface Trabalho-Vida'
                        }
                        const mappedName = domainMapping[selectedDomain?.nome] || selectedDomain?.nome
                        return dimensao.nome === mappedName
                      })
                      .map((dimensao, dimIndex) => (
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
                                  return nivelNormalizado === selectedDomain?.classificacao
                                })
                                .map((acao: any, acaoIndex: number) => (
                                  <MotionBox
                                    key={acaoIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: acaoIndex * 0.1 }}
                                  >
                                    <VStack spacing={3} align="stretch">
                                      {/* Ação Simples */}
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

                                      {/* Ação Moderada */}
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

                                      {/* Ação Complexa */}
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