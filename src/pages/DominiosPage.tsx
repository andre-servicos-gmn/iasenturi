import {
  Box, VStack, HStack, Text, useColorModeValue, Grid, Card, CardBody
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiBarChart2, FiTrendingUp, FiUsers, FiTarget } from 'react-icons/fi'
import { calculateDomainAverages, calculateDomainAveragesBySector, calculateDomainAveragesBySectorAverages, fetchAllSectorsForCompany } from '@/lib/supabase'
import { useFilters } from '@/contexts/store'
import { useState, useEffect } from 'react'
import RadarChart from '../components/RadarChart'

const MotionBox = motion(Box)

const DominiosPage = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { filteredData, loading: filtersLoading, filters } = useFilters()
  const [domainAverages, setDomainAverages] = useState<any[]>([])
  const [sectorData, setSectorData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true)
        
        console.log('🔍 DominiosPage - filters:', filters)
        
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
        
        console.log('🔍 DominiosPage - radarData length:', radarData.length)
        
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
          
          // Adicionar classificação baseada no valor (5 categorias)
          const averagesWithClassification = averages.map(domain => ({
            ...domain,
            classificacao:
              domain.valor < 40
                ? 'critico'
                : domain.valor < 55
                ? 'vulneravel'
                : domain.valor < 70
                ? 'moderado'
                : domain.valor < 85
                ? 'saudavel'
                : 'excelente'
          }))
          
          setDomainAverages(averagesWithClassification)

          // Para dados por setor, sempre usar validData (que já está filtrado)
          if (filters.setor) {
            console.log('🔍 Calculando médias do setor selecionado para comparação:', filters.setor)
            const sectorAverages = calculateDomainAveragesBySector(validData as any[], filters.setor)
            setSectorData(sectorAverages)
          } else {
            setSectorData([])
          }
        } else {
          setDomainAverages([])
          setSectorData([])
        }
      } catch (error) {
        console.error('Erro ao processar dados dos domínios:', error)
      } finally {
        setLoading(false)
      }
    }

    processData()
  }, [filteredData, filters.setor, filters.empresa])

  if (loading || filtersLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Text>Carregando dados dos domínios...</Text>
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
            <FiBarChart2 size={24} color="#0D249B" />
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Análise por Domínios COPSOQ
            </Text>
          </HStack>
          <Text color="gray.500" fontSize="lg">
            Visualização detalhada dos 8 domínios psicossociais com ações sugeridas
          </Text>
        </Box>

        {/* Layout Principal - Radar + Estatísticas */}
        <Grid 
          templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
          gap={6} 
          w="full" 
          h="full" 
          flex={1}
          minH="calc(100vh - 200px)"
        >
          {/* Coluna Principal - Radar com Legenda */}
          <VStack spacing={6} align="stretch" h="full">
            {/* Radar Chart - Componente Visual Central */}
            <Card variant="premium" h="full" w="full" flex={1}>
              <CardBody p={{ base: 4, md: 6 }} h="full" display="flex" flexDirection="column">
                <VStack spacing={4} align="stretch" h="full">
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <FiTrendingUp size={20} color="#0D249B" />
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Radar dos Domínios
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {domainAverages.length} domínios avaliados
                    </Text>
                  </HStack>

                  {/* Informação sobre comparativo */}
                  {filters.setor && (
                    <Card variant="outline" bg="blue.50" borderColor="blue.200">
                      <CardBody p={4}>
                        <HStack spacing={3}>
                          <FiTarget size={16} color="#0D249B" />
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="bold" color="blue.700">
                              Comparativo Ativo
                            </Text>
                            <Text fontSize="xs" color="blue.600">
                              Setor selecionado: {filters.setor} - Comparando com dados gerais
                            </Text>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  )}

                  {domainAverages.length > 0 ? (
                    <Box h="full" w="full" flex={1} display="flex" alignItems="center" justifyContent="center">
                      <RadarChart 
                        data={domainAverages} 
                        sectorData={sectorData.length > 0 ? sectorData : undefined}
                      />
                    </Box>
                  ) : (
                    <Box textAlign="center" py={8} flex={1} display="flex" alignItems="center" justifyContent="center">
                      <Text color="gray.500">Nenhum dado disponível</Text>
                    </Box>
                  )}

                  {/* Legenda dos Domínios */}
                  {domainAverages.length > 0 && (
                    <Box mt={6}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
                        Legenda dos Domínios
                      </Text>
                      
                      {/* Classificação por Faixas */}
                      <Box mb={4}>
                        <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
                          Classificação:
                        </Text>
                        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }} gap={3}>
                          {/* Crítico */}
                          <HStack spacing={2} p={3} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200" _dark={{ bg: 'red.900', borderColor: 'red.700' }}>
                            <Box w={4} h={4} borderRadius="full" bg="red.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="bold" color="red.700">Crítico</Text>
                              <Text fontSize="xs" color="red.600">(&lt; 40%)</Text>
                            </VStack>
                          </HStack>
                          
                          {/* Vulnerável */}
                          <HStack spacing={2} p={3} bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.200" _dark={{ bg: 'orange.900', borderColor: 'orange.700' }}>
                            <Box w={4} h={4} borderRadius="full" bg="orange.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="bold" color="orange.700">Vulnerável</Text>
                              <Text fontSize="xs" color="orange.600">(40-55%)</Text>
                            </VStack>
                          </HStack>
                          
                          {/* Moderado */}
                          <HStack spacing={2} p={3} bg="yellow.50" borderRadius="lg" border="1px solid" borderColor="yellow.200" _dark={{ bg: 'yellow.900', borderColor: 'yellow.700' }}>
                            <Box w={4} h={4} borderRadius="full" bg="yellow.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="bold" color="yellow.700">Moderado</Text>
                              <Text fontSize="xs" color="yellow.600">(55-70%)</Text>
                            </VStack>
                          </HStack>
                          
                          {/* Saudável */}
                          <HStack spacing={2} p={3} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.200" _dark={{ bg: 'green.900', borderColor: 'green.700' }}>
                            <Box w={4} h={4} borderRadius="full" bg="green.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="bold" color="green.700">Saudável</Text>
                              <Text fontSize="xs" color="green.600">(70-85%)</Text>
                            </VStack>
                          </HStack>
                          
                          {/* Excelente */}
                          <HStack spacing={2} p={3} bg="green.100" borderRadius="lg" border="1px solid" borderColor="green.300" _dark={{ bg: 'green.800', borderColor: 'green.600' }}>
                            <Box w={4} h={4} borderRadius="full" bg="green.600" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="bold" color="green.700">Excelente</Text>
                              <Text fontSize="xs" color="green.600">(≥ 85%)</Text>
                            </VStack>
                          </HStack>
                        </Grid>
                      </Box>
                      
                      {/* Domínios Específicos */}
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
                          Domínios Avaliados:
                        </Text>
                        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={2}>
                          {domainAverages.map((domain, index) => (
                            <HStack key={index} spacing={2} p={2} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                              <Box
                                w={3}
                                h={3}
                                borderRadius="full"
                                bg={domain.valor < 40 ? 'red.500' : 
                                    domain.valor < 55 ? 'orange.500' : 
                                    domain.valor < 70 ? 'yellow.500' : 
                                    domain.valor < 85 ? 'green.500' : 'green.600'}
                              />
                              <Text fontSize="xs" color={textColor} fontWeight="medium">
                                {domain.nome}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {domain.valor}%
                              </Text>
                            </HStack>
                          ))}
                        </Grid>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Coluna Lateral - Estatísticas Gerais + Insights Rápidos */}
          <VStack spacing={4} align="stretch" h="full">
            {/* Estatísticas Gerais */}
            <Card variant="premium" h="full" w="full" flex={1}>
              <CardBody p={{ base: 4, md: 6 }} h="full" display="flex" flexDirection="column">
                <VStack spacing={4} align="stretch" h="full">
                  <HStack spacing={2}>
                    <FiUsers size={20} color="#0D249B" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Estatísticas Gerais
                    </Text>
                  </HStack>

                  {domainAverages.length > 0 ? (
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
                            {domainAverages.filter(domain => domain.valor < 40).length}
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
                            {domainAverages.filter(domain => domain.valor >= 40 && domain.valor < 55).length}
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
                            {domainAverages.filter(domain => domain.valor >= 55 && domain.valor < 70).length}
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
                            {domainAverages.filter(domain => domain.valor >= 70 && domain.valor < 85).length}
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
                            {domainAverages.filter(domain => domain.valor >= 85).length}
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
                              Todos os domínios
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="blue.500">
                            {Math.round(domainAverages.reduce((acc, domain) => acc + domain.valor, 0) / domainAverages.length)}%
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

            {/* Insights Rápidos - Agora abaixo das Estatísticas Gerais */}
            <Card variant="premium" w="full">
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={2}>
                    <FiTrendingUp size={20} color="#0D249B" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Insights Rápidos
                    </Text>
                  </HStack>

                  {domainAverages.length > 0 ? (
                    <VStack spacing={3} align="stretch">
                      {/* Domínio mais crítico */}
                      {(() => {
                        const dominiosCriticos = domainAverages.filter(domain => domain.valor < 40)
                        const dominioMaisCritico = dominiosCriticos.length > 0 
                          ? dominiosCriticos.reduce((min, domain) => domain.valor < min.valor ? domain : min)
                          : null
                        
                        return dominioMaisCritico ? (
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
                                Domínio Mais Crítico
                              </Text>
                              <Text fontSize="xs" color="red.500">
                                {dominioMaisCritico.nome}
                              </Text>
                              <Text fontSize="sm" color="red.500" fontWeight="bold">
                                {dominioMaisCritico.valor}%
                              </Text>
                            </VStack>
                          </Box>
                        ) : (
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
                                Status Geral
                              </Text>
                              <Text fontSize="xs" color="green.500">
                                Nenhum domínio crítico
                              </Text>
                              <Text fontSize="sm" color="green.500" fontWeight="bold">
                                ✅
                              </Text>
                            </VStack>
                          </Box>
                        )
                      })()}

                      {/* Melhor domínio */}
                      {(() => {
                        const dominiosFavoraveis = domainAverages.filter(domain => domain.valor >= 70)
                        const melhorDominio = dominiosFavoraveis.length > 0 
                          ? dominiosFavoraveis.reduce((max, domain) => domain.valor > max.valor ? domain : max)
                          : null
                        
                        return melhorDominio ? (
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
                                Melhor Domínio
                              </Text>
                              <Text fontSize="xs" color="green.500">
                                {melhorDominio.nome}
                              </Text>
                              <Text fontSize="sm" color="green.500" fontWeight="bold">
                                {melhorDominio.valor}%
                              </Text>
                            </VStack>
                          </Box>
                        ) : (
                          <Box
                            p={3}
                            bg="yellow.50"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="yellow.200"
                            _dark={{ bg: 'yellow.900', borderColor: 'yellow.700' }}
                          >
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="semibold" color="yellow.600" fontSize="sm">
                                Status Geral
                              </Text>
                              <Text fontSize="xs" color="yellow.500">
                                Sem domínios favoráveis
                              </Text>
                              <Text fontSize="sm" color="yellow.500" fontWeight="bold">
                                ⚠️
                              </Text>
                            </VStack>
                          </Box>
                        )
                      })()}

                      {/* Domínio que precisa de atenção */}
                      {(() => {
                        const dominiosAtencao = domainAverages.filter(domain => domain.valor >= 40 && domain.valor < 70)
                        const dominioAtencao = dominiosAtencao.length > 0 
                          ? dominiosAtencao.reduce((min, domain) => domain.valor < min.valor ? domain : min)
                          : null
                        
                        return dominioAtencao ? (
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
                                Precisa de Atenção
                              </Text>
                              <Text fontSize="xs" color="orange.500">
                                {dominioAtencao.nome}
                              </Text>
                              <Text fontSize="sm" color="orange.500" fontWeight="bold">
                                {dominioAtencao.valor}%
                              </Text>
                            </VStack>
                          </Box>
                        ) : (
                          <Box
                            p={3}
                            bg="blue.50"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="blue.200"
                            _dark={{ bg: 'blue.900', borderColor: 'blue.700' }}
                          >
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="semibold" color="blue.600" fontSize="sm">
                                Status Geral
                              </Text>
                              <Text fontSize="xs" color="blue.500">
                                Sem domínios em atenção
                              </Text>
                              <Text fontSize="sm" color="blue.500" fontWeight="bold">
                                ✅
                              </Text>
                            </VStack>
                          </Box>
                        )
                      })()}
                    </VStack>
                  ) : (
                    <Box textAlign="center" py={4}>
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

export default DominiosPage 