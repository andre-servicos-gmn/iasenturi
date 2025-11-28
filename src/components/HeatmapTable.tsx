import React, { useState } from 'react'
import {
  Box, VStack, HStack, Text, useColorModeValue, Grid, Card, CardBody,
  Tooltip, Badge, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalCloseButton, Divider
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiGrid, FiTrendingUp, FiInfo, FiTarget } from 'react-icons/fi'
import { useFilters } from '@/contexts/store'

interface HeatmapCell {
  setor: string
  dominio: string
  valor: number
  totalColaboradores: number
  ultimaAvaliacao?: string
  mediaOrganizacao?: number
  mediaSetor?: number
}

interface HeatmapTableProps {
  data: HeatmapCell[]
  onCellClick?: (cell: HeatmapCell) => void
}

const MotionBox = motion(Box)

const HeatmapTable: React.FC<HeatmapTableProps> = ({ data, onCellClick }) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)
  const { filters } = useFilters()

  // Extrair setores e domínios únicos dos dados
  const setores = [...new Set(data.map(item => item.setor))]
  const domainNames = [
    'Demandas Psicológicas',
    'Demandas Físicas',
    'Demandas de Trabalho',
    'Suporte Social e Liderança',
    'Esforço e Recompensa',
    'Interface Trabalho-Vida',
    'Saúde Emocional'
  ]

  // Verificar se há setor selecionado
  const hasSetorSelected = !!filters.setor

  // Função para determinar cor baseada no valor (Mapa de Calor)
  const getColorByValue = (_value: number) => '#ffffff'

  // Função para determinar fundo com paleta mais viva e moderna
  const getBgGradientByValue = (value: number) => {
    if (value <= 35) return 'linear-gradient(135deg, #e53935, #b31224)'     // Ação imediata
    if (value <= 54) return 'linear-gradient(135deg, #f08c2e, #c54b1f)'     // Prevenção urgente
    if (value <= 69) return 'linear-gradient(135deg, #eccc5c, #d8a722)'     // Manter atenção
    if (value <= 84) return 'linear-gradient(135deg, #2fbf89, #1d8f72)'     // Boas práticas
    return 'linear-gradient(135deg, #4d6df5, #2d3fa6)'                      // Excelência
  }

  // Fundo sutil mais escuro para caixas de texto
  const getOverlayColorByValue = (value: number) => {
    if (value <= 35) return '#9c1328'
    if (value <= 54) return '#b64b24'
    if (value <= 69) return '#b88f18'
    if (value <= 84) return '#17775c'
    return '#2739a1'
  }

  // Função para obter classificação (Mapa de Calor)
  const getClassification = (value: number) => {
    if (value <= 35) return 'Ação imediata'
    if (value <= 54) return 'Prevenção urgente'
    if (value <= 69) return 'Manter atenção'
    if (value <= 84) return 'Boas práticas'
    return 'Excelência'
  }

  // Função para obter cor da classificação (Mapa de Calor)
  const getClassificationColor = (value: number) => {
    if (value <= 35) return 'red.400'
    if (value <= 54) return 'orange.400'
    if (value <= 69) return 'yellow.500'
    if (value <= 84) return 'green.400'
    return 'blue.500'
  }

  // Função para calcular médias comparativas
  const calculateComparativeData = () => {
    if (!hasSetorSelected) return data

    const setorSelecionado = filters.setor

    return data.map(cell => {
      // Calcular média da organização (todos os setores exceto o selecionado)
      const outrosSetores = data.filter(item =>
        item.dominio === cell.dominio && item.setor !== setorSelecionado
      )
      const mediaOrganizacao = outrosSetores.length > 0
        ? Math.round(outrosSetores.reduce((acc, item) => acc + item.valor, 0) / outrosSetores.length)
        : cell.valor

      // Calcular média do setor selecionado
      const dadosSetor = data.filter(item =>
        item.dominio === cell.dominio && item.setor === setorSelecionado
      )
      const mediaSetor = dadosSetor.length > 0
        ? Math.round(dadosSetor.reduce((acc, item) => acc + item.valor, 0) / dadosSetor.length)
        : cell.valor

      return {
        ...cell,
        mediaOrganizacao,
        mediaSetor
      }
    })
  }

  const comparativeData = calculateComparativeData()

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell)
    onOpen()
    onCellClick?.(cell)
  }

  return (
    <>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card id="heatmap-chart" variant="premium" w="full">
          <CardBody p={6}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <HStack spacing={2}>
                <FiGrid size={20} color="senturi.azulProfundo" />
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Mapa de Calor por Setor e Domínio
                </Text>
              </HStack>

              {/* Informação sobre comparativo */}
              {hasSetorSelected && (
                <Card variant="outline" bg="blue.50" borderColor="blue.200">
                  <CardBody p={4}>
                    <HStack spacing={3}>
                      <FiTarget size={16} color="senturi.azulProfundo" />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold" color="blue.700">
                          Comparativo Ativo
                        </Text>
                        <Text fontSize="xs" color="blue.600">
                          Setor selecionado: {filters.setor} - Comparando com média da organização
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              )}

              {/* Heatmap Grid */}
              <Box overflowX="auto">
                <Grid
                  templateColumns={`120px repeat(${domainNames.length}, 1fr)`}
                  gap={1}
                  minW="800px"
                >
                  {/* Header com nomes dos domínios */}
                  <Box p={3} bg="gray.50" borderRadius="md">
                    <Text fontSize="xs" fontWeight="bold" color="gray.600" textAlign="center">
                      Setores
                    </Text>
                  </Box>
                  {domainNames.map((dominio, index) => (
                    <Box key={index} p={3} bg="gray.50" borderRadius="md">
                      <Text fontSize="xs" fontWeight="bold" color="gray.600" textAlign="center">
                        {dominio}
                      </Text>
                    </Box>
                  ))}

                  {/* Linhas de dados */}
                  {setores.map((setor, setorIndex) => {
                    const setorData = comparativeData.filter(item => item.setor === setor)
                    const isSelectedSetor = setor === filters.setor

                    return (
                      <React.Fragment key={setorIndex}>
                        {/* Nome do setor */}
                        <Box
                          p={3}
                          bg={isSelectedSetor ? 'blue.50' : 'gray.50'}
                          borderRadius="md"
                          border={isSelectedSetor ? '2px solid' : '1px solid'}
                          borderColor={isSelectedSetor ? 'blue.200' : 'gray.200'}
                        >
                          <VStack spacing={1} align="center">
                            <Text
                              fontSize="xs"
                              fontWeight="semibold"
                              color={isSelectedSetor ? 'blue.700' : textColor}
                              textAlign="center"
                              whiteSpace="normal"
                              wordBreak="break-word"
                            >
                              {setor}
                            </Text>
                            <Text fontSize="xs" color={isSelectedSetor ? 'blue.500' : 'gray.500'}>
                              {setorData[0]?.totalColaboradores || 0} colab.
                            </Text>
                            {isSelectedSetor && (
                              <Badge size="sm" colorScheme="blue" variant="subtle" fontSize="xs">
                                Selecionado
                              </Badge>
                            )}
                          </VStack>
                        </Box>

                        {/* Células de dados */}
                        {domainNames.map((dominio, dominioIndex) => {
                          const cellData = setorData.find(item => item.dominio === dominio)
                          const valor = cellData?.valor || 0
                          const bgGradient = getBgGradientByValue(valor)
                          const overlayColor = getOverlayColorByValue(valor)
                          const textColorValue = getColorByValue(valor)
                          const isSelectedSetorCell = isSelectedSetor

                          return (
                            <Tooltip
                              key={`${setorIndex}-${dominioIndex}`}
                              label={
                                <VStack spacing={1} align="center">
                                  <Text fontWeight="bold">{setor}</Text>
                                  <Text>{dominio}</Text>
                                  <Text color="white" fontWeight="bold">
                                    {valor}%
                                  </Text>
                                  {isSelectedSetorCell && cellData?.mediaOrganizacao !== undefined && (
                                    <>
                                      <Divider />
                                      <HStack spacing={2}>
                                        <Box w={3} h={3} bg="blue.400" borderRadius="full" />
                                        <Text fontSize="xs" color="blue.200">
                                          Org: {cellData.mediaOrganizacao}%
                                        </Text>
                                      </HStack>
                                      <HStack spacing={2}>
                                        <Box w={3} h={3} bg="blue.600" borderRadius="full" />
                                        <Text fontSize="xs" color="blue.200">
                                          Setor: {cellData.mediaSetor}%
                                        </Text>
                                      </HStack>
                                    </>
                                  )}
                                  <Text fontSize="xs" color="gray.300">
                                    {cellData?.ultimaAvaliacao ?
                                      `Última avaliação: ${cellData.ultimaAvaliacao}` :
                                      'Sem dados de avaliação'
                                    }
                                  </Text>
                                </VStack>
                              }
                              placement="top"
                              hasArrow
                            >
                              <Box
                                p={3}
                                bgGradient={bgGradient}
                                borderRadius="md"
                                cursor="pointer"
                                transition="all 0.2s"
                                border={isSelectedSetorCell ? '2px solid' : '1px solid'}
                                borderColor={isSelectedSetorCell ? 'blue.300' : 'transparent'}
                                _hover={{
                                  transform: 'translateY(-2px)',
                                  boxShadow: 'lg',
                                  filter: 'brightness(1.03)'
                                }}
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                minH="60px"
                                position="relative"
                                onClick={() => cellData && handleCellClick(cellData)}
                              >
                                <VStack spacing={1} align="center">
                                  <Text
                                    fontSize="lg"
                                    fontWeight="bold"
                                    color={textColorValue}
                                    textShadow="0 1px 3px rgba(0,0,0,0.45)"
                                  >
                                    {valor}%
                                  </Text>
                                  <Box
                                    px={2}
                                    py={0.5}
                                    bg={overlayColor}
                                    borderRadius="full"
                                    boxShadow="0 2px 6px rgba(0,0,0,0.16)"
                                  >
                                    <Text
                                      fontSize="xs"
                                      fontWeight="semibold"
                                      letterSpacing="0.1em"
                                      textTransform="uppercase"
                                      color={textColorValue}
                                      textAlign="center"
                                      whiteSpace="nowrap"
                                    >
                                      {getClassification(valor)}
                                    </Text>
                                  </Box>
                                </VStack>

                                {/* Indicador de comparativo para setor selecionado */}
                                {isSelectedSetorCell && cellData?.mediaOrganizacao !== undefined && (
                                  <HStack spacing={1} mt={1}>
                                    <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                                    <Box w={2} h={2} bg="blue.600" borderRadius="full" />
                                  </HStack>
                                )}
                              </Box>
                            </Tooltip>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </Grid>
              </Box>

              {/* Legenda Visual Melhorada */}
              <Card variant="outline">
                <CardBody p={4}>
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={2}>
                      <FiInfo size={16} color="senturi.azulProfundo" />
                      <Text fontSize="sm" fontWeight="bold" color={textColor}>
                        Legenda de Cores
                      </Text>
                    </HStack>

                    {/* Legenda de classificação (5 faixas) */}
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb={2}>
                        Classificação de Risco:
                      </Text>
                      <Grid templateColumns="repeat(5, 1fr)" gap={3}>
                        <HStack spacing={2} p={2} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                          <Box w={4} h={4} borderRadius="full" bgGradient="linear-gradient(135deg, #e53935, #b31224)" />
                          <VStack spacing={0} align="start">
                            <Text fontSize="xs" fontWeight="bold" color="red.700" whiteSpace="nowrap">Ação imediata</Text>
                            <Text fontSize="xs" color="red.600" whiteSpace="nowrap">0-35</Text>
                          </VStack>
                        </HStack>
                        <HStack spacing={2} p={2} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
                          <Box w={4} h={4} borderRadius="full" bgGradient="linear-gradient(135deg, #f08c2e, #c54b1f)" />
                          <VStack spacing={0} align="start">
                            <Text fontSize="xs" fontWeight="bold" color="orange.700" whiteSpace="nowrap">Prevenção urgente</Text>
                            <Text fontSize="xs" color="orange.600" whiteSpace="nowrap">36-54</Text>
                          </VStack>
                        </HStack>
                        <HStack spacing={2} p={2} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
                          <Box w={4} h={4} borderRadius="full" bgGradient="linear-gradient(135deg, #eccc5c, #d8a722)" />
                          <VStack spacing={0} align="start">
                            <Text fontSize="xs" fontWeight="bold" color="yellow.700" whiteSpace="nowrap">Manter atenção</Text>
                            <Text fontSize="xs" color="yellow.600" whiteSpace="nowrap">55-69</Text>
                          </VStack>
                        </HStack>
                        <HStack spacing={2} p={2} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                          <Box w={4} h={4} borderRadius="full" bgGradient="linear-gradient(135deg, #2fbf89, #1d8f72)" />
                          <VStack spacing={0} align="start">
                            <Text fontSize="xs" fontWeight="bold" color="green.700" whiteSpace="nowrap">Boas práticas</Text>
                            <Text fontSize="xs" color="green.600" whiteSpace="nowrap">70-84</Text>
                          </VStack>
                        </HStack>
                        <HStack spacing={2} p={2} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                          <Box w={4} h={4} borderRadius="full" bgGradient="linear-gradient(135deg, #4d6df5, #2d3fa6)" />
                          <VStack spacing={0} align="start">
                            <Text fontSize="xs" fontWeight="bold" color="blue.700" whiteSpace="nowrap">Excelência</Text>
                            <Text fontSize="xs" color="blue.600" whiteSpace="nowrap">85-100</Text>
                          </VStack>
                        </HStack>
                      </Grid>
                    </Box>

                    {/* Legenda de comparativo (apenas quando setor selecionado) */}
                    {hasSetorSelected && (
                      <Box>
                        <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb={2}>
                          Comparativo (Setor Selecionado):
                        </Text>
                        <HStack spacing={4}>
                          <HStack spacing={2}>
                            <Box w={3} h={3} bg="blue.400" borderRadius="full" />
                            <VStack spacing={0} align="start">
                              <Text fontSize="xs" fontWeight="bold" color="blue.600">
                                Média da Organização
                              </Text>
                              <Text fontSize="xs" color="blue.500">
                                (Todos os outros setores)
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack spacing={2}>
                            <Box w={3} h={3} bg="blue.600" borderRadius="full" />
                            <VStack spacing={0} align="start">
                              <Text fontSize="xs" fontWeight="bold" color="blue.700">
                                Média do Setor
                              </Text>
                              <Text fontSize="xs" color="blue.600">
                                ({filters.setor})
                              </Text>
                            </VStack>
                          </HStack>
                        </HStack>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </CardBody>
        </Card>
      </MotionBox>

      {/* Modal de Detalhes */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FiTrendingUp size={20} color="senturi.azulProfundo" />
              <Text>Detalhes do Setor</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedCell && (
              <VStack spacing={4} align="stretch">
                <Card variant="outline">
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold" color={textColor}>
                          {selectedCell.setor}
                        </Text>
                        <HStack spacing={2}>
                          <Box w={2} h={2} borderRadius="full" bg={getClassificationColor(selectedCell.valor)} />
                          <Text fontSize="sm" fontWeight="semibold" color={getClassificationColor(selectedCell.valor)}>
                            {getClassification(selectedCell.valor)}
                          </Text>
                        </HStack>
                      </HStack>

                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">
                          Domínio:
                        </Text>
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                          {selectedCell.dominio}
                        </Text>
                      </HStack>

                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">
                          Pontuação:
                        </Text>
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          color={getColorByValue(selectedCell.valor)}
                        >
                          {selectedCell.valor}%
                        </Text>
                      </HStack>

                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">
                          Colaboradores:
                        </Text>
                        <Text fontSize="sm" color={textColor}>
                          {selectedCell.totalColaboradores}
                        </Text>
                      </HStack>

                      {selectedCell.ultimaAvaliacao && (
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">
                            Última avaliação:
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            {selectedCell.ultimaAvaliacao}
                          </Text>
                        </HStack>
                      )}

                      {/* Comparativo no modal */}
                      {hasSetorSelected && selectedCell.mediaOrganizacao !== undefined && (
                        <>
                          <Divider />
                          <VStack spacing={2} align="stretch">
                            <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                              Comparativo:
                            </Text>
                            <HStack justify="space-between">
                              <HStack spacing={2}>
                                <Box w={3} h={3} bg="blue.400" borderRadius="full" />
                                <Text fontSize="sm" color="gray.500">
                                  Média da Organização:
                                </Text>
                              </HStack>
                              <Text fontSize="sm" fontWeight="semibold" color="blue.600">
                                {selectedCell.mediaOrganizacao}%
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <HStack spacing={2}>
                                <Box w={3} h={3} bg="blue.600" borderRadius="full" />
                                <Text fontSize="sm" color="gray.500">
                                  Média do Setor:
                                </Text>
                              </HStack>
                              <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                                {selectedCell.mediaSetor}%
                              </Text>
                            </HStack>
                          </VStack>
                        </>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default HeatmapTable
