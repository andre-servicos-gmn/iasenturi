import {
  Box, VStack, HStack, Text, useColorModeValue, Card, CardBody,
  Badge, Button, Grid, Avatar, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure, Table, Thead, Tbody, Tr, Th, Td, ModalFooter, Tag, Icon
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  FiUsers, FiAlertTriangle, FiActivity,
  FiBarChart2, FiTrendingUp, FiCalendar, FiCheckCircle
} from 'react-icons/fi'
import type { IconType } from 'react-icons'
import { calculateDomainAverages } from '@/lib/supabase'
import { classificarISESOCompleto, getChakraColorFromISESO } from '@/lib/utils'
import { useFilters } from '@/contexts/store'
import { useState, useEffect, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import PSQICard from './PSQICard'
import EPS10Card from './EPS10Card'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

type HighlightStat = {
  id: string
  label: string
  value: string
  helper: string
  icon: IconType
  accent: string
}

const formatNumberBR = (value: number) => new Intl.NumberFormat('pt-BR').format(value)

const Dashboard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  const alternateBg = useColorModeValue('gray.50', 'gray.700')
  const heroBg = useColorModeValue('linear(135deg, #EEF2FF 0%, #E0EAFF 100%)', 'linear(135deg, rgba(13,36,155,0.45) 0%, rgba(15,23,42,0.85) 100%)')
  const heroBorder = useColorModeValue('rgba(13,36,155,0.2)', 'rgba(255,255,255,0.15)')
  const statBg = useColorModeValue('rgba(255,255,255,0.95)', 'rgba(15,23,42,0.5)')
  const statBorder = useColorModeValue('rgba(226,232,240,0.8)', 'rgba(255,255,255,0.1)')
  const statTextColor = useColorModeValue('gray.500', 'gray.300')
  const iconBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.200')
  const heroHeadingColor = useColorModeValue('gray.900', 'white')
  const heroTextMuted = useColorModeValue('gray.600', 'gray.200')
  const ghostHoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.200')
  const { filteredData, loading: filtersLoading } = useFilters()

  const [isesoGeral, setIsesoGeral] = useState(0)
  const [totalColaboradores, setTotalColaboradores] = useState(0)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('')
  const [loading, setLoading] = useState(true)

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [allColaboradores, setAllColaboradores] = useState<any[]>([])
  const [criticalColaboradores, setCriticalColaboradores] = useState<any[]>([])
  const criticalModal = useDisclosure()
  const criticalCount = criticalColaboradores.length
  const heroClassification = useMemo(() => classificarISESOCompleto(Math.max(isesoGeral || 0, 0)), [isesoGeral])
  const heroColorScheme = getChakraColorFromISESO(isesoGeral || 0)
  const lastUpdateText = ultimaAtualizacao || 'Sem registro'
  const highlightStats = useMemo<HighlightStat[]>(() => [
    {
      id: 'colaboradores',
      label: 'Colaboradores ativos',
      value: formatNumberBR(totalColaboradores),
      helper: 'respondentes filtrados',
      icon: FiUsers,
      accent: 'blue.500'
    },
    {
      id: 'criticos',
      label: 'Em risco critico',
      value: formatNumberBR(criticalCount),
      helper: 'ISESO <= 39',
      icon: FiAlertTriangle,
      accent: 'red.500'
    },
    {
      id: 'iseso',
      label: 'ISESO medio',
      value: isesoGeral > 0 ? `${isesoGeral}` : '--',
      helper: heroClassification.nome,
      icon: FiTrendingUp,
      accent: `${heroColorScheme}.400`
    },
    {
      id: 'atualizacao',
      label: 'Ultima atualizacao',
      value: lastUpdateText,
      helper: lastUpdateText === 'Sem registro' ? 'aguardando primeira coleta' : 'dados mais recentes',
      icon: FiCalendar,
      accent: 'purple.500'
    }
  ], [totalColaboradores, criticalCount, heroClassification.nome, heroColorScheme, lastUpdateText, isesoGeral])

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

          // (removido) cálculo de setores críticos

          // Última atualização
          const ultimaData = new Date(Math.max(...filteredData.map(item => new Date(item.created_at || Date.now()).getTime())))
          setUltimaAtualizacao(ultimaData.toLocaleDateString('pt-BR'))
          console.log('📅 Última atualização:', ultimaData.toLocaleDateString('pt-BR'))

          // Utilitário: calcular ISESO de um item
          const computeISESO = (item: any): number | null => {
            const isesoRaw = (item as any).iseso
            const isesoNum = isesoRaw ? parseFloat(isesoRaw) : NaN
            if (!isNaN(isesoNum) && isesoNum > 0) return Math.round(isesoNum)
            const medias = [
              parseFloat((item as any).media_exigencias || '0'),
              parseFloat((item as any).media_organizacao || '0'),
              parseFloat((item as any).media_relacoes || '0'),
              parseFloat((item as any).media_interface || '0'),
              parseFloat((item as any).media_significado || '0'),
              parseFloat((item as any).media_inseguranca || '0'),
              parseFloat((item as any).saude_emocional || '0')
            ].filter(v => !isNaN(v) && v > 0)
            if (medias.length === 0) return null
            return Math.round(medias.reduce((a, b) => a + b, 0) / medias.length)
          }

          // Todos os colaboradores para paginação
          const todosColaboradores = filteredData
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .map(item => ({
              id: item.id,
              nome: item.nome_completo || `Colaborador ${item.id}`,
              dominioCritico: getDominioCritico(item),
              dominioFavoravel: getDominioFavoravel(item),
              dataAvaliacao: new Date(item.created_at || Date.now()).toLocaleDateString('pt-BR'),
              setor: item.area_setor || 'N/A',
              empresa: item.empresa_id || 'N/A',
              iseso: computeISESO(item)
            }))
          setAllColaboradores(todosColaboradores)
          // Resetar paginação ao atualizar lista filtrada
          setCurrentPage(1)
          console.log('👥 Colaboradores processados:', todosColaboradores.length)

          // Colaboradores críticos por ISESO (≤ 39)

          const criticosList = filteredData
            .map(item => ({ item, iseso: computeISESO(item) }))
            .filter(x => x.iseso !== null && (x.iseso as number) <= 39)
            .map(x => ({
              id: (x.item as any).id,
              nome: (x.item as any).nome_completo || `Colaborador ${(x.item as any).id}`,
              setor: (x.item as any).area_setor || 'N/A',
              iseso: x.iseso as number,
              data: new Date((x.item as any).created_at || Date.now()).toLocaleDateString('pt-BR')
            }))
          setCriticalColaboradores(criticosList)

          // (removido) cálculo de top 3 riscos
        } else {
          console.log('📭 Nenhum dado encontrado - resetando valores')
          // Resetar valores quando não há dados
          setIsesoGeral(0)
          setTotalColaboradores(0)
          setUltimaAtualizacao('')

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
      { nome: 'Esforço e Recompensa', valor: parseFloat((item as any).media_significado || '0') },
      { nome: 'Interface Trabalho-Vida', valor: parseFloat((item as any).media_inseguranca || '0') },
      { nome: 'Saúde Emocional', valor: parseFloat((item as any).saude_emocional || '0') }
    ]

    // Se não temos médias calculadas, usar campos individuais
    if (dominios.every(d => d.valor === 0)) {
      console.log('⚠️ Usando campos individuais para domínio crítico')
      const dominiosIndividuais = [
        { nome: 'Demandas Psicológicas', valor: parseFloat(item.exige_concentracao || '0') },
        { nome: 'Demandas Físicas', valor: parseFloat(item.influencia_no_trabalho || '0') },
        { nome: 'Demandas de Trabalho', valor: parseFloat(item.colegas_ajudam || '0') },
        { nome: 'Suporte Social e Liderança', valor: parseFloat(item.impacto_negativo_vida_pessoal || '0') },
        { nome: 'Esforço e Recompensa', valor: parseFloat(item.trabalho_significativo || '0') },
        { nome: 'Interface Trabalho-Vida', valor: parseFloat(item.esgotamento_ao_final_do_dia || '0') }
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

  const getDominioFavoravel = (item: any) => {
    console.log('🔍 getDominioFavoravel - Item:', item)

    // Primeiro, tentar usar os campos de média calculada
    const dominios = [
      { nome: 'Demandas Psicológicas', valor: parseFloat((item as any).media_exigencias || '0') },
      { nome: 'Demandas Físicas', valor: parseFloat((item as any).media_organizacao || '0') },
      { nome: 'Demandas de Trabalho', valor: parseFloat((item as any).media_relacoes || '0') },
      { nome: 'Suporte Social e Liderança', valor: parseFloat((item as any).media_interface || '0') },
      { nome: 'Esforço e Recompensa', valor: parseFloat((item as any).media_significado || '0') },
      { nome: 'Interface Trabalho-Vida', valor: parseFloat((item as any).media_inseguranca || '0') },
      { nome: 'Saúde Emocional', valor: parseFloat((item as any).saude_emocional || '0') }
    ]

    // Se não temos médias calculadas, usar campos individuais
    if (dominios.every(d => d.valor === 0)) {
      console.log('⚠️ Usando campos individuais para domínio favorável')
      const dominiosIndividuais = [
        { nome: 'Demandas Psicológicas', valor: parseFloat(item.exige_concentracao || '0') },
        { nome: 'Demandas Físicas', valor: parseFloat(item.influencia_no_trabalho || '0') },
        { nome: 'Demandas de Trabalho', valor: parseFloat(item.colegas_ajudam || '0') },
        { nome: 'Suporte Social e Liderança', valor: parseFloat(item.impacto_negativo_vida_pessoal || '0') },
        { nome: 'Esforço e Recompensa', valor: parseFloat(item.trabalho_significativo || '0') },
        { nome: 'Interface Trabalho-Vida', valor: parseFloat(item.esgotamento_ao_final_do_dia || '0') }
      ]

      // Filtrar domínios com valores válidos e pegar o com menor valor (mais favorável)
      const dominiosValidos = dominiosIndividuais.filter(d => d.valor > 0)
      if (dominiosValidos.length === 0) return null

      const dominioFavoravel = dominiosValidos.reduce((min, dominio) =>
        dominio.valor < min.valor ? dominio : min
      )

      console.log('🎯 Domínio favorável (individual):', dominioFavoravel)
      return dominioFavoravel.nome
    }

    // Filtrar domínios com valores válidos e pegar o com menor valor (mais favorável)
    const dominiosValidos = dominios.filter(d => d.valor > 0)
    if (dominiosValidos.length === 0) return null

    const dominioFavoravel = dominiosValidos.reduce((min, dominio) =>
      dominio.valor < min.valor ? dominio : min
    )

    console.log('🎯 Domínio favorável (média):', dominioFavoravel)
    return dominioFavoravel.nome
  }

  // (removido) getAcaoSugerida

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusColor = (valor: number) => getChakraColorFromISESO(valor)

  const getStatusGradient = (valor: number) => {
    const color = getChakraColorFromISESO(valor)
    switch (color) {
      case 'red': return 'linear(to-r, #E53935, #C62828)' // Crítico - vermelho técnico
      case 'orange': return 'linear(to-r, #E17055, #D35400)' // Vulnerável - laranja forte
      case 'yellow': return 'linear(to-r, #FDCB6E, #F39C12)' // Moderado - amarelo claro
      case 'green': return 'linear(to-r, #00C4A7, #00A085)' // Saudável - verde turquesa
      case 'blue': return 'linear(to-r, #1A45FC, #1565C0)' // Excelente - azul vibrante
      default: return 'linear(to-r, #B6BEC6, #9CA3AF)' // Cinza gelo
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

  return (
    <>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VStack spacing={8} align="stretch">
          <Box
            w="full"
            bg={heroBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={heroBorder}
            p={{ base: 6, md: 8 }}
            boxShadow="0 20px 45px rgba(15, 23, 42, 0.08)"
          >
            <VStack align="stretch" spacing={6}>
              <HStack
                spacing={8}
                align={{ base: 'flex-start', md: 'center' }}
                justify="space-between"
                flexDir={{ base: 'column', md: 'row' }}
              >
                <VStack align="flex-start" spacing={3} flex={1}>
                  <Badge
                    colorScheme={heroColorScheme}
                    borderRadius="full"
                    px={4}
                    py={1}
                    fontSize="sm"
                  >
                    Status atual: {heroClassification.nome}
                  </Badge>
                  <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={heroHeadingColor}>
                    Panorama geral do bem-estar
                  </Text>
                  <Text color={heroTextMuted} maxW="3xl">
                    {heroClassification.descricaoResumida || 'Aguardando coleta de dados para calcular o índice geral.'}
                  </Text>
                </VStack>
                <VStack spacing={3} align={{ base: 'flex-start', md: 'flex-end' }}>
                  <Text fontSize="sm" color={heroTextMuted}>
                    ISESO geral:
                  </Text>
                  <Text fontSize={{ base: '4xl', md: '5xl' }} fontWeight="extrabold" color={heroHeadingColor}>
                    {isesoGeral > 0 ? isesoGeral : '--'}
                  </Text>
                  <HStack spacing={3} flexWrap="wrap">
                    <Button
                      as={RouterLink}
                      to="/mapa-calor"
                      size="sm"
                      colorScheme={heroColorScheme}
                      rightIcon={<FiTrendingUp />}
                    >
                      Ver mapa de calor
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/historico"
                      size="sm"
                      variant="ghost"
                      color={heroHeadingColor}
                      leftIcon={<FiCalendar />}
                      _hover={{ bg: ghostHoverBg }}
                    >
                      Historico
                    </Button>
                  </HStack>
                </VStack>
              </HStack>

              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                {highlightStats.map((stat) => (
                  <Box
                    key={stat.id}
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={statBorder}
                    bg={statBg}
                    boxShadow="0 8px 30px rgba(15, 23, 42, 0.08)"
                  >
                    <HStack spacing={4} align="flex-start">
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={iconBg}
                        color={stat.accent}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={stat.icon} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel fontSize="sm" textTransform="uppercase" letterSpacing="wide" color={statTextColor}>
                          {stat.label}
                        </StatLabel>
                        <StatNumber fontSize="2xl" color={heroHeadingColor}>
                          {stat.value}
                        </StatNumber>
                        <StatHelpText color={statTextColor}>{stat.helper}</StatHelpText>
                      </Stat>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Estatísticas Rápidas */}
          <MotionCard id="risk-distribution-chart"
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
                      bg="senturi.azulProfundo"
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
                    bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
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

                  {/* (removido) PSQI será exibido abaixo ao lado do EPS */}

                  {/* Estatísticas */}
                  <HStack id="timeline-chart" spacing={4} flex={1}>
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
                            bg="senturi.colaboradores"
                            borderRadius="lg"
                            color="white"
                          >
                            <FiUsers size={20} />
                          </Box>
                          <VStack spacing={1} align="center">
                            <Text fontSize="2xl" fontWeight="black" color="blue.700">
                              {totalColaboradores}
                            </Text>
                            <Text fontSize="sm" fontWeight="medium" color="senturi.primaria">
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
                      cursor="pointer"
                      onClick={criticalModal.onOpen}
                    >
                      <CardBody p={4}>
                        <VStack spacing={3} align="center">
                          <Box
                            p={2}
                            bg="senturi.criticos"
                            borderRadius="lg"
                            color="white"
                          >
                            <FiAlertTriangle size={20} />
                          </Box>
                          <VStack spacing={1} align="center">
                            <Text fontSize="2xl" fontWeight="black" color="red.700">{criticalColaboradores.length}</Text>
                            <Text fontSize="sm" fontWeight="medium" color="senturi.criticos">
                              Críticos
                            </Text>
                          </VStack>
                          <Button
                            size="xs"
                            rounded="full"
                            px={3}
                            py={1}
                            color="white"
                            bg="senturi.criticos"
                            _hover={{ bg: 'red.700' }}
                            leftIcon={<FiAlertTriangle size={14} />}
                            onClick={(e) => { e.stopPropagation(); criticalModal.onOpen(); }}
                          >
                            Ver críticos
                          </Button>

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
                            bg="senturi.ultimaAtualizacao"
                            borderRadius="lg"
                            color="senturi.primaria"
                          >
                            <FiCalendar size={20} />
                          </Box>
                          <VStack spacing={1} align="center">
                            <Text fontSize="lg" fontWeight="black" color="green.700">
                              {ultimaAtualizacao}
                            </Text>
                            <Text fontSize="sm" fontWeight="medium" color="senturi.primaria">
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

          {/* EPS-10 e PSQI (seção abaixo das Estatísticas Rápidas) */}
          <Grid id="gauge-charts-container" templateColumns="repeat(auto-fit, minmax(320px, 1fr))" gap={6}>
            <EPS10Card />
            <PSQICard />
          </Grid>



          {/* Domínios: crítico, moderado e favorável (lado a lado) */}
          <Grid templateColumns="repeat(auto-fit, minmax(320px, 1fr))" gap={6}>
            {/* Domínios Críticos (abaixo de 55%) */}
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
                        bg="senturi.azulProfundo"
                        borderRadius="lg"
                        color="white"
                      >
                        <FiTrendingUp size={20} />
                      </Box>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Domínios Críticos (ISESO &lt; 55%)
                      </Text>
                    </HStack>
                    <Badge
                      variant="premium"
                      bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
                      color="white"
                    >
                      ISESO
                    </Badge>
                  </HStack>

                  {(() => {
                    const allDomainAverages = calculateDomainAverages(filteredData as any[])
                    const riskyDomains = allDomainAverages
                      .filter(d => d.valor > 0 && d.valor < 55)
                      .sort((a, b) => a.valor - b.valor)
                    return riskyDomains.length > 0 ? (
                      <VStack spacing={4} align="stretch">
                        {riskyDomains.map((risco, index) => (
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
                    )
                  })()}
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Domínios Moderados (55% a 70%) */}
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
                        bg="senturi.azulProfundo"
                        borderRadius="lg"
                        color="white"
                      >
                        <FiTrendingUp size={20} />
                      </Box>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Domínios Moderados (ISESO 55% - 70%)
                      </Text>
                    </HStack>
                    <Badge
                      variant="premium"
                      bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
                      color="white"
                    >
                      ISESO
                    </Badge>
                  </HStack>

                  {(() => {
                    const allDomainAverages = calculateDomainAverages(filteredData as any[])
                    const moderateDomains = allDomainAverages
                      .filter(d => d.valor >= 55 && d.valor < 70)
                      .sort((a, b) => a.valor - b.valor)
                    return moderateDomains.length > 0 ? (
                      <VStack spacing={4} align="stretch">
                        {moderateDomains.map((moderate, index) => (
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
                              bg: `${getStatusColor(moderate.valor)}.500`,
                              borderRadius: '0 2px 2px 0'
                            }}
                          >
                            <CardBody p={5}>
                              <HStack justify="space-between" align="center" spacing={4}>
                                <VStack align="start" spacing={3} flex={1}>
                                  <HStack spacing={3} align="center">
                                    <Avatar
                                      size="sm"
                                      name={moderate.nome}
                                      bg={`${getStatusColor(moderate.valor)}.100`}
                                      color={`${getStatusColor(moderate.valor)}.700`}
                                    />
                                    <VStack align="start" spacing={1}>
                                      <Text fontSize="md" fontWeight="bold" color={textColor}>
                                        {moderate.nome}
                                      </Text>
                                      <Badge
                                        size="sm"
                                        bgGradient={getStatusGradient(moderate.valor)}
                                        color={`${getStatusColor(moderate.valor)}.800`}
                                        fontWeight="semibold"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                      >
                                        {getStatusText(moderate.valor).toUpperCase()}
                                      </Badge>
                                    </VStack>
                                  </HStack>

                                  <HStack spacing={4} fontSize="sm" color="gray.500">
                                    <HStack spacing={2}>
                                      <FiActivity size={16} />
                                      <Text fontWeight="medium">ISESO: {moderate.valor}</Text>
                                    </HStack>

                                  </HStack>
                                </VStack>

                                <VStack align="end" spacing={1}>
                                  <Text
                                    fontSize="4xl"
                                    fontWeight="black"
                                    color={`${getStatusColor(moderate.valor)}.600`}
                                    lineHeight="1"
                                  >
                                    {moderate.valor}
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    color={`${getStatusColor(moderate.valor)}.500`}
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
                        <Text color="gray.500">Nenhum domínio moderado encontrado</Text>
                      </Box>
                    )
                  })()}
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Domínios Favoráveis (acima de 70%) */}
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
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
                        bg="senturi.azulProfundo"
                        borderRadius="lg"
                        color="white"
                      >
                        <FiTrendingUp size={20} />
                      </Box>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Domínios Favoráveis (ISESO ≥ 70%)
                      </Text>
                    </HStack>
                    <Badge
                      variant="premium"
                      bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
                      color="white"
                    >
                      ISESO
                    </Badge>
                  </HStack>

                  {(() => {
                    const allDomainAverages = calculateDomainAverages(filteredData as any[])
                    const bestDomains = allDomainAverages
                      .filter(d => d.valor >= 70)
                      .sort((a, b) => b.valor - a.valor)
                    return bestDomains.length > 0 ? (
                      <VStack spacing={4} align="stretch">
                        {bestDomains.map((dom, index) => (
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
                              bg: `${getStatusColor(dom.valor)}.500`,
                              borderRadius: '0 2px 2px 0'
                            }}
                          >
                            <CardBody p={5}>
                              <HStack justify="space-between" align="center" spacing={4}>
                                <VStack align="start" spacing={3} flex={1}>
                                  <HStack spacing={3} align="center">
                                    <Avatar
                                      size="sm"
                                      name={dom.nome}
                                      bg={`${getStatusColor(dom.valor)}.100`}
                                      color={`${getStatusColor(dom.valor)}.700`}
                                    />
                                    <VStack align="start" spacing={1}>
                                      <Text fontSize="md" fontWeight="bold" color={textColor}>
                                        {dom.nome}
                                      </Text>
                                      <Badge
                                        size="sm"
                                        bgGradient={getStatusGradient(dom.valor)}
                                        color={`${getStatusColor(dom.valor)}.800`}
                                        fontWeight="semibold"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                      >
                                        {getStatusText(dom.valor).toUpperCase()}
                                      </Badge>
                                    </VStack>
                                  </HStack>
                                  <HStack spacing={4} fontSize="sm" color="gray.500">
                                    <HStack spacing={2}>
                                      <FiActivity size={16} />
                                      <Text fontWeight="medium">ISESO: {dom.valor}</Text>
                                    </HStack>
                                  </HStack>
                                </VStack>
                                <VStack align="end" spacing={1}>
                                  <Text
                                    fontSize="4xl"
                                    fontWeight="black"
                                    color={`${getStatusColor(dom.valor)}.600`}
                                    lineHeight="1"
                                  >
                                    {dom.valor}
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    color={`${getStatusColor(dom.valor)}.500`}
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
                        <Text color="gray.500">Nenhum domínio acima de 70%</Text>
                      </Box>
                    )
                  })()}
                </VStack>
              </CardBody>
            </MotionCard>
          </Grid>

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
                      bg="senturi.azulProfundo"
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
                    bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
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
                                {colaborador.dominioFavoravel && (
                                  <HStack spacing={2} color="green.600">
                                    <FiCheckCircle size={16} />
                                    <Text fontWeight="medium">{colaborador.dominioFavoravel}</Text>
                                  </HStack>
                                )}
                              </HStack>
                              {colaborador.iseso !== null && (
                                <HStack spacing={2}>
                                  <Text
                                    fontWeight="medium"
                                    color={`${getStatusColor(colaborador.iseso)}.600`}
                                  >
                                    ISESO: {colaborador.iseso}
                                  </Text>
                                  <Badge
                                    colorScheme={getStatusColor(colaborador.iseso)}
                                    variant="subtle"
                                    px={2}
                                    py={1}
                                    borderRadius="full"
                                  >
                                    {getStatusText(colaborador.iseso).toUpperCase()}
                                  </Badge>
                                </HStack>
                              )}
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

      {/* Modal de Colaboradores Críticos */}
      <Modal isOpen={criticalModal.isOpen} onClose={criticalModal.onClose} size="2xl" isCentered>
        <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.400" />
        <ModalContent borderRadius="2xl" overflow="hidden" border="1px solid" borderColor={borderColor}>
          <ModalHeader p={4} bg={useColorModeValue('red.50', 'red.900')} borderBottom="1px solid" borderColor={useColorModeValue('red.100', 'red.800')}>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Box p={2} bg={useColorModeValue('red.100', 'red.800')} borderRadius="lg" color={useColorModeValue('red.700', 'red.200')}>
                  <FiAlertTriangle size={18} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">Colaboradores com ISESO Crítico</Text>
                  <Text fontSize="xs" color={useColorModeValue('red.700', 'red.200')}>{criticalColaboradores.length} encontrados</Text>
                </VStack>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0}>
            {criticalColaboradores.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.500">Nenhum colaborador crítico encontrado.</Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table size="sm" variant="simple">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>Nome</Th>
                      <Th>Setor</Th>
                      <Th isNumeric>ISESO</Th>
                      <Th>Data</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {criticalColaboradores.map((c) => (
                      <Tr key={c.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={c.nome} bg="red.100" color="red.700" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{c.nome}</Text>
                              <Text fontSize="xs" color="gray.500">ID: {c.id}</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Tag colorScheme="red" variant="subtle">{c.setor}</Tag>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color="red.600">{c.iseso}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">{c.data}</Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor={borderColor} bg={useColorModeValue('gray.50', 'gray.800')}>
            <HStack w="100%" justify="space-between">
              <Text fontSize="xs" color="gray.500">Dica: clique em um nome para ver mais detalhes (em breve)</Text>
              <HStack>
                <Button variant="ghost" onClick={criticalModal.onClose}>Fechar</Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default Dashboard 
