import {
  Box, VStack, HStack, Text, useColorModeValue, Card, CardBody,
  Badge, Button, Grid, Avatar, Tooltip, Divider, List, ListItem
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  FiUsers, FiAlertTriangle, FiAlertOctagon, FiClock, FiAward,
  FiActivity, FiTarget,
  FiBarChart2, FiTrendingUp, FiCalendar, FiCheckCircle
} from 'react-icons/fi'
import { calculateDomainAverages } from '@/lib/supabase'
import { classificarISESOCompleto, getChakraColorFromISESO, obterAcoesSugeridas, getTriClassificacaoFromISESO } from '@/lib/utils'
import { useFilters } from '@/contexts/store'
import { useState, useEffect } from 'react'
import PSQICard from './PSQICard'
import EPS10Card from './EPS10Card'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

const Dashboard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  const alternateBg = useColorModeValue('gray.50', 'gray.700')
  const { filteredData, loading: filtersLoading, filters } = useFilters()
  
  const [isesoGeral, setIsesoGeral] = useState(0)
  const [totalColaboradores, setTotalColaboradores] = useState(0)
  const [setoresCriticos, setSetoresCriticos] = useState(0)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('')
  const [topRiscos, setTopRiscos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [allColaboradores, setAllColaboradores] = useState<any[]>([])

  useEffect(() => {
    const processData = () => {
      try {
        setLoading(true)
        
        console.log('📊 Dashboard - Dados filtrados recebidos:', filteredData.length, 'registros')
        
        if (filteredData.length > 0) {
          console.log('📊 Primeiro registro no Dashboard:', filteredData[0])
          
          // Calcular ISESO Geral
          const averages = calculateDomainAverages(filteredData as any[])
          const iseso = Math.round(averages.reduce((sum, domain) => sum + domain.valor, 0) / averages.length)
          setIsesoGeral(iseso)
          console.log('📈 ISESO Geral calculado:', iseso)

          // Total de colaboradores
          setTotalColaboradores(filteredData.length)
          console.log('👥 Total de colaboradores:', filteredData.length)

          // Setores críticos (exemplo: setores com ISESO > 60)
          const setores = [...new Set(filteredData.map(item => item.area_setor).filter(Boolean))]
              const criticos = setores.filter(setor => {
            const dadosSetor = filteredData.filter(item => item.area_setor === setor)
            const mediaSetor = dadosSetor.reduce((sum, item) => {
              // Usar ISESO se disponível, senão calcular a partir das médias
                  if ((item as any).iseso) {
                    return sum + parseFloat((item as any).iseso)
              }
              
              // Calcular a partir das médias dos domínios
              const dominios = [
                    parseFloat((item as any).media_exigencias || '0'),
                    parseFloat((item as any).media_organizacao || '0'),
                    parseFloat((item as any).media_relacoes || '0'),
                    parseFloat((item as any).media_interface || '0'),
                    parseFloat((item as any).media_significado || '0'),
                    parseFloat((item as any).media_inseguranca || '0'),
                    parseFloat((item as any).media_bem_estar || '0')
              ].filter(val => !isNaN(val) && val > 0)
              
              return sum + (dominios.length > 0 ? dominios.reduce((a, b) => a + b, 0) / dominios.length : 0)
            }, 0) / dadosSetor.length
            return mediaSetor > 60
          }).length
          setSetoresCriticos(criticos)
          console.log('⚠️ Setores críticos:', criticos)

          // Última atualização
          const ultimaData = new Date(Math.max(...filteredData.map(item => new Date(item.created_at || Date.now()).getTime())))
          setUltimaAtualizacao(ultimaData.toLocaleDateString('pt-BR'))
          console.log('📅 Última atualização:', ultimaData.toLocaleDateString('pt-BR'))

          // Todos os colaboradores para paginação
          const todosColaboradores = filteredData
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .map(item => ({
              id: item.id,
              nome: item.nome_completo || `Colaborador ${item.id}`,
              dominioCritico: getDominioCritico(item),
              dataAvaliacao: new Date(item.created_at || Date.now()).toLocaleDateString('pt-BR'),
              setor: item.area_setor || 'N/A',
              empresa: item.empresa_id || 'N/A'
            }))
          setAllColaboradores(todosColaboradores)
          console.log('👥 Colaboradores processados:', todosColaboradores.length)

          // Top 3 riscos
          const riscos = averages
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 3)
            .map((domain) => ({
              nome: domain.nome,
              valor: domain.valor,
              nivel: domain.valor > 70 ? 'Alto' : domain.valor > 50 ? 'Médio' : 'Baixo',
              acao: getAcaoSugerida(domain.valor)
            }))
          setTopRiscos(riscos)
          console.log('🔥 Top 3 riscos:', riscos)
        } else {
          console.log('📭 Nenhum dado encontrado - resetando valores')
          // Resetar valores quando não há dados
          setIsesoGeral(0)
          setTotalColaboradores(0)
          setSetoresCriticos(0)
          setUltimaAtualizacao('')
          setTopRiscos([])
          setAllColaboradores([])
        }
      } catch (error) {
        console.error('❌ Erro ao processar dados no Dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    processData()
  }, [filteredData])

  const getDominioCritico = (item: any) => {
    console.log('🔍 getDominioCritico - Item:', item)
    
    // Primeiro, tentar usar os campos de média calculada
    const dominios = [
      { nome: 'Demandas Psicológicas', valor: parseFloat((item as any).media_exigencias || '0') },
      { nome: 'Demandas Físicas', valor: parseFloat((item as any).media_organizacao || '0') },
      { nome: 'Demandas de Trabalho', valor: parseFloat((item as any).media_relacoes || '0') },
      { nome: 'Suporte Social e Liderança', valor: parseFloat((item as any).media_interface || '0') },
      { nome: 'Suporte Social', valor: parseFloat((item as any).media_inseguranca || '0') },
      { nome: 'Esforço e Recompensa', valor: parseFloat((item as any).media_significado || '0') },
      { nome: 'Saúde Emocional', valor: parseFloat((item as any).media_bem_estar || '0') },
      { nome: 'Interface Trabalho-Vida', valor: parseFloat((item as any).media_interface || '0') }
    ]
    
    // Se não temos médias calculadas, usar campos individuais
    if (dominios.every(d => d.valor === 0)) {
      console.log('⚠️ Usando campos individuais para domínio crítico')
      const dominiosIndividuais = [
        { nome: 'Demandas Psicológicas', valor: parseFloat(item.exige_concentracao || '0') },
        { nome: 'Demandas Físicas', valor: parseFloat(item.influencia_no_trabalho || '0') },
        { nome: 'Suporte Social', valor: parseFloat(item.colegas_ajudam || '0') },
        { nome: 'Interface Trabalho-Vida', valor: parseFloat(item.impacto_negativo_vida_pessoal || '0') },
        { nome: 'Esforço e Recompensa', valor: parseFloat(item.trabalho_significativo || '0') },
        { nome: 'Saúde Emocional', valor: parseFloat(item.esgotamento_ao_final_do_dia || '0') }
      ]
      
      const dominioCritico = dominiosIndividuais.reduce((max, dominio) => 
        dominio.valor > max.valor ? dominio : max
      )
      
      console.log('🎯 Domínio crítico (individual):', dominioCritico)
      return dominioCritico.nome
    }
    
    const dominioCritico = dominios.reduce((max, dominio) => 
      dominio.valor > max.valor ? dominio : max
    )
    
    console.log('🎯 Domínio crítico (média):', dominioCritico)
    return dominioCritico.nome
  }

  const getAcaoSugerida = (valor: number) => {
    if (valor > 70) return 'Intervenção Imediata'
    if (valor > 50) return 'Monitoramento'
    return 'Manutenção'
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusColor = (valor: number) => getChakraColorFromISESO(valor)

  const getStatusGradient = (valor: number) => {
    const color = getChakraColorFromISESO(valor)
    switch (color) {
      case 'red': return 'linear(to-r, #FEE2E2, #FECACA)'
      case 'orange': return 'linear(to-r, #FEF3C7, #FDE68A)'
      case 'yellow': return 'linear(to-r, #FEF9C3, #FEF08A)'
      case 'green': return 'linear(to-r, #D1FAE5, #A7F3D0)'
      case 'blue': return 'linear(to-r, #DBEAFE, #BFDBFE)'
      default: return 'linear(to-r, #F3F4F6, #E5E7EB)'
    }
  }

  const getStatusText = (valor: number) => classificarISESOCompleto(valor).nome

  if (loading || filtersLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Text>Carregando dashboard...</Text>
      </VStack>
    )
  }

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentColaboradores = allColaboradores.slice(startIndex, endIndex)
  const totalPages = Math.ceil(allColaboradores.length / itemsPerPage)

  const currentClass = classificarISESOCompleto(isesoGeral)

  return (
    <MotionBox
      id="relatorio-senturi"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VStack spacing={8} align="stretch">
        {/* Estatísticas Rápidas */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
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
                    <FiBarChart2 size={20} />
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
                  Dashboard
                </Badge>
              </HStack>

              <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                {/* ISESO Geral + Tooltip com recomendações */}
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
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
                             bg={`${getChakraColorFromISESO(isesoGeral)}.100`}
                            borderRadius="lg"
                           color={`${getChakraColorFromISESO(isesoGeral)}.600`}
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
                            <Text fontSize="xs" color="gray.500">
                              {classificarISESOCompleto(isesoGeral).descricaoResumida}
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                      
                      <VStack align="end" spacing={1}>
                        <Text 
                          fontSize="5xl" 
                          fontWeight="black" 
                           color={`${getChakraColorFromISESO(isesoGeral)}.600`}
                          lineHeight="1"
                        >
                          {isesoGeral}
                        </Text>
                        <Text fontSize="xs" color={`${getChakraColorFromISESO(isesoGeral)}.500`} fontWeight="medium" textTransform="uppercase">
                          {classificarISESOCompleto(isesoGeral).icone} {classificarISESOCompleto(isesoGeral).nome}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </MotionCard>

                {/* PSQI - Qualidade do Sono */}
                <PSQICard />

                {/* Estatísticas */}
                <HStack spacing={4} flex={1}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: '0 4px 14px -5px rgba(0, 0, 0, 0.08), 0 2px 6px -5px rgba(0, 0, 0, 0.03)'
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

                      </VStack>
                    </CardBody>
                  </MotionCard>

                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: '0 4px 14px -5px rgba(0, 0, 0, 0.08), 0 2px 6px -5px rgba(0, 0, 0, 0.03)'
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

                      </VStack>
                    </CardBody>
                  </MotionCard>

                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: '0 4px 14px -5px rgba(0, 0, 0, 0.08), 0 2px 6px -5px rgba(0, 0, 0, 0.03)'
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

                      </VStack>
                    </CardBody>
                  </MotionCard>
                </HStack>
              </Grid>
            </VStack>
          </CardBody>
        </MotionCard>

        {/* EPS-10 – Estresse Percebido (seção independente abaixo das Estatísticas Rápidas) */}
        <EPS10Card />

        {/* Ações Recomendadas (premium) */}
        <Box w="100%" alignSelf="stretch">
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.005 }}
            boxShadow="xl"
            border="2px solid"
            borderColor={currentClass.cor}
            borderRadius="xl"
            bg={useColorModeValue('gray.50', 'gray.800')}
          >
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
              {/* Cabeçalho */}
              <HStack justify="space-between" align={{ base: 'flex-start', md: 'center' }} flexWrap="wrap" spacing={4}>
                <HStack spacing={4} align="center">
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={useColorModeValue('white', 'gray.700')}
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    color={currentClass.cor}
                  >
                      {(getChakraColorFromISESO(isesoGeral) === 'green' || getChakraColorFromISESO(isesoGeral) === 'blue') ? (
                        <FiCheckCircle size={28} />
                      ) : (
                        <FiAlertTriangle size={28} />
                      )}
                  </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('gray.900', 'gray.100')}>
                        Ações Recomendadas {filters.dominio ? `• ${filters.dominio}` : ''}
                      </Text>
                      <HStack
                        as="span"
                        bg={currentClass.cor}
                        color="white"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="bold"
                        fontSize="md"
                        spacing={2}
                      >
                        {(getChakraColorFromISESO(isesoGeral) === 'red') && <FiAlertOctagon size={16} />}
                        {(getChakraColorFromISESO(isesoGeral) === 'orange') && <FiAlertTriangle size={16} />}
                        {(getChakraColorFromISESO(isesoGeral) === 'yellow') && <FiClock size={16} />}
                        {(getChakraColorFromISESO(isesoGeral) === 'green') && <FiCheckCircle size={16} />}
                        {(getChakraColorFromISESO(isesoGeral) === 'blue') && <FiAward size={16} />}
                        <Text>{currentClass.nome}</Text>
                      </HStack>
                    </VStack>
                </HStack>

                <HStack spacing={2} align="center">
                  <Tooltip label="Ver diretrizes e vínculos com PCMSO e PGR" hasArrow>
                    <Button size="xs" rounded="full" px={3} py={1} fontSize="xs" fontWeight="semibold" bg="blue.600" _hover={{ bg: 'blue.700' }} color="white">
                      PCMSO / PGR
                    </Button>
                  </Tooltip>
                  <Tooltip label="Nível de prioridade para implementação" hasArrow>
                    <Button size="xs" rounded="full" px={3} py={1} fontSize="xs" fontWeight="semibold" bg="yellow.400" color="gray.800">
                      Prioridade {currentClass.pcmsoPgr.prioridade}
                    </Button>
                  </Tooltip>
                </HStack>
              </HStack>

              {/* Descrição curta */}
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
                {currentClass.descricaoExpandida}
              </Text>

              {/* Grid de ações */}
              <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                gap={4}
              >
                {/* Ações Simples */}
                  <Box>
                    <Text fontWeight="bold" color={useColorModeValue('gray.900', 'gray.100')} mb={2}>Ações Simples</Text>
                  <List styleType="disc" listStylePosition="inside" spacing={1}>
                    {currentClass.acoesSimples.map((a, i) => (<ListItem key={i} fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>{a}</ListItem>))}
                  </List>
                </Box>

                {/* Ações Intermediárias */}
                  <Box borderLeft="1px solid" borderColor={useColorModeValue('gray.200', 'gray.700')} pl={4}>
                    <Text fontWeight="bold" color={useColorModeValue('gray.900', 'gray.100')} mb={2}>Ações Intermediárias</Text>
                  <List styleType="disc" listStylePosition="inside" spacing={1}>
                    {currentClass.acoesIntermediarias.map((a, i) => (<ListItem key={i} fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>{a}</ListItem>))}
                  </List>
                </Box>

                {/* Ações Complexas */}
                  <Box borderLeft="1px solid" borderColor={useColorModeValue('gray.200', 'gray.700')} pl={4}>
                    <Text fontWeight="bold" color={useColorModeValue('gray.900', 'gray.100')} mb={2}>Ações Complexas</Text>
                  <List styleType="disc" listStylePosition="inside" spacing={1}>
                    {currentClass.acoesComplexas.map((a, i) => (<ListItem key={i} fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>{a}</ListItem>))}
                  </List>
                </Box>
              </Grid>

              {/* Recomendações específicas por domínio (opcional) */}
              {filters.dominio && (
                <VStack align="stretch" spacing={1}>
                  <Text fontSize="sm" fontWeight="bold">Sugeridas para {filters.dominio}</Text>
                  {(() => {
                    const tri = getTriClassificacaoFromISESO(isesoGeral)
                    const acoes = obterAcoesSugeridas(filters.dominio!, tri)
                    return acoes.length > 0 ? acoes.map((a, i) => (<Text key={i} fontSize="sm">• {a}</Text>)) : (
                      <Text fontSize="sm" color="gray.500">Sem recomendações específicas</Text>
                    )
                  })()}
                </VStack>
              )}

              {/* Rodapé */}
                <Divider borderColor={useColorModeValue('gray.200', 'gray.700')} mt={2} />
              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} fontStyle="italic" pt={2}>
                Integração PCMSO/PGR: {currentClass.pcmsoPgr.integracao} • Reavaliação: {currentClass.pcmsoPgr.frequencia_reavaliacao}
              </Text>
              </VStack>
            </CardBody>
          </MotionCard>
        </Box>

        {/* Top 3 Riscos Críticos */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
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
                        bg: `${getStatusColor(risco.valor)}.500`,
                        borderRadius: '0 2px 2px 0'
                      }}
                    >
                      <CardBody p={5}>
                        <HStack justify="space-between" align="center" spacing={4}>
                          <VStack align="start" spacing={3} flex={1}>
                            <HStack spacing={3} align="center">
                              <Avatar 
                                size="sm" 
                                name={risco.nome}
                                bg={`${getStatusColor(risco.valor)}.100`}
                                color={`${getStatusColor(risco.valor)}.700`}
                              />
                              <VStack align="start" spacing={1}>
                                <Text fontSize="md" fontWeight="bold" color={textColor}>
                                  {risco.nome}
                                </Text>
                                <Badge
                                  size="sm"
                                  bgGradient={getStatusGradient(risco.valor)}
                                  color={`${getStatusColor(risco.valor)}.800`}
                                  fontWeight="semibold"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  {getStatusText(risco.valor).toUpperCase()}
                                </Badge>
                              </VStack>
                            </HStack>
                            
                            <HStack spacing={4} fontSize="sm" color="gray.500">
                              <HStack spacing={2}>
                                <FiActivity size={16} />
                                <Text fontWeight="medium">ISESO: {risco.valor}</Text>
                              </HStack>
                              <HStack spacing={2}>
                                <FiTarget size={16} />
                                <Text fontWeight="medium">{risco.acao}</Text>
                              </HStack>
                            </HStack>
                          </VStack>
                          
                          <VStack align="end" spacing={1}>
                            <Text 
                              fontSize="4xl" 
                              fontWeight="black" 
                              color={`${getStatusColor(risco.valor)}.600`}
                              lineHeight="1"
                            >
                              {risco.valor}
                            </Text>
                            <Text 
                              fontSize="xs" 
                              color={`${getStatusColor(risco.valor)}.500`}
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
        </MotionCard>

        {/* Colaboradores */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
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
                  {allColaboradores.length}
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
                        bg: 'blue.500',
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
                                bg="blue.100"
                                color="blue.700"
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
                                <FiActivity size={16} />
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
                              bgGradient="linear(to-r, #D1FAE5, #A7F3D0)"
                              color="green.800"
                              fontWeight="semibold"
                              px={3}
                              py={1}
                              borderRadius="full"
                            >
                              AVALIADO
                            </Badge>
                            
                            <VStack align="end" spacing={1}>
                              <Text 
                                fontSize="lg" 
                                fontWeight="bold" 
                                color="blue.600"
                                lineHeight="1"
                              >
                                {colaborador.dataAvaliacao}
                              </Text>
                              <Text 
                                fontSize="xs" 
                                color="blue.500"
                                fontWeight="medium"
                                textTransform="uppercase"
                              >
                                Data
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
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </MotionCard>
      </VStack>
    </MotionBox>
  )
}

export default Dashboard 