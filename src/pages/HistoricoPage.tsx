import {
  Box, VStack, HStack, Text, useColorModeValue, Grid, Card, CardBody,
  Badge, Icon, useDisclosure, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, Input, Textarea, Select, Checkbox, useToast,
  Tabs, TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  FiTrendingUp, FiTarget, FiCheckCircle,
  FiBarChart2,
  FiInfo, FiHelpCircle, FiMapPin, FiCalendar, FiUser, FiSettings, FiDollarSign,
  FiEdit2, FiTrash2
} from 'react-icons/fi'
import { useFilters } from '@/contexts/store'
import { useState, useEffect, useMemo } from 'react'
import { createIntervencao, fetchEmpresas, updateIntervencaoResultado, updateIntervencao, deleteIntervencao, fetchTopicos, createTopico, deleteTopico, fetchDadosHistoricos } from '@/lib/supabase'
import { Intervencao as IntervencaoDB, Empresa, Topico } from '@/types'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
)

const MotionBox = motion(Box)
const MotionCard = motion(Card)

interface HistoricoData {
  periodo: string
  dataFormatada: string
  dominios: { [key: string]: number }
  totalColaboradores: number
  intervencoes?: UIIntervencao[]
}

interface UIIntervencao {
  tipo: string
  titulo?: string
  descricao: string
  data: string
  resultadoEsperado: string
  resultadoObservado: string
  impacto: 'positivo' | 'negativo' | 'neutro'
  status?: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada'
  empresa_id?: string
  responsavel?: string
  dominios_afetados?: string[]
  custo?: number
  setor?: string
  topicos?: string[]
}

interface DadosGrafico {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension: number
    pointBackgroundColor: string
    pointBorderColor: string
    pointBorderWidth: number
    pointRadius: number
    pointHoverRadius: number
  }[]
}

