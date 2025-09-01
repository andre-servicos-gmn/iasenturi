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
  FiInfo, FiHelpCircle, FiMapPin, FiCalendar, FiUser, FiSettings, FiDollarSign
} from 'react-icons/fi'
import { useFilters } from '@/contexts/store'
import { useState, useEffect, useMemo } from 'react'
import { fetchIntervencoes, createIntervencao, fetchEmpresas, updateIntervencaoResultado } from '@/lib/supabase'
import { Intervencao as IntervencaoDB, Empresa } from '@/types'
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
  const { filteredData, loading: filtersLoading, filters } = useFilters()
  const [historicoData, setHistoricoData] = useState<HistoricoData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntervencao, setSelectedIntervencao] = useState<(UIIntervencao & { id?: string }) | null>(null)
  const intervencaoModal = useDisclosure()
  const addModal = useDisclosure()
  const toast = useToast()
  const [refreshKey, setRefreshKey] = useState(0)
  const [intervencoesFlat, setIntervencoesFlat] = useState<(UIIntervencao & { id?: string })[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const empresaNomeById = useMemo(() => {
    const map: Record<string, string> = {}
    empresas.forEach(e => { if (e.id) map[e.id] = e.nome })
    return map
  }, [empresas])

  useEffect(() => {
    fetchEmpresas().then(setEmpresas).catch(() => {})
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
    custo: '' as number | string
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

  // Cores da paleta Senturi para os domínios
  const coresDominios = {
    'Demandas Psicológicas': '#FF6B6B',
    'Demandas Físicas': '#4ECDC4',
    'Demandas de Trabalho': '#45B7D1',
    'Suporte Social e Liderança': '#96CEB4',
    'Esforço e Recompensa': '#DDA0DD',
    'Interface Trabalho-Vida': '#F7DC6F',
    'Saúde Emocional': '#98D8C8'
  }

  // Dados de intervenções simuladas (em produção viriam do banco)
  const intervencoesSimuladas: { [key: string]: UIIntervencao[] } = {
    '2024-T1': [
      {
        tipo: 'Workshop',
        descricao: 'Workshop sobre propósito e significado no trabalho',
        data: '15/01/2024',
        resultadoEsperado: 'Aumento de 15 pts no domínio "Significado"',
        resultadoObservado: 'Aumento de 18 pts no domínio "Significado"',
        impacto: 'positivo'
      },
      {
        tipo: 'Gamificação',
        descricao: 'Gamificação com desafios semanais',
        data: '22/01/2024',
        resultadoEsperado: 'Melhoria na satisfação geral',
        resultadoObservado: 'Aumento de 12 pts em satisfação',
        impacto: 'positivo'
      }
    ],
    '2024-T2': [
      {
        tipo: 'Sessão Liderança',
        descricao: 'Sessão de coaching com lideranças',
        data: '10/04/2024',
        resultadoEsperado: 'Melhoria no suporte da liderança',
        resultadoObservado: 'Aumento de 8 pts no suporte',
        impacto: 'positivo'
      },
      {
        tipo: 'Pausa Ativa',
        descricao: 'Implementação de pausas ativas',
        data: '18/04/2024',
        resultadoEsperado: 'Redução do estresse físico',
        resultadoObservado: 'Redução de 5 pts em demandas físicas',
        impacto: 'positivo'
      }
    ],
    '2024-T3': [
      {
        tipo: 'Programa Wellness',
        descricao: 'Programa de bem-estar corporativo',
        data: '05/07/2024',
        resultadoEsperado: 'Melhoria geral na saúde emocional',
        resultadoObservado: 'Aumento de 10 pts na saúde emocional',
        impacto: 'positivo'
      }
    ]
  }

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true)
        
        if (filteredData.length > 0) {
          // Agrupar dados por trimestre
          const dadosPorTrimestre: { [key: string]: any[] } = {}
          
          filteredData.forEach(item => {
            if (item.created_at) {
              const data = new Date(item.created_at)
              const ano = data.getFullYear()
              const mes = data.getMonth()
              const trimestre = Math.floor(mes / 3) + 1
              const chave = `${ano}-T${trimestre}`
              
              if (!dadosPorTrimestre[chave]) {
                dadosPorTrimestre[chave] = []
              }
              dadosPorTrimestre[chave].push(item)
            }
          })

          // Processar dados históricos
          let historico = Object.entries(dadosPorTrimestre).map(([periodo, items]) => {
            const dominios: { [key: string]: number } = {
              'Demandas Psicológicas': 0,
              'Demandas Físicas': 0,
              'Demandas de Trabalho': 0,
              'Suporte Social e Liderança': 0,
              'Esforço e Recompensa': 0,
              'Interface Trabalho-Vida': 0,
              'Saúde Emocional': 0
            }

            let totalValores = 0
            let countValores = 0

            items.forEach(item => {
              // Demandas Psicológicas
              if (item.demandas_psicologicas) {
                dominios['Demandas Psicológicas'] += parseFloat(item.demandas_psicologicas)
                totalValores += parseFloat(item.demandas_psicologicas)
                countValores++
              }

              // Demandas Físicas
              if (item.demandas_fisicas) {
                dominios['Demandas Físicas'] += parseFloat(item.demandas_fisicas)
                totalValores += parseFloat(item.demandas_fisicas)
                countValores++
              }

              // Demandas de Trabalho
              if (item.demandas_trabalho) {
                dominios['Demandas de Trabalho'] += parseFloat(item.demandas_trabalho)
                totalValores += parseFloat(item.demandas_trabalho)
                countValores++
              }

              // Suporte Social e Liderança
              if (item.suporte_social_lideranca) {
                dominios['Suporte Social e Liderança'] += parseFloat(item.suporte_social_lideranca)
                totalValores += parseFloat(item.suporte_social_lideranca)
                countValores++
              }

              // Esforço e Recompensa
              if (item.esforco_recompensa) {
                dominios['Esforço e Recompensa'] += parseFloat(item.esforco_recompensa)
                totalValores += parseFloat(item.esforco_recompensa)
                countValores++
              }

              // Saúde Emocional
              if (item.saude_emocional) {
                dominios['Saúde Emocional'] += parseFloat(item.saude_emocional)
                totalValores += parseFloat(item.saude_emocional)
                countValores++
              }

              // Interface Trabalho-Vida
              if (item.interface_trabalho_vida) {
                dominios['Interface Trabalho-Vida'] += parseFloat(item.interface_trabalho_vida)
                totalValores += parseFloat(item.interface_trabalho_vida)
                countValores++
              }
            })

            // Calcular médias
            if (countValores > 0) {
              Object.keys(dominios).forEach(dominio => {
                dominios[dominio] = Math.round(dominios[dominio] / countValores)
              })
            }

            // Formatar data para exibição
            const [ano, trimestre] = periodo.split('-T')
            const meses = ['Jan', 'Abr', 'Jul', 'Out']
            const dataFormatada = `${meses[parseInt(trimestre) - 1]}/${ano}`

            return {
              periodo,
              dataFormatada,
              dominios,
              totalColaboradores: items.length,
              intervencoes: filters.empresa ? [] : (intervencoesSimuladas[periodo] || [])
            }
          })

          // Ordenar por período
          historico.sort((a, b) => a.periodo.localeCompare(b.periodo))

          // Buscar intervenções reais e mesclar
          try {
            const intervencoesDB = await fetchIntervencoes({
              empresa_id: filters.empresa || undefined,
              setor: filters.setor || undefined,
              data_inicio: filters.dataInicio || undefined,
              data_fim: filters.dataFim || undefined
            })

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
              setor: i.setor
            })

            const byPeriod: Record<string, UIIntervencao[]> = {}
            ;(intervencoesDB || []).forEach((i) => {
              const d = new Date(i.data_inicio)
              const y = d.getFullYear()
              const q = Math.floor(d.getMonth() / 3) + 1
              const key = `${y}-T${q}`
              if (!byPeriod[key]) byPeriod[key] = []
              byPeriod[key].push(toUI(i))
            })

            historico = historico.map(h => ({
              ...h,
              intervencoes: [ ...(h.intervencoes || []), ...(byPeriod[h.periodo] || []) ]
            }))

            // Lista plana de intervenções (sem agrupamento)
            const flatList = (intervencoesDB || []).map(toUI)
            setIntervencoesFlat(flatList)
          } catch (e) {
            console.error('Erro ao mesclar intervenções do banco:', e)
          }

          setHistoricoData(historico)
        } else {
          setHistoricoData([])
        }
      } catch (error) {
        console.error('Erro ao processar dados históricos:', error)
      } finally {
        setLoading(false)
      }
    }

    processData()
  }, [filteredData, filters.empresa, filters.setor, filters.dataInicio, filters.dataFim, refreshKey])

  // Preparar dados para o gráfico
  const dadosGrafico: DadosGrafico = useMemo(() => {
    if (historicoData.length === 0) return { labels: [], datasets: [] }

    const labels = historicoData.map(item => item.dataFormatada)
    const dominios = Object.keys(historicoData[0].dominios)

    const datasets = dominios.map(dominio => ({
      label: dominio,
      data: historicoData.map(item => item.dominios[dominio]),
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
            if (previousValue !== undefined) {
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
                    custo: formData.custo ? Number(formData.custo) : undefined
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
    </MotionBox>
  )
}

export default HistoricoPage 