import {
  Box, VStack, HStack, Text, useColorModeValue, Grid, Card, CardBody
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiGrid, FiTrendingUp, FiBarChart2 } from 'react-icons/fi'
import { useFilters } from '@/contexts/store'
import { useState, useEffect } from 'react'
import HeatmapTable from '../components/HeatmapTable'


const MotionBox = motion(Box)

const MapaCalorPage = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { filteredData, loading: filtersLoading, filters } = useFilters()
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processData = () => {
      try {
        setLoading(true)

        if (filteredData.length > 0) {
          // Definir nomes dos domínios alinhados com o HeatmapTable
          const domainNames = [
            'Exigências do trabalho',
            'Demandas Físicas',
            'Autonomia e Controle no trabalho',
            'Suporte Social e Qualidade da Liderança',
            'Esforço e Recompensa',
            'Equilíbrio Trabalho - Vida',
            'Saúde Emocional e Bem-Estar'
          ]

          // Mapear campos de dados para nomes dos domínios (usar médias calculadas)
          const domainFields = [
            'media_exigencias',
            'media_organizacao',
            'media_relacoes',
            'media_interface',
            'media_significado',
            'media_inseguranca',
            'saude_emocional'
          ]

          // Obter setores únicos
          const setores = [...new Set(filteredData.map(item => item.area_setor).filter(Boolean))]

          // Processar dados para o heatmap
          const heatmapCells: any[] = []

          setores.forEach(setor => {
            const dadosSetor = filteredData.filter(item => item.area_setor === setor)

            domainNames.forEach((dominio, index) => {
              const field = domainFields[index]
              const valores = dadosSetor
                .map(item => {
                  const valor = (item as any)[field]
                  return parseFloat(valor || '0')
                })
                .filter(valor => valor > 0)

              const media = valores.length > 0
                ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
                : 0

              // Encontrar a data mais recente de avaliação
              const ultimaAvaliacao = dadosSetor
                .map(item => (item as any).data_avaliacao)
                .filter(Boolean)
                .sort()
                .pop()

              heatmapCells.push({
                setor,
                dominio,
                valor: media,
                totalColaboradores: dadosSetor.length,
                ultimaAvaliacao: ultimaAvaliacao ? new Date(ultimaAvaliacao).toLocaleDateString('pt-BR') : undefined
              })
            })
          })

          // Calcular médias comparativas se houver setor selecionado
          if (filters.setor) {
            const setorSelecionado = filters.setor

            heatmapCells.forEach(cell => {
              // Calcular média da organização (todos os setores exceto o selecionado)
              const outrosSetores = heatmapCells.filter(item =>
                item.dominio === cell.dominio && item.setor !== setorSelecionado
              )
              const mediaOrganizacao = outrosSetores.length > 0
                ? Math.round(outrosSetores.reduce((acc, item) => acc + item.valor, 0) / outrosSetores.length)
                : cell.valor

              // Calcular média do setor selecionado
              const dadosSetor = heatmapCells.filter(item =>
                item.dominio === cell.dominio && item.setor === setorSelecionado
              )
              const mediaSetor = dadosSetor.length > 0
                ? Math.round(dadosSetor.reduce((acc, item) => acc + item.valor, 0) / dadosSetor.length)
                : cell.valor

              cell.mediaOrganizacao = mediaOrganizacao
              cell.mediaSetor = mediaSetor
            })
          }

          setHeatmapData(heatmapCells)
        } else {
          setHeatmapData([])
        }
      } catch (error) {
        console.error('Erro ao processar dados do mapa de calor:', error)
      } finally {
        setLoading(false)
      }
    }

    processData()
  }, [filteredData, filters.setor])

  const handleCellClick = (cell: any) => {
    console.log('Célula clicada:', cell)
    // Aqui você pode adicionar lógica adicional quando uma célula é clicada
  }

  if (loading || filtersLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Text>Carregando mapa de calor...</Text>
      </VStack>
    )
  }

  return (
    <MotionBox
      id="heatmap-relatorio"
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
          <HStack justify="space-between" align="start" mb={2}>
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <FiGrid size={24} color="#0D249B" />
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  Mapa de Calor Psicossocial
                </Text>
              </HStack>
              <Text color="gray.500" fontSize="lg">
                Visualização por setor e domínio com análise de risco
              </Text>
            </VStack>


          </HStack>
        </Box>

        {/* Grid Principal */}
        <Grid
          templateColumns={{ base: "1fr", lg: "3fr 1fr" }}
          gap={6}
          w="full"
          h="full"
          flex={1}
          minH="calc(100vh - 200px)"
        >
          {/* Coluna Principal - Heatmap */}
          <VStack spacing={6} align="stretch" h="full">
            <HeatmapTable
              data={heatmapData}
              onCellClick={handleCellClick}
            />
          </VStack>

          {/* Coluna Lateral - Estatísticas */}
          <VStack spacing={4} align="stretch" h="full">
            {/* Resumo Geral */}
            <Card variant="premium" h="full" w="full" flex={1}>
              <CardBody p={{ base: 4, md: 6 }} h="full" display="flex" flexDirection="column">
                <VStack spacing={4} align="stretch" h="full">
                  <HStack spacing={2}>
                    <FiBarChart2 size={20} color="#0D249B" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Resumo Geral
                    </Text>
                  </HStack>

                  {heatmapData.length > 0 ? (
                    <VStack spacing={3} align="stretch" flex={1}>
                      {/* Crítico */}
                      <Box
                        p={3}
                        bg="red.50"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="red.200"
                        _dark={{ bg: 'red.900', borderColor: 'red.700' }}
                      >
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color="red.600" fontSize="sm">
                              Crítico
                            </Text>
                            <Text fontSize="xs" color="red.500">
                              Pontuação &lt; 40%
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="red.500">
                            {heatmapData.filter(cell => cell.valor < 40).length}
                          </Text>
                        </HStack>
                      </Box>

                      {/* Vulnerável */}
                      <Box
                        p={3}
                        bg="orange.50"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="orange.200"
                        _dark={{ bg: 'orange.900', borderColor: 'orange.700' }}
                      >
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color="orange.600" fontSize="sm">
                              Vulnerável
                            </Text>
                            <Text fontSize="xs" color="orange.500">
                              Pontuação 40-55%
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="orange.500">
                            {heatmapData.filter(cell => cell.valor >= 40 && cell.valor < 55).length}
                          </Text>
                        </HStack>
                      </Box>

                      {/* Moderado */}
                      <Box
                        p={3}
                        bg="yellow.50"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="yellow.200"
                        _dark={{ bg: 'yellow.900', borderColor: 'yellow.700' }}
                      >
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color="yellow.600" fontSize="sm">
                              Moderado
                            </Text>
                            <Text fontSize="xs" color="yellow.600">
                              Pontuação 55-70%
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="yellow.600">
                            {heatmapData.filter(cell => cell.valor >= 55 && cell.valor < 70).length}
                          </Text>
                        </HStack>
                      </Box>

                      {/* Saudável */}
                      <Box
                        p={3}
                        bg="green.50"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="green.200"
                        _dark={{ bg: 'green.900', borderColor: 'green.700' }}
                      >
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color="green.600" fontSize="sm">
                              Saudável
                            </Text>
                            <Text fontSize="xs" color="green.500">
                              Pontuação 70-85%
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="green.600">
                            {heatmapData.filter(cell => cell.valor >= 70 && cell.valor < 85).length}
                          </Text>
                        </HStack>
                      </Box>

                      {/* Excelente */}
                      <Box
                        p={3}
                        bg="green.100"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="green.300"
                        _dark={{ bg: 'green.800', borderColor: 'green.600' }}
                      >
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color="green.700" fontSize="sm">
                              Excelente
                            </Text>
                            <Text fontSize="xs" color="green.700">
                              Pontuação ≥ 85%
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="green.700">
                            {heatmapData.filter(cell => cell.valor >= 85).length}
                          </Text>
                        </HStack>
                      </Box>

                      {/* Média geral */}
                      <Box
                        p={3}
                        bg="blue.50"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="blue.200"
                        _dark={{ bg: 'blue.900', borderColor: 'blue.700' }}
                      >
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color="blue.600" fontSize="sm">
                              Média Geral
                            </Text>
                            <Text fontSize="xs" color="blue.500">
                              Todas as células
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="blue.500">
                            {Math.round(heatmapData.reduce((acc, cell) => acc + cell.valor, 0) / heatmapData.length)}%
                          </Text>
                        </HStack>
                      </Box>
                    </VStack>
                  ) : (
                    <Box textAlign="center" py={4} flex={1} display="flex" alignItems="center" justifyContent="center">
                      <Text color="gray.500" fontSize="sm">
                        Nenhuma estatística disponível
                      </Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Insights */}
            <Card variant="premium" h="full" w="full" flex={1}>
              <CardBody p={{ base: 4, md: 6 }} h="full" display="flex" flexDirection="column">
                <VStack spacing={4} align="stretch" h="full">
                  <HStack spacing={2}>
                    <FiTrendingUp size={20} color="#0D249B" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Insights Rápidos
                    </Text>
                  </HStack>

                  {heatmapData.length > 0 ? (
                    <VStack spacing={3} align="stretch" flex={1}>
                      {/* Setor com maior risco */}
                      {(() => {
                        const setoresCriticos = heatmapData
                          .filter(cell => cell.valor < 40)
                          .reduce((acc, cell) => {
                            acc[cell.setor] = (acc[cell.setor] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)

                        const setorMaisCritico = Object.entries(setoresCriticos)
                          .sort(([, a], [, b]) => (b as number) - (a as number))[0]

                        return setorMaisCritico ? (
                          <Box
                            p={3}
                            bg="red.50"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="red.200"
                            _dark={{ bg: 'red.900', borderColor: 'red.700' }}
                          >
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="semibold" color="red.600" fontSize="sm">
                                Setor Mais Crítico
                              </Text>
                              <Text fontSize="xs" color="red.500">
                                {setorMaisCritico[0] as string}
                              </Text>
                              <Text fontSize="xs" color="red.500">
                                {setorMaisCritico[1] as number} domínios críticos
                              </Text>
                            </VStack>
                          </Box>
                        ) : null
                      })()}

                      {/* Domínio mais crítico */}
                      {(() => {
                        const dominiosCriticos = heatmapData
                          .filter(cell => cell.valor < 40)
                          .reduce((acc, cell) => {
                            acc[cell.dominio] = (acc[cell.dominio] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)

                        const dominioMaisCritico = Object.entries(dominiosCriticos)
                          .sort(([, a], [, b]) => (b as number) - (a as number))[0]

                        return dominioMaisCritico ? (
                          <Box
                            p={3}
                            bg="orange.50"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="orange.200"
                            _dark={{ bg: 'orange.900', borderColor: 'orange.700' }}
                          >
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="semibold" color="orange.600" fontSize="sm">
                                Domínio Mais Crítico
                              </Text>
                              <Text fontSize="xs" color="orange.500">
                                {dominioMaisCritico[0] as string}
                              </Text>
                              <Text fontSize="xs" color="orange.500">
                                {dominioMaisCritico[1] as number} setores afetados
                              </Text>
                            </VStack>
                          </Box>
                        ) : null
                      })()}

                      {/* Melhor setor */}
                      {(() => {
                        const setoresFavoraveis = heatmapData
                          .filter(cell => cell.valor >= 70)
                          .reduce((acc, cell) => {
                            acc[cell.setor] = (acc[cell.setor] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)

                        const melhorSetor = Object.entries(setoresFavoraveis)
                          .sort(([, a], [, b]) => (b as number) - (a as number))[0]

                        return melhorSetor ? (
                          <Box
                            p={3}
                            bg="green.50"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="green.200"
                            _dark={{ bg: 'green.900', borderColor: 'green.700' }}
                          >
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="semibold" color="green.600" fontSize="sm">
                                Melhor Setor
                              </Text>
                              <Text fontSize="xs" color="green.500">
                                {melhorSetor[0] as string}
                              </Text>
                              <Text fontSize="xs" color="green.500">
                                {melhorSetor[1] as number} domínios favoráveis
                              </Text>
                            </VStack>
                          </Box>
                        ) : null
                      })()}
                    </VStack>
                  ) : (
                    <Box textAlign="center" py={4} flex={1} display="flex" alignItems="center" justifyContent="center">
                      <Text color="gray.500" fontSize="sm">
                        Nenhum insight disponível
                      </Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Grid>
      </VStack>
    </MotionBox>
  )
}

export default MapaCalorPage 