const HistoricoPage = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { loading: filtersLoading, filters } = useFilters()
  const [historicoData, setHistoricoData] = useState<HistoricoData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntervencao, setSelectedIntervencao] = useState<(UIIntervencao & { id?: string }) | null>(null)
  const intervencaoModal = useDisclosure()
  const addModal = useDisclosure()
  const editModal = useDisclosure()
  const deleteModal = useDisclosure()
  const toast = useToast()
  const [refreshKey, setRefreshKey] = useState(0)
  const [intervencoesFlat, setIntervencoesFlat] = useState<(UIIntervencao & { id?: string })[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [topicos, setTopicos] = useState<Topico[]>([])
  const empresaNomeById = useMemo(() => {
    const map: Record<string, string> = {}
    empresas.forEach(e => { if (e.id) map[e.id] = e.nome })
    return map
  }, [empresas])
  const topicoById = useMemo(() => {
    const map: Record<string, Topico> = {}
    topicos.forEach(t => { map[t.id] = t })
    return map
  }, [topicos])

  useEffect(() => {
    fetchEmpresas().then(setEmpresas).catch(() => { })
    fetchTopicos().then(setTopicos).catch(() => { })
  }, [])

  // Estado do formulário de criação de intervenção
  const [formData, setFormData] = useState({
    empresa_id: '',
    setor: '',
    tipo: '',
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    status: 'planejada' as 'planejada' | 'em_andamento' | 'concluida' | 'cancelada',
    resultado_esperado: '',
    resultado_observado: '',
    impacto_qualitativo: 'neutro' as 'positivo' | 'negativo' | 'neutro',
    dominios_afetados: [] as string[],
    responsavel: '',
    custo: '' as number | string,
    topicos: [] as string[]
  })

  // Pré-preencher empresa/setor a partir dos filtros globais
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      empresa_id: filters.empresa || prev.empresa_id,
      setor: filters.setor || prev.setor
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.empresa, filters.setor])

  // Cores da nova paleta Senturi para os domínios
  const coresDominios = {
    'Exigências do trabalho': '#E53935',    // Vermelho técnico
    'Demandas Físicas': '#00C4A7',        // Verde turquesa
    'Autonomia e Controle no trabalho': '#1A45FC',    // Azul vibrante
    'Suporte Social e Qualidade da Liderança': '#169DEF', // Azul claro
    'Esforço e Recompensa': '#FDCB6E',    // Amarelo claro
    'Equilíbrio Trabalho - Vida': '#E17055', // Laranja forte
    'Saúde Emocional e Bem-Estar': '#0D249B'          // Azul escuro
  }

  // Intervenções simuladas removidas: agora usamos dados reais vindos do banco via fetchDadosHistoricos

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true)
        // Buscar ciclos agregados por datas de avaliações (trimestres)
        const ciclos = await fetchDadosHistoricos({
          empresa_id: filters.empresa || undefined,
          setor: filters.setor || undefined,
          periodo_inicio: filters.dataInicio || undefined,
          periodo_fim: filters.dataFim || undefined
        })

        // Função utilitária para mapear intervenção do banco para UI
        const toUI = (i: IntervencaoDB): UIIntervencao & { id?: string } => ({
          id: i.id,
          tipo: i.tipo,
          titulo: i.titulo,
          descricao: i.descricao,
          data: new Date(i.data_inicio).toLocaleDateString('pt-BR'),
          resultadoEsperado: i.resultado_esperado,
          resultadoObservado: i.resultado_observado || '',
          impacto: (i.impacto_qualitativo || 'neutro') as UIIntervencao['impacto'],
          status: i.status,
          empresa_id: i.empresa_id,
          responsavel: i.responsavel,
          dominios_afetados: i.dominios_afetados,
          custo: i.custo,
          setor: i.setor,
          topicos: i.topicos
        })

        // Transformar ciclos para o formato usado pelo gráfico
        const historico = (ciclos || []).map((c) => ({
          periodo: c.ciclo.id,
          dataFormatada: c.ciclo.nome,
          dominios: c.ciclo.dominios_medios as { [key: string]: number },
          totalColaboradores: c.ciclo.total_colaboradores,
          intervencoes: (c.intervencoes || []).map(toUI)
        }))

        // Ordenar por período (id já reflete a ordem, mas garantimos)
        historico.sort((a, b) => a.periodo.localeCompare(b.periodo))

        // Lista plana de intervenções
        const flatList = (ciclos || []).flatMap(c => (c.intervencoes || []).map(toUI))
        setIntervencoesFlat(flatList)

        setHistoricoData(historico)
      } catch (error) {
        console.error('Erro ao processar dados históricos:', error)
      } finally {
        setLoading(false)
      }
    }

    processData()
  }, [filters.empresa, filters.setor, filters.dataInicio, filters.dataFim, refreshKey])

  // Preparar dados para o gráfico
  const dadosGrafico: DadosGrafico = useMemo(() => {
    if (historicoData.length === 0) return { labels: [], datasets: [] }

    const labels = historicoData.map(item => item.dataFormatada)
    const dominios = Array.from(new Set(historicoData.flatMap(item => Object.keys(item.dominios))))

    const datasets = dominios.map(dominio => ({
      label: dominio,
      data: historicoData.map(item => (item.dominios[dominio] ?? 0)),
      borderColor: coresDominios[dominio as keyof typeof coresDominios] || '#666',
      backgroundColor: coresDominios[dominio as keyof typeof coresDominios] || '#666',
      tension: 0.4,
      pointBackgroundColor: coresDominios[dominio as keyof typeof coresDominios] || '#666',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }))

    return { labels, datasets }
  }, [historicoData])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return `Período: ${context[0].label}`
          },
          label: (context: any) => {
            const dataset = context.dataset
            const value = context.parsed.y
            const previousValue = context.dataset.data[context.dataIndex - 1]

            let trend = ''
            if (previousValue !== undefined && previousValue !== 0) {
              const diff = value - previousValue
              const percent = ((diff / previousValue) * 100).toFixed(1)
              trend = diff > 0 ? ` (+${percent}%)` : ` (${percent}%)`
            }

            return `${dataset.label}: ${value}${trend}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Ciclos de Avaliação'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Pontuação dos Domínios (0-100)'
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  }

  // Mantido apenas se necessário no futuro: ícone por impacto





  const getImpactoColor = (impacto: string) => {
    switch (impacto) {
      case 'positivo':
        return 'green'
      case 'negativo':
        return 'red'
      default:
        return 'gray'
    }
  }

  if (loading || filtersLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Text>Carregando dados históricos...</Text>
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
            <FiTrendingUp size={24} color="#0D249B" />
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Evolução Histórica
            </Text>
          </HStack>
          <Text color="gray.500" fontSize="lg">
            Análise temporal dos domínios COPSOQ e intervenções realizadas
          </Text>
        </Box>

        {/* Grid Principal */}
        <Grid
          templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
          gap={6}
          w="full"
          h="full"
          flex={1}
          minH="calc(100vh - 200px)"
        >
          {/* Seção 1 - Gráfico de Linha */}
          <VStack spacing={6} align="stretch" h="full">
            <MotionCard
              variant="premium"
              h="full"
              w="full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <CardBody p={{ base: 4, md: 6 }} h="full" display="flex" flexDirection="column">
                <VStack spacing={4} align="stretch" h="full">
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <FiBarChart2 size={20} color="#0D249B" />
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Timeline dos Domínios COPSOQ
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {historicoData.length} ciclos avaliados
                    </Text>
                  </HStack>

                  {historicoData.length > 0 ? (
                    <Box h="400px" w="full" flex={1}>
                      <Line data={dadosGrafico} options={options} />
                    </Box>
                  ) : (
                    <Box textAlign="center" py={8} flex={1} display="flex" alignItems="center" justifyContent="center">
                      <Text color="gray.500">Nenhum dado histórico disponível</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </MotionCard>
          </VStack>

          {/* Seção 2 - Intervenções */}
          <VStack spacing={6} align="stretch" h="full">
            <MotionCard
              variant="premium"
              h="full"
              w="full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardBody p={{ base: 4, md: 6 }} h="full" display="flex" flexDirection="column">
                <VStack spacing={4} align="stretch" h="full">
                  <HStack spacing={2} justify="space-between" align="center">
                    <HStack spacing={2}>
                      <FiTarget size={20} color="#0D249B" />
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Intervenções
                      </Text>
                    </HStack>
                    <Button
                      size="md"
                      bgGradient="linear(135deg, #0D249B 0%, #1A45FC 100%)"
                      _hover={{
                        bgGradient: 'linear(135deg, #1A45FC 0%, #0D249B 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(26, 69, 252, 0.4)'
                      }}
                      _active={{
                        transform: 'translateY(0)',
                        boxShadow: '0 2px 8px rgba(26, 69, 252, 0.3)'
                      }}
                      color="white"
                      borderRadius="lg"
                      fontWeight="medium"
                      onClick={addModal.onOpen}
                    >
                      Adicionar Intervenção
                    </Button>
                  </HStack>

                  {intervencoesFlat.length > 0 ? (
                    <Box overflowY="auto" flex={1}>
                      <VStack spacing={3} align="stretch">
                        {intervencoesFlat.map((intervencao, idx) => (
                          <MotionBox
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            p={3}
                            bg="white"
                            _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.200"
                            role="button"
                            tabIndex={0}
                            onClick={() => { setSelectedIntervencao(intervencao); intervencaoModal.onOpen() }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedIntervencao(intervencao); intervencaoModal.onOpen() } }}
                          >
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between" align="center">
                                <HStack spacing={2}>
                                  <Icon as={FiCheckCircle} color={`${getImpactoColor(intervencao.impacto)}.500`} />
                                  <Text fontWeight="semibold" fontSize="sm">
                                    {intervencao.tipo}{intervencao.titulo ? ` - ${intervencao.titulo}` : ''}
                                  </Text>
                                </HStack>
                                <HStack spacing={2}>
                                  {intervencao.empresa_id && (
                                    <Badge colorScheme="purple">{empresaNomeById[intervencao.empresa_id] || intervencao.empresa_id}</Badge>
                                  )}
                                  <Badge colorScheme="gray">{intervencao.data}</Badge>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="blue"
                                    leftIcon={<FiEdit2 />}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedIntervencao(intervencao)
                                      editModal.onOpen()
                                    }}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    leftIcon={<FiTrash2 />}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedIntervencao(intervencao)
                                      deleteModal.onOpen()
                                    }}
                                  >
                                    Excluir
                                  </Button>
                                </HStack>
                              </HStack>
                              <Text fontSize="sm" color={textColor}>
                                {intervencao.descricao}
                              </Text>
                              <HStack spacing={4} fontSize="xs">
                                <VStack align="start" spacing={1}>
                                  <Text color="gray.500">Esperado:</Text>
                                  <Text color="blue.600">{intervencao.resultadoEsperado}</Text>
                                </VStack>
                                <VStack align="start" spacing={1}>
                                  <Text color="gray.500">Observado:</Text>
                                  <Text color="green.600">{intervencao.resultadoObservado}</Text>
                                </VStack>
                              </HStack>
                              {intervencao.topicos && intervencao.topicos.length > 0 && (
                                <HStack spacing={2} wrap="wrap">
                                  <Text fontSize="xs" color="gray.500">Tópicos:</Text>
                                  {intervencao.topicos.map((topicoId) => {
                                    const topico = topicoById[topicoId]
                                    return topico ? (
                                      <Badge
                                        key={topicoId}
                                        size="sm"
                                        colorScheme="purple"
                                        variant="subtle"
                                      >
                                        <HStack spacing={1}>
                                          {topico.cor && (
                                            <Box w={2} h={2} bg={topico.cor} borderRadius="full" />
                                          )}
                                          <Text>{topico.nome}</Text>
                                        </HStack>
                                      </Badge>
                                    ) : null
                                  })}
                                </HStack>
                              )}
                            </VStack>
                          </MotionBox>
                        ))}
                      </VStack>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} flex={1} display="flex" alignItems="center" justifyContent="center">
                      <Text color="gray.500" fontSize="sm">
                        Nenhuma intervenção cadastrada
                      </Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </MotionCard>
          </VStack>
        </Grid>
      </VStack>

      {/* Modal de Detalhes da Intervenção */}
      <Modal isOpen={intervencaoModal.isOpen} onClose={intervencaoModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes da Intervenção</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedIntervencao && (
              <VStack spacing={5} align="stretch">
                <HStack justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={FiCheckCircle} color={`${getImpactoColor(selectedIntervencao.impacto)}.500`} />
                    <Text fontWeight="bold">
                      {selectedIntervencao.tipo}{selectedIntervencao.titulo ? ` - ${selectedIntervencao.titulo}` : ''}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    {selectedIntervencao.empresa_id && (
                      <Badge colorScheme="purple">{empresaNomeById[selectedIntervencao.empresa_id] || selectedIntervencao.empresa_id}</Badge>
                    )}
                    <Badge colorScheme="gray">{selectedIntervencao.data}</Badge>
                    {selectedIntervencao.status && (
                      <Badge colorScheme="blue">{selectedIntervencao.status}</Badge>
                    )}
                  </HStack>
                </HStack>

                {selectedIntervencao.setor && (
                  <HStack>
                    <Text fontSize="sm" color="gray.500">Setor:</Text>
                    <Text fontSize="sm">{selectedIntervencao.setor}</Text>
                  </HStack>
                )}

                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Descrição</Text>
                  <Text fontSize="sm">{selectedIntervencao.descricao}</Text>
                </Box>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Resultado Esperado</Text>
                    <Text fontSize="sm" color="blue.700">{selectedIntervencao.resultadoEsperado}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Resultado Observado</Text>
                    <Text fontSize="sm" color="green.700">{selectedIntervencao.resultadoObservado || '-'}</Text>
                  </Box>
                </Grid>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Responsável</Text>
                    <Text fontSize="sm">{selectedIntervencao.responsavel || '-'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Custo</Text>
                    <Text fontSize="sm">{selectedIntervencao.custo != null ? `R$ ${selectedIntervencao.custo}` : '-'}</Text>
                  </Box>
                </Grid>

                {selectedIntervencao.dominios_afetados && selectedIntervencao.dominios_afetados.length > 0 && (
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={2}>Domínios Afetados</Text>
                    <HStack wrap="wrap" spacing={2}>
                      {selectedIntervencao.dominios_afetados.map((dom) => (
                        <Badge key={dom} colorScheme="gray">{dom}</Badge>
                      ))}
                    </HStack>
                  </Box>
                )}

                {selectedIntervencao.topicos && selectedIntervencao.topicos.length > 0 && (
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={2}>Tópicos</Text>
                    <HStack wrap="wrap" spacing={2}>
                      {selectedIntervencao.topicos.map((topicoId) => {
                        const topico = topicoById[topicoId]
                        return topico ? (
                          <Badge
                            key={topicoId}
                            colorScheme="purple"
                            variant="subtle"
                          >
                            <HStack spacing={1}>
                              {topico.cor && (
                                <Box w={2} h={2} bg={topico.cor} borderRadius="full" />
                              )}
                              <Text>{topico.nome}</Text>
                            </HStack>
                          </Badge>
                        ) : null
                      })}
                    </HStack>
                  </Box>
                )}

                {/* Edição rápida do Resultado Observado */}
                <Divider />
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>Atualizar Resultado Observado</Text>
                  <HStack spacing={3} align="start">
                    <Input
                      placeholder="Ex: Aumento de 8 pts"
                      value={selectedIntervencao.resultadoObservado}
                      onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, resultadoObservado: e.target.value })}
                    />
                    <Button
                      colorScheme="blue"
                      onClick={async () => {
                        if (!selectedIntervencao?.id) return
                        const ok = await updateIntervencaoResultado(selectedIntervencao.id, selectedIntervencao.resultadoObservado || null)
                        if (ok) {
                          toast({ title: 'Resultado observado atualizado', status: 'success' })
                          setRefreshKey((p) => p + 1)
                        } else {
                          toast({ title: 'Falha ao atualizar resultado', status: 'error' })
                        }
                      }}
                    >Salvar</Button>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal Adicionar Intervenção */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.onClose} size="5xl" scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Intervenção (5W2H)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Tabs orientation="vertical" variant="enclosed" colorScheme="blue">
                <HStack align="start" spacing={4}>
                  <TabList
                    minW={{ base: '220px', md: '300px' }}
                    w={{ base: '220px', md: '300px' }}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="lg"
                    p={2}
                    borderWidth="1px"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiInfo />
                        <Text>What - O que</Text>
                      </HStack>
                    </Tab>
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiHelpCircle />
                        <Text>Why - Por quê</Text>
                      </HStack>
                    </Tab>
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiMapPin />
                        <Text>Where - Onde</Text>
                      </HStack>
                    </Tab>
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiCalendar />
                        <Text>When - Quando</Text>
                      </HStack>
                    </Tab>
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiUser />
                        <Text>Who - Quem</Text>
                      </HStack>
                    </Tab>
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiSettings />
                        <Text>How - Como</Text>
                      </HStack>
                    </Tab>
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiDollarSign />
                        <Text>How much - Quanto</Text>
                      </HStack>
                    </Tab>
                    <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                      <HStack spacing={2}>
                        <FiTarget />
                        <Text>Tópicos</Text>
                      </HStack>
                    </Tab>
                  </TabList>
                  <TabPanels flex={1} w="full">
                    {/* WHAT */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={4} wrap="wrap">
                          <Box flex={1} minW="200px">
                            <Text fontSize="sm" mb={1}>Tipo</Text>
                            <Input
                              placeholder="Ex: Workshop, Treinamento"
                              value={formData.tipo}
                              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            />
                          </Box>
                          <Box flex={2} minW="200px">
                            <Text fontSize="sm" mb={1}>Título</Text>
                            <Input
                              placeholder="Título da intervenção"
                              value={formData.titulo}
                              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            />
                          </Box>
                        </HStack>
                        <Box>
                          <Text fontSize="sm" mb={2}>Domínios Afetados</Text>
                          <HStack spacing={4} wrap="wrap">
                            {Object.keys(coresDominios).map((dom) => (
                              <Checkbox
                                key={dom}
                                isChecked={formData.dominios_afetados.includes(dom)}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setFormData(prev => ({
                                    ...prev,
                                    dominios_afetados: checked
                                      ? [...prev.dominios_afetados, dom]
                                      : prev.dominios_afetados.filter(d => d !== dom)
                                  }))
                                }}
                              >
                                {dom}
                              </Checkbox>
                            ))}
                          </HStack>
                        </Box>
                      </VStack>
                    </TabPanel>
                    {/* WHY */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Text fontSize="sm" mb={1}>Justificativa (Why)</Text>
                          <Textarea
                            placeholder="Qual a razão/motivação desta intervenção? Objetivos e resultados esperados."
                            value={formData.resultado_esperado}
                            onChange={(e) => setFormData({ ...formData, resultado_esperado: e.target.value })}
                          />
                        </Box>
                      </VStack>
                    </TabPanel>
                    {/* WHERE */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={4} wrap="wrap">
                          <Box flex={1} minW="200px">
                            <Text fontSize="sm" mb={1}>Empresa ID</Text>
                            <Input
                              placeholder="empresa_id"
                              value={formData.empresa_id}
                              onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                            />
                          </Box>
                          <Box flex={1} minW="200px">
                            <Text fontSize="sm" mb={1}>Setor (opcional)</Text>
                            <Input
                              placeholder="setor"
                              value={formData.setor}
                              onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                            />
                          </Box>
                        </HStack>
                      </VStack>
                    </TabPanel>
                    {/* WHEN */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={4} wrap="wrap">
                          <Box>
                            <Text fontSize="sm" mb={1}>Data Início</Text>
                            <Input
                              type="date"
                              value={formData.data_inicio}
                              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                            />
                          </Box>
                          <Box>
                            <Text fontSize="sm" mb={1}>Data Fim (opcional)</Text>
                            <Input
                              type="date"
                              value={formData.data_fim}
                              onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                            />
                          </Box>
                          <Box minW="200px">
                            <Text fontSize="sm" mb={1}>Status</Text>
                            <Select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            >
                              <option value="planejada">Planejada</option>
                              <option value="em_andamento">Em andamento</option>
                              <option value="concluida">Concluída</option>
                              <option value="cancelada">Cancelada</option>
                            </Select>
                          </Box>
                        </HStack>
                      </VStack>
                    </TabPanel>
                    {/* WHO */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={4} wrap="wrap">
                          <Box flex={1} minW="200px">
                            <Text fontSize="sm" mb={1}>Responsável</Text>
                            <Input
                              placeholder="Nome do responsável"
                              value={formData.responsavel}
                              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                            />
                          </Box>
                          <Box flex={1} minW="200px">
                            <Text fontSize="sm" mb={1}>Impacto Qualitativo</Text>
                            <Select
                              value={formData.impacto_qualitativo}
                              onChange={(e) => setFormData({ ...formData, impacto_qualitativo: e.target.value as any })}
                            >
                              <option value="positivo">Positivo</option>
                              <option value="neutro">Neutro</option>
                              <option value="negativo">Negativo</option>
                            </Select>
                          </Box>
                        </HStack>
                      </VStack>
                    </TabPanel>
                    {/* HOW */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Text fontSize="sm" mb={1}>Plano de Ação (How)</Text>
                          <Textarea
                            placeholder="Como será executada a intervenção? Etapas, recursos, cronograma."
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          />
                        </Box>
                      </VStack>
                    </TabPanel>
                    {/* HOW MUCH */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={4} wrap="wrap">
                          <Box minW="160px">
                            <Text fontSize="sm" mb={1}>Custo (R$) opcional</Text>
                            <Input
                              type="number"
                              value={formData.custo as any}
                              onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                            />
                          </Box>
                          <Box flex={1} minW="200px">
                            <Text fontSize="sm" mb={1}>Resultado Observado (opcional)</Text>
                            <Input
                              placeholder="Ex: Aumento de 8 pts"
                              value={formData.resultado_observado}
                              onChange={(e) => setFormData({ ...formData, resultado_observado: e.target.value })}
                            />
                          </Box>
                        </HStack>
                      </VStack>
                    </TabPanel>
                    {/* TÓPICOS */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        {/* Tópicos Selecionados */}
                        <Box>
                          <Text fontSize="sm" mb={2}>Tópicos Selecionados</Text>
                          {formData.topicos.length > 0 ? (
                            <HStack spacing={2} wrap="wrap">
                              {formData.topicos.map((topicoId) => {
                                const topico = topicos.find(t => t.id === topicoId)
                                return topico ? (
                                  <Badge
                                    key={topicoId}
                                    colorScheme="purple"
                                    variant="subtle"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                  >
                                    <HStack spacing={2}>
                                      {topico.cor && (
                                        <Box w={2} h={2} bg={topico.cor} borderRadius="full" />
                                      )}
                                      <Text>{topico.nome}</Text>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="red"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            topicos: prev.topicos.filter(t => t !== topicoId)
                                          }))
                                        }}
                                      >
                                        ×
                                      </Button>
                                    </HStack>
                                  </Badge>
                                ) : null
                              })}
                            </HStack>
                          ) : (
                            <Text fontSize="sm" color="gray.500">
                              Nenhum tópico selecionado
                            </Text>
                          )}
                        </Box>

                        <Divider />

                        {/* Tópicos Disponíveis */}
                        <Box>
                          <Text fontSize="sm" mb={2}>Tópicos Disponíveis</Text>
                          {topicos.length > 0 ? (
                            <VStack spacing={2} align="stretch">
                              {topicos.map((topico) => (
                                <HStack key={topico.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                  <HStack spacing={3}>
                                    <Checkbox
                                      isChecked={formData.topicos.includes(topico.id)}
                                      onChange={(e) => {
                                        const checked = e.target.checked
                                        setFormData(prev => ({
                                          ...prev,
                                          topicos: checked
                                            ? [...prev.topicos, topico.id]
                                            : prev.topicos.filter(t => t !== topico.id)
                                        }))
                                      }}
                                    />
                                    {topico.cor && (
                                      <Box w={3} h={3} bg={topico.cor} borderRadius="full" />
                                    )}
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="medium">{topico.nome}</Text>
                                      {topico.descricao && (
                                        <Text fontSize="xs" color="gray.600">{topico.descricao}</Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={async () => {
                                      if (confirm(`Tem certeza que deseja excluir o tópico "${topico.nome}"?`)) {
                                        const sucesso = await deleteTopico(topico.id)
                                        if (sucesso) {
                                          toast({ title: 'Tópico excluído com sucesso', status: 'success' })
                                          setTopicos(prev => prev.filter(t => t.id !== topico.id))
                                          setFormData(prev => ({
                                            ...prev,
                                            topicos: prev.topicos.filter(t => t !== topico.id)
                                          }))
                                        } else {
                                          toast({ title: 'Erro ao excluir tópico', status: 'error' })
                                        }
                                      }
                                    }}
                                  >
                                    <FiTrash2 size={12} />
                                  </Button>
                                </HStack>
                              ))}
                            </VStack>
                          ) : (
                            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                              Nenhum tópico cadastrado
                            </Text>
                          )}
                        </Box>

                        <Divider />

                        {/* Criar Novo Tópico */}
                        <Box>
                          <Text fontSize="sm" mb={2}>Criar Novo Tópico</Text>
                          <VStack spacing={3} align="stretch">
                            <HStack spacing={3}>
                              <Box flex={1}>
                                <Input
                                  placeholder="Nome do tópico"
                                  size="sm"
                                  id="novo-topico-nome"
                                />
                              </Box>
                              <Box flex={1}>
                                <Input
                                  placeholder="Descrição (opcional)"
                                  size="sm"
                                  id="novo-topico-descricao"
                                />
                              </Box>
                            </HStack>
                            <HStack spacing={2} align="center">
                              <Text fontSize="xs" color="gray.600">Cor:</Text>
                              {['#E53935', '#E17055', '#FDCB6E', '#00C4A7', '#1A45FC', '#0D249B', '#169DEF', '#B6BEC6', '#FFA07A', '#20B2AA'].map((cor) => (
                                <Box
                                  key={cor}
                                  w={4}
                                  h={4}
                                  bg={cor}
                                  borderRadius="full"
                                  cursor="pointer"
                                  border="2px solid"
                                  borderColor="transparent"
                                  _hover={{ borderColor: 'gray.400' }}
                                  onClick={() => {
                                    const input = document.getElementById('novo-topico-cor') as HTMLInputElement
                                    if (input) input.value = cor
                                  }}
                                />
                              ))}
                              <Input
                                id="novo-topico-cor"
                                placeholder="#000000"
                                size="xs"
                                maxW="80px"
                              />
                            </HStack>
                            <Button
                              size="sm"
                              colorScheme="purple"
                              variant="outline"
                              onClick={async () => {
                                const nomeInput = document.getElementById('novo-topico-nome') as HTMLInputElement
                                const descricaoInput = document.getElementById('novo-topico-descricao') as HTMLInputElement
                                const corInput = document.getElementById('novo-topico-cor') as HTMLInputElement

                                const nome = nomeInput?.value?.trim()
                                if (!nome) {
                                  toast({ title: 'Nome do tópico é obrigatório', status: 'warning' })
                                  return
                                }

                                const novoTopico = await createTopico({
                                  nome,
                                  descricao: descricaoInput?.value?.trim() || undefined,
                                  cor: corInput?.value?.trim() || undefined
                                })

                                if (novoTopico) {
                                  toast({ title: 'Tópico criado com sucesso', status: 'success' })
                                  setTopicos(prev => [...prev, novoTopico])
                                  // Auto-selecionar o novo tópico
                                  setFormData(prev => ({
                                    ...prev,
                                    topicos: [...prev.topicos, novoTopico.id]
                                  }))
                                  // Limpar formulário
                                  if (nomeInput) nomeInput.value = ''
                                  if (descricaoInput) descricaoInput.value = ''
                                  if (corInput) corInput.value = ''
                                } else {
                                  toast({ title: 'Erro ao criar tópico', status: 'error' })
                                }
                              }}
                            >
                              Criar e Selecionar
                            </Button>
                          </VStack>
                        </Box>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </HStack>
              </Tabs>

              <HStack justify="flex-end">
                <Button variant="ghost" onClick={addModal.onClose}>Cancelar</Button>
                <Button colorScheme="blue" onClick={async () => {
                  if (!formData.empresa_id || !formData.tipo || !formData.titulo || !formData.descricao || !formData.data_inicio || !formData.resultado_esperado || !formData.responsavel) {
                    toast({ title: 'Preencha os campos obrigatórios', status: 'warning' })
                    return
                  }

                  const payload: Omit<IntervencaoDB, 'id' | 'created_at' | 'updated_at'> = {
                    empresa_id: formData.empresa_id,
                    setor: formData.setor || undefined,
                    tipo: formData.tipo,
                    titulo: formData.titulo,
                    descricao: formData.descricao,
                    // enviar como 'YYYY-MM-DD' para coluna DATE do Postgres
                    data_inicio: formData.data_inicio,
                    data_fim: formData.data_fim || undefined,
                    status: formData.status,
                    resultado_esperado: formData.resultado_esperado,
                    resultado_observado: formData.resultado_observado || undefined,
                    impacto_quantitativo: undefined,
                    impacto_qualitativo: formData.impacto_qualitativo,
                    dominios_afetados: formData.dominios_afetados,
                    responsavel: formData.responsavel,
                    custo: formData.custo ? Number(formData.custo) : undefined,
                    topicos: formData.topicos
                  }

                  const criada = await createIntervencao(payload)
                  if (criada) {
                    toast({ title: 'Intervenção criada com sucesso', status: 'success' })
                    // Manter modal aberto e dados preenchidos; apenas atualizar lista via refresh
                    setRefreshKey(prev => prev + 1)
                  } else {
                    toast({ title: 'Erro ao criar intervenção', status: 'error' })
                  }
                }}>Salvar</Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal Editar Intervenção */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="5xl" scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Intervenção</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedIntervencao && (
              <VStack spacing={6} align="stretch">
                <Tabs orientation="vertical" variant="enclosed" colorScheme="blue">
                  <HStack align="start" spacing={4}>
                    <TabList
                      minW={{ base: '220px', md: '300px' }}
                      w={{ base: '220px', md: '300px' }}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="lg"
                      p={2}
                      borderWidth="1px"
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                    >
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiInfo />
                          <Text>What - O que</Text>
                        </HStack>
                      </Tab>
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiHelpCircle />
                          <Text>Why - Por quê</Text>
                        </HStack>
                      </Tab>
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiMapPin />
                          <Text>Where - Onde</Text>
                        </HStack>
                      </Tab>
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiCalendar />
                          <Text>When - Quando</Text>
                        </HStack>
                      </Tab>
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiUser />
                          <Text>Who - Quem</Text>
                        </HStack>
                      </Tab>
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiSettings />
                          <Text>How - Como</Text>
                        </HStack>
                      </Tab>
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiDollarSign />
                          <Text>How much - Quanto</Text>
                        </HStack>
                      </Tab>
                      <Tab justifyContent="flex-start" borderLeftWidth="3px" borderLeftColor="transparent" _selected={{ bg: useColorModeValue('blue.50', 'blue.900'), color: 'blue.700', borderLeftColor: 'blue.500' }} borderRadius="md" px={3} py={2}>
                        <HStack spacing={2}>
                          <FiTarget />
                          <Text>Tópicos</Text>
                        </HStack>
                      </Tab>
                    </TabList>
                    <TabPanels flex={1} w="full">
                      {/* WHAT */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4} wrap="wrap">
                            <Box flex={1} minW="200px">
                              <Text fontSize="sm" mb={1}>Tipo</Text>
                              <Input
                                placeholder="Ex: Workshop, Treinamento"
                                value={selectedIntervencao.tipo}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, tipo: e.target.value })}
                              />
                            </Box>
                            <Box flex={2} minW="200px">
                              <Text fontSize="sm" mb={1}>Título</Text>
                              <Input
                                placeholder="Título da intervenção"
                                value={selectedIntervencao.titulo || ''}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, titulo: e.target.value })}
                              />
                            </Box>
                          </HStack>
                          <Box>
                            <Text fontSize="sm" mb={2}>Domínios Afetados</Text>
                            <HStack spacing={4} wrap="wrap">
                              {Object.keys(coresDominios).map((dom) => (
                                <Checkbox
                                  key={dom}
                                  isChecked={selectedIntervencao.dominios_afetados?.includes(dom) || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setSelectedIntervencao(prev => prev ? ({
                                      ...prev,
                                      dominios_afetados: checked
                                        ? [...(prev.dominios_afetados || []), dom]
                                        : (prev.dominios_afetados || []).filter(d => d !== dom)
                                    }) : null)
                                  }}
                                >
                                  {dom}
                                </Checkbox>
                              ))}
                            </HStack>
                          </Box>
                        </VStack>
                      </TabPanel>
                      {/* WHY */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <Box>
                            <Text fontSize="sm" mb={1}>Justificativa (Why)</Text>
                            <Textarea
                              placeholder="Qual a razão/motivação desta intervenção? Objetivos e resultados esperados."
                              value={selectedIntervencao.resultadoEsperado}
                              onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, resultadoEsperado: e.target.value })}
                            />
                          </Box>
                        </VStack>
                      </TabPanel>
                      {/* WHERE */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4} wrap="wrap">
                            <Box flex={1} minW="200px">
                              <Text fontSize="sm" mb={1}>Empresa ID</Text>
                              <Input
                                placeholder="empresa_id"
                                value={selectedIntervencao.empresa_id || ''}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, empresa_id: e.target.value })}
                              />
                            </Box>
                            <Box flex={1} minW="200px">
                              <Text fontSize="sm" mb={1}>Setor (opcional)</Text>
                              <Input
                                placeholder="setor"
                                value={selectedIntervencao.setor || ''}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, setor: e.target.value })}
                              />
                            </Box>
                          </HStack>
                        </VStack>
                      </TabPanel>
                      {/* WHEN */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4} wrap="wrap">
                            <Box>
                              <Text fontSize="sm" mb={1}>Data Início</Text>
                              <Input
                                type="date"
                                value={selectedIntervencao.data ? new Date(selectedIntervencao.data.split('/').reverse().join('-')).toISOString().split('T')[0] : ''}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, data: new Date(e.target.value).toLocaleDateString('pt-BR') })}
                              />
                            </Box>
                            <Box minW="200px">
                              <Text fontSize="sm" mb={1}>Status</Text>
                              <Select
                                value={selectedIntervencao.status || 'planejada'}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, status: e.target.value as any })}
                              >
                                <option value="planejada">Planejada</option>
                                <option value="em_andamento">Em andamento</option>
                                <option value="concluida">Concluída</option>
                                <option value="cancelada">Cancelada</option>
                              </Select>
                            </Box>
                          </HStack>
                        </VStack>
                      </TabPanel>
                      {/* WHO */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4} wrap="wrap">
                            <Box flex={1} minW="200px">
                              <Text fontSize="sm" mb={1}>Responsável</Text>
                              <Input
                                placeholder="Nome do responsável"
                                value={selectedIntervencao.responsavel || ''}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, responsavel: e.target.value })}
                              />
                            </Box>
                            <Box flex={1} minW="200px">
                              <Text fontSize="sm" mb={1}>Impacto Qualitativo</Text>
                              <Select
                                value={selectedIntervencao.impacto}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, impacto: e.target.value as any })}
                              >
                                <option value="positivo">Positivo</option>
                                <option value="neutro">Neutro</option>
                                <option value="negativo">Negativo</option>
                              </Select>
                            </Box>
                          </HStack>
                        </VStack>
                      </TabPanel>
                      {/* HOW */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <Box>
                            <Text fontSize="sm" mb={1}>Plano de Ação (How)</Text>
                            <Textarea
                              placeholder="Como será executada a intervenção? Etapas, recursos, cronograma."
                              value={selectedIntervencao.descricao}
                              onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, descricao: e.target.value })}
                            />
                          </Box>
                        </VStack>
                      </TabPanel>
                      {/* HOW MUCH */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4} wrap="wrap">
                            <Box minW="160px">
                              <Text fontSize="sm" mb={1}>Custo (R$) opcional</Text>
                              <Input
                                type="number"
                                value={selectedIntervencao.custo || ''}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, custo: Number(e.target.value) })}
                              />
                            </Box>
                            <Box flex={1} minW="200px">
                              <Text fontSize="sm" mb={1}>Resultado Observado (opcional)</Text>
                              <Input
                                placeholder="Ex: Aumento de 8 pts"
                                value={selectedIntervencao.resultadoObservado || ''}
                                onChange={(e) => setSelectedIntervencao({ ...selectedIntervencao, resultadoObservado: e.target.value })}
                              />
                            </Box>
                          </HStack>
                        </VStack>
                      </TabPanel>
                      {/* TÓPICOS */}
                      <TabPanel>
                        <VStack spacing={6} align="stretch">
                          {/* Tópicos Selecionados */}
                          <Box>
                            <Text fontSize="sm" mb={2}>Tópicos Selecionados</Text>
                            {selectedIntervencao.topicos && selectedIntervencao.topicos.length > 0 ? (
                              <HStack spacing={2} wrap="wrap">
                                {selectedIntervencao.topicos.map((topicoId) => {
                                  const topico = topicos.find(t => t.id === topicoId)
                                  return topico ? (
                                    <Badge
                                      key={topicoId}
                                      colorScheme="purple"
                                      variant="subtle"
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                    >
                                      <HStack spacing={2}>
                                        {topico.cor && (
                                          <Box w={2} h={2} bg={topico.cor} borderRadius="full" />
                                        )}
                                        <Text>{topico.nome}</Text>
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="red"
                                          onClick={() => {
                                            setSelectedIntervencao(prev => prev ? ({
                                              ...prev,
                                              topicos: (prev.topicos || []).filter(t => t !== topicoId)
                                            }) : null)
                                          }}
                                        >
                                          ×
                                        </Button>
                                      </HStack>
                                    </Badge>
                                  ) : null
                                })}
                              </HStack>
                            ) : (
                              <Text fontSize="sm" color="gray.500">
                                Nenhum tópico selecionado
                              </Text>
                            )}
                          </Box>

                          <Divider />

                          {/* Tópicos Disponíveis */}
                          <Box>
                            <Text fontSize="sm" mb={2}>Tópicos Disponíveis</Text>
                            {topicos.length > 0 ? (
                              <VStack spacing={2} align="stretch">
                                {topicos.map((topico) => (
                                  <HStack key={topico.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                    <HStack spacing={3}>
                                      <Checkbox
                                        isChecked={selectedIntervencao.topicos?.includes(topico.id) || false}
                                        onChange={(e) => {
                                          const checked = e.target.checked
                                          setSelectedIntervencao(prev => prev ? ({
                                            ...prev,
                                            topicos: checked
                                              ? [...(prev.topicos || []), topico.id]
                                              : (prev.topicos || []).filter(t => t !== topico.id)
                                          }) : null)
                                        }}
                                      />
                                      {topico.cor && (
                                        <Box w={3} h={3} bg={topico.cor} borderRadius="full" />
                                      )}
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="medium">{topico.nome}</Text>
                                        {topico.descricao && (
                                          <Text fontSize="xs" color="gray.600">{topico.descricao}</Text>
                                        )}
                                      </VStack>
                                    </HStack>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={async () => {
                                        if (confirm(`Tem certeza que deseja excluir o tópico "${topico.nome}"?`)) {
                                          const sucesso = await deleteTopico(topico.id)
                                          if (sucesso) {
                                            toast({ title: 'Tópico excluído com sucesso', status: 'success' })
                                            setTopicos(prev => prev.filter(t => t.id !== topico.id))
                                            setSelectedIntervencao(prev => prev ? ({
                                              ...prev,
                                              topicos: (prev.topicos || []).filter(t => t !== topico.id)
                                            }) : null)
                                          } else {
                                            toast({ title: 'Erro ao excluir tópico', status: 'error' })
                                          }
                                        }
                                      }}
                                    >
                                      <FiTrash2 size={12} />
                                    </Button>
                                  </HStack>
                                ))}
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                                Nenhum tópico cadastrado
                              </Text>
                            )}
                          </Box>

                          <Divider />

                          {/* Criar Novo Tópico */}
                          <Box>
                            <Text fontSize="sm" mb={2}>Criar Novo Tópico</Text>
                            <VStack spacing={3} align="stretch">
                              <HStack spacing={3}>
                                <Box flex={1}>
                                  <Input
                                    placeholder="Nome do tópico"
                                    size="sm"
                                    id="novo-topico-nome-edit"
                                  />
                                </Box>
                                <Box flex={1}>
                                  <Input
                                    placeholder="Descrição (opcional)"
                                    size="sm"
                                    id="novo-topico-descricao-edit"
                                  />
                                </Box>
                              </HStack>
                              <HStack spacing={2} align="center">
                                <Text fontSize="xs" color="gray.600">Cor:</Text>
                                {['#E53935', '#E17055', '#FDCB6E', '#00C4A7', '#1A45FC', '#0D249B', '#169DEF', '#B6BEC6', '#FFA07A', '#20B2AA'].map((cor) => (
                                  <Box
                                    key={cor}
                                    w={4}
                                    h={4}
                                    bg={cor}
                                    borderRadius="full"
                                    cursor="pointer"
                                    border="2px solid"
                                    borderColor="transparent"
                                    _hover={{ borderColor: 'gray.400' }}
                                    onClick={() => {
                                      const input = document.getElementById('novo-topico-cor-edit') as HTMLInputElement
                                      if (input) input.value = cor
                                    }}
                                  />
                                ))}
                                <Input
                                  id="novo-topico-cor-edit"
                                  placeholder="#000000"
                                  size="xs"
                                  maxW="80px"
                                />
                              </HStack>
                              <Button
                                size="sm"
                                colorScheme="purple"
                                variant="outline"
                                onClick={async () => {
                                  const nomeInput = document.getElementById('novo-topico-nome-edit') as HTMLInputElement
                                  const descricaoInput = document.getElementById('novo-topico-descricao-edit') as HTMLInputElement
                                  const corInput = document.getElementById('novo-topico-cor-edit') as HTMLInputElement

                                  const nome = nomeInput?.value?.trim()
                                  if (!nome) {
                                    toast({ title: 'Nome do tópico é obrigatório', status: 'warning' })
                                    return
                                  }

                                  const novoTopico = await createTopico({
                                    nome,
                                    descricao: descricaoInput?.value?.trim() || undefined,
                                    cor: corInput?.value?.trim() || undefined
                                  })

                                  if (novoTopico) {
                                    toast({ title: 'Tópico criado com sucesso', status: 'success' })
                                    setTopicos(prev => [...prev, novoTopico])
                                    // Auto-selecionar o novo tópico
                                    setSelectedIntervencao(prev => prev ? ({
                                      ...prev,
                                      topicos: [...(prev.topicos || []), novoTopico.id]
                                    }) : null)
                                    // Limpar formulário
                                    if (nomeInput) nomeInput.value = ''
                                    if (descricaoInput) descricaoInput.value = ''
                                    if (corInput) corInput.value = ''
                                  } else {
                                    toast({ title: 'Erro ao criar tópico', status: 'error' })
                                  }
                                }}
                              >
                                Criar e Selecionar
                              </Button>
                            </VStack>
                          </Box>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </HStack>
                </Tabs>

                <HStack justify="flex-end">
                  <Button variant="ghost" onClick={editModal.onClose}>Cancelar</Button>
                  <Button colorScheme="blue" onClick={async () => {
                    if (!selectedIntervencao?.id) return

                    const payload = {
                      empresa_id: selectedIntervencao.empresa_id || '',
                      setor: selectedIntervencao.setor || undefined,
                      tipo: selectedIntervencao.tipo,
                      titulo: selectedIntervencao.titulo || '',
                      descricao: selectedIntervencao.descricao,
                      data_inicio: selectedIntervencao.data ? new Date(selectedIntervencao.data.split('/').reverse().join('-')).toISOString().split('T')[0] : '',
                      status: selectedIntervencao.status || 'planejada',
                      resultado_esperado: selectedIntervencao.resultadoEsperado,
                      resultado_observado: selectedIntervencao.resultadoObservado || undefined,
                      impacto_qualitativo: selectedIntervencao.impacto,
                      dominios_afetados: selectedIntervencao.dominios_afetados || [],
                      responsavel: selectedIntervencao.responsavel || '',
                      custo: selectedIntervencao.custo || undefined,
                      topicos: selectedIntervencao.topicos || []
                    }

                    const sucesso = await updateIntervencao(selectedIntervencao.id, payload)
                    if (sucesso) {
                      toast({ title: 'Intervenção atualizada com sucesso', status: 'success' })
                      setRefreshKey(prev => prev + 1)
                      editModal.onClose()
                    } else {
                      toast({ title: 'Erro ao atualizar intervenção', status: 'error' })
                    }
                  }}>Salvar</Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Exclusão</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text>
                Tem certeza que deseja excluir a intervenção "{selectedIntervencao?.tipo}{selectedIntervencao?.titulo ? ` - ${selectedIntervencao.titulo}` : ''}"?
              </Text>
              <Text fontSize="sm" color="gray.500">
                Esta ação não pode ser desfeita.
              </Text>
              <HStack justify="flex-end" spacing={3}>
                <Button variant="ghost" onClick={deleteModal.onClose}>Cancelar</Button>
                <Button
                  colorScheme="red"
                  onClick={async () => {
                    if (!selectedIntervencao?.id) return

                    const sucesso = await deleteIntervencao(selectedIntervencao.id)
                    if (sucesso) {
                      toast({ title: 'Intervenção excluída com sucesso', status: 'success' })
                      setRefreshKey(prev => prev + 1)
                      deleteModal.onClose()
                    } else {
                      toast({ title: 'Erro ao excluir intervenção', status: 'error' })
                    }
                  }}
                >
                  Excluir
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

    </MotionBox>
  )
}

export default HistoricoPage 