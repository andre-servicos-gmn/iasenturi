import {
  Box, VStack, HStack, Text, Select, Input, Button,
  useColorModeValue, Card, CardBody, Icon, Tooltip,
  RadioGroup, Radio, Stack, Checkbox, CheckboxGroup
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiCalendar, FiHome, FiUsers, FiTrendingUp, FiTarget } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { fetchEmpresas } from '@/lib/supabase'
import { Empresa } from '@/types'

const MotionBox = motion(Box)

interface FiltrosHistoricoProps {
  filtros: {
    empresa_id: string
    setor: string
    periodo_inicio: string
    periodo_fim: string
    periodo_analise: string
    dominios_especificos: string[]
    incluir_intervencoes: boolean
    comparacao_antes_depois: boolean
  }
  onFiltrosChange: (filtros: any) => void
  setores: string[]
}

const FiltrosHistorico = ({ filtros, onFiltrosChange, setores }: FiltrosHistoricoProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const [empresas, setEmpresas] = useState<Empresa[]>([])

  // Domínios COPSOQ para análise de saúde mental
  const dominiosCOPSOQ = [
    { value: 'Exigências do trabalho', label: 'Exigências do trabalho', desc: 'Estresse e pressão mental' },
    { value: 'Saúde Emocional e Bem-Estar', label: 'Saúde Emocional e Bem-Estar', desc: 'Esgotamento e bem-estar' },
    { value: 'Equilíbrio Trabalho - Vida', label: 'Equilíbrio Trabalho - Vida', desc: 'Equilíbrio pessoal' },
    { value: 'Suporte Social e Qualidade da Liderança', label: 'Suporte Social e Qualidade da Liderança', desc: 'Relacionamentos' },
    { value: 'Esforço e Recompensa', label: 'Esforço e Recompensa', desc: 'Satisfação no trabalho' },
    { value: 'Demandas Físicas', label: 'Demandas Físicas', desc: 'Carga física' },
    { value: 'Autonomia e Controle no trabalho', label: 'Autonomia e Controle no trabalho', desc: 'Autonomia' }
  ]

  // Períodos de análise predefinidos
  const periodosAnalise = [
    { value: 'trimestral', label: 'Trimestral', desc: 'Últimos 3 meses' },
    { value: 'semestral', label: 'Semestral', desc: 'Últimos 6 meses' },
    { value: 'anual', label: 'Anual', desc: 'Últimos 12 meses' },
    { value: 'customizado', label: 'Período Customizado', desc: 'Definir datas' }
  ]

  useEffect(() => {
    const carregarEmpresas = async () => {
      try {
        const data = await fetchEmpresas()
        setEmpresas(data)
      } catch (error) {
        console.error('Erro ao carregar empresas:', error)
      }
    }

    carregarEmpresas()
  }, [])

  const handleFiltroChange = (campo: string, valor: any) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    })
  }

  const limparFiltros = () => {
    onFiltrosChange({
      empresa_id: '',
      setor: '',
      periodo_inicio: '',
      periodo_fim: '',
      periodo_analise: 'trimestral',
      dominios_especificos: [],
      incluir_intervencoes: true,
      comparacao_antes_depois: true
    })
  }

  const aplicarPeriodoPredefinido = (periodo: string) => {
    const hoje = new Date()
    let dataInicio = new Date()

    switch (periodo) {
      case 'trimestral':
        dataInicio.setMonth(hoje.getMonth() - 3)
        break
      case 'semestral':
        dataInicio.setMonth(hoje.getMonth() - 6)
        break
      case 'anual':
        dataInicio.setFullYear(hoje.getFullYear() - 1)
        break
      default:
        return
    }

    onFiltrosChange({
      ...filtros,
      periodo_analise: periodo,
      periodo_inicio: dataInicio.toISOString().split('T')[0],
      periodo_fim: hoje.toISOString().split('T')[0]
    })
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="premium">
        <CardBody p={6}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <HStack spacing={2}>
              <Icon as={FiTarget} color="#0D249B" />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Análise de Saúde Mental ao Longo do Tempo
              </Text>
            </HStack>

            {/* Filtros Primários */}
            <VStack spacing={4} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                📊 Filtros Primários
              </Text>

              <HStack spacing={4} wrap="wrap">
                {/* Empresa */}
                <VStack align="start" spacing={1} minW="200px">
                  <HStack spacing={1}>
                    <Icon as={FiHome} size={14} color="gray.500" />
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Empresa *
                    </Text>
                  </HStack>
                  <Select
                    value={filtros.empresa_id}
                    onChange={(e) => handleFiltroChange('empresa_id', e.target.value)}
                    placeholder="Selecione a empresa"
                    size="sm"
                    bg="white"
                    _dark={{ bg: 'gray.700' }}
                  >
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </option>
                    ))}
                  </Select>
                </VStack>

                {/* Setor */}
                <VStack align="start" spacing={1} minW="200px">
                  <HStack spacing={1}>
                    <Icon as={FiUsers} size={14} color="gray.500" />
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Setor
                    </Text>
                  </HStack>
                  <Select
                    value={filtros.setor}
                    onChange={(e) => handleFiltroChange('setor', e.target.value)}
                    placeholder="Todos os setores"
                    size="sm"
                    bg="white"
                    _dark={{ bg: 'gray.700' }}
                  >
                    <option value="">Todos os setores</option>
                    {setores.map((setor) => (
                      <option key={setor} value={setor}>
                        {setor}
                      </option>
                    ))}
                  </Select>
                </VStack>
              </HStack>
            </VStack>

            {/* Período de Análise */}
            <VStack spacing={4} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                📅 Período de Análise
              </Text>

              <RadioGroup
                value={filtros.periodo_analise}
                onChange={(value) => {
                  handleFiltroChange('periodo_analise', value)
                  if (value !== 'customizado') {
                    aplicarPeriodoPredefinido(value)
                  }
                }}
              >
                <Stack direction="row" wrap="wrap" spacing={4}>
                  {periodosAnalise.map((periodo) => (
                    <Radio key={periodo.value} value={periodo.value}>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">{periodo.label}</Text>
                        <Text fontSize="xs" color="gray.500">{periodo.desc}</Text>
                      </VStack>
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>

              {/* Datas customizadas */}
              {filtros.periodo_analise === 'customizado' && (
                <HStack spacing={4} wrap="wrap">
                  <VStack align="start" spacing={1} minW="200px">
                    <HStack spacing={1}>
                      <Icon as={FiCalendar} size={14} color="gray.500" />
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Data Início
                      </Text>
                    </HStack>
                    <Input
                      type="date"
                      value={filtros.periodo_inicio}
                      onChange={(e) => handleFiltroChange('periodo_inicio', e.target.value)}
                      size="sm"
                      bg="white"
                      _dark={{ bg: 'gray.700' }}
                    />
                  </VStack>

                  <VStack align="start" spacing={1} minW="200px">
                    <HStack spacing={1}>
                      <Icon as={FiCalendar} size={14} color="gray.500" />
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Data Fim
                      </Text>
                    </HStack>
                    <Input
                      type="date"
                      value={filtros.periodo_fim}
                      onChange={(e) => handleFiltroChange('periodo_fim', e.target.value)}
                      size="sm"
                      bg="white"
                      _dark={{ bg: 'gray.700' }}
                    />
                  </VStack>
                </HStack>
              )}
            </VStack>

            {/* Domínios Específicos */}
            <VStack spacing={4} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                🎯 Domínios de Saúde Mental
              </Text>

              <CheckboxGroup
                value={filtros.dominios_especificos}
                onChange={(values) => handleFiltroChange('dominios_especificos', values)}
              >
                <Stack direction="row" wrap="wrap" spacing={4}>
                  {dominiosCOPSOQ.map((dominio) => (
                    <Checkbox key={dominio.value} value={dominio.value}>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">{dominio.label}</Text>
                        <Text fontSize="xs" color="gray.500">{dominio.desc}</Text>
                      </VStack>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </VStack>

            {/* Opções Avançadas */}
            <VStack spacing={4} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                ⚙️ Opções de Análise
              </Text>

              <HStack spacing={6} wrap="wrap">
                <Checkbox
                  isChecked={filtros.incluir_intervencoes}
                  onChange={(e) => handleFiltroChange('incluir_intervencoes', e.target.checked)}
                >
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">Incluir Intervenções</Text>
                    <Text fontSize="xs" color="gray.500">Mostrar ações realizadas</Text>
                  </VStack>
                </Checkbox>

                <Checkbox
                  isChecked={filtros.comparacao_antes_depois}
                  onChange={(e) => handleFiltroChange('comparacao_antes_depois', e.target.checked)}
                >
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">Comparação Antes/Depois</Text>
                    <Text fontSize="xs" color="gray.500">Medir impacto das ações</Text>
                  </VStack>
                </Checkbox>
              </HStack>
            </VStack>

            {/* Botões de Ação */}
            <HStack justify="flex-end" spacing={3}>
              <Tooltip label="Limpar todos os filtros">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={limparFiltros}
                  colorScheme="gray"
                >
                  Limpar Filtros
                </Button>
              </Tooltip>
              <Tooltip label="Aplicar filtros e gerar análise">
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<FiTrendingUp />}
                  onClick={() => onFiltrosChange(filtros)}
                >
                  Gerar Análise
                </Button>
              </Tooltip>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}

export default FiltrosHistorico