import {
  Box, VStack, HStack, Text, useColorModeValue, Card, CardBody,
  Select, Button, InputGroup, InputLeftElement, Collapse, Badge
} from '@chakra-ui/react'
import { FiFilter, FiRefreshCw, FiHome, FiGrid, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FiltrosEPSPSQIProps {
  tipo: 'EPS' | 'PSQI'
  onFiltrosChange: (filtros: { empresa: string; setor: string }) => void
}

const FiltrosEPSPSQI = ({ tipo, onFiltrosChange }: FiltrosEPSPSQIProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [expanded, setExpanded] = useState(true)
  
  // Estados dos filtros
  const [empresa, setEmpresa] = useState('')
  const [setor, setSetor] = useState('')
  
  // Opções disponíveis
  const [empresaOptions, setEmpresaOptions] = useState<string[]>([])
  const [setoresFiltrados, setSetoresFiltrados] = useState<string[]>([])
  
  // Loading states
  const [loadingEmpresas, setLoadingEmpresas] = useState(false)
  const [loadingSetores, setLoadingSetores] = useState(false)

  // Determinar a tabela baseada no tipo
  const tabela = tipo === 'EPS' ? 'EPS_respostas' : 'PSQI_respostas'

  // Carregar opções de empresas
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        setLoadingEmpresas(true)
        if (!supabase) return

        const { data, error } = await supabase
          .from(tabela)
          .select('empresa_id')
          .not('empresa_id', 'is', null)

        if (error) {
          console.error(`Erro ao carregar empresas para ${tipo}:`, error)
          return
        }

        const empresas = Array.from(
          new Set(data.map(item => item.empresa_id).filter(Boolean))
        ).sort()
        
        setEmpresaOptions(empresas)
        console.log(`✅ Empresas carregadas para ${tipo}:`, empresas)
      } catch (error) {
        console.error(`Erro ao carregar empresas para ${tipo}:`, error)
      } finally {
        setLoadingEmpresas(false)
      }
    }

    loadEmpresas()
  }, [tipo, tabela])

  // Carregar opções de setores
  useEffect(() => {
    const loadSetores = async () => {
      try {
        setLoadingSetores(true)
        if (!supabase) {
          console.log(`❌ Supabase não inicializado para ${tipo}`)
          return
        }

        console.log(`🔄 Carregando setores para ${tipo}, empresa: ${empresa || 'todas'}`)

        let query = supabase
          .from(tabela)
          .select('area_setor')
          .not('area_setor', 'is', null)

        // Filtrar por empresa se selecionada
        if (empresa) {
          query = query.eq('empresa_id', empresa)
          console.log(`🔍 Aplicando filtro de empresa: ${empresa}`)
        }

        const { data, error } = await query

        if (error) {
          console.error(`❌ Erro ao carregar setores para ${tipo}:`, error)
          console.error(`📋 Detalhes do erro:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          return
        }

        console.log(`📊 Dados brutos de setores para ${tipo}:`, data)

        const setores = Array.from(
          new Set(data.map(item => item.area_setor).filter(Boolean))
        ).sort()
        
        setSetoresFiltrados(setores)
        console.log(`✅ Setores carregados para ${tipo}:`, setores)
      } catch (error) {
        console.error(`❌ Erro ao carregar setores para ${tipo}:`, error)
        if (error instanceof Error) {
          console.error(`📋 Mensagem de erro:`, error.message)
          console.error(`📋 Stack trace:`, error.stack)
        }
      } finally {
        setLoadingSetores(false)
      }
    }

    loadSetores()
  }, [tipo, tabela, empresa])

  // Resetar setor quando empresa mudar
  useEffect(() => {
    setSetor('')
  }, [empresa])

  // Aplicar filtros quando mudarem
  useEffect(() => {
    onFiltrosChange({ empresa, setor })
  }, [empresa, setor, onFiltrosChange])

  // Limpar filtros
  const clearFilters = () => {
    setEmpresa('')
    setSetor('')
  }

  // Verificar se há filtros ativos
  const hasActiveFilters = empresa || setor

  return (
    <Card 
      variant="outline" 
      w="full"
      boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
      borderRadius="lg"
      borderColor={borderColor}
    >
      <CardBody p={4}>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Box
                p={2}
                bg={tipo === 'EPS' ? 'orange.500' : 'blue.500'}
                borderRadius="lg"
                color="white"
              >
                <FiFilter size={16} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  Filtros {tipo}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Filtrar dados por empresa e setor
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              {hasActiveFilters && (
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  color="gray.500"
                  _hover={{ bg: 'gray.100', color: 'gray.700' }}
                >
                  Limpar
                </Button>
              )}
              <Button
                leftIcon={expanded ? <FiChevronUp /> : <FiChevronDown />}
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                color="gray.600"
                _hover={{ bg: 'gray.100', color: 'gray.800' }}
              >
                {expanded ? 'Recolher' : 'Expandir'}
              </Button>
            </HStack>
          </HStack>

          <Collapse 
            in={expanded} 
            animateOpacity={false}
            transition={{ enter: { duration: 0.2, ease: "easeOut" }, exit: { duration: 0.15, ease: "easeIn" } }}
          >
            {/* Filtros */}
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} wrap="wrap" gap={4}>
                {/* Empresa */}
                <Box minW="180px" flex="1">
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Empresa
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiHome color="gray.400" />
                    </InputLeftElement>
                    <Select
                      placeholder="Todas as empresas"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      size="md"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'gray.400',
                        boxShadow: 'none',
                      }}
                      pl={10}
                      isDisabled={loadingEmpresas}
                    >
                      {empresaOptions.map((emp) => (
                        <option key={emp} value={emp}>
                          {emp}
                        </option>
                      ))}
                    </Select>
                  </InputGroup>
                </Box>

                {/* Setor */}
                <Box minW="180px" flex="1">
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Setor
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiGrid color="gray.400" />
                    </InputLeftElement>
                    <Select
                      placeholder="Todos os setores"
                      value={setor}
                      onChange={(e) => setSetor(e.target.value)}
                      size="md"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'gray.400',
                        boxShadow: 'none',
                      }}
                      pl={10}
                      isDisabled={loadingSetores || !empresa}
                    >
                      {setoresFiltrados.map((set) => (
                        <option key={set} value={set}>
                          {set}
                        </option>
                      ))}
                    </Select>
                  </InputGroup>
                </Box>
              </HStack>

              {/* Filtros Ativos */}
              {hasActiveFilters && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Filtros ativos:
                  </Text>
                  <HStack spacing={2} wrap="wrap">
                    {empresa && (
                      <Badge
                        colorScheme="blue"
                        variant="subtle"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        🏢 {empresa}
                      </Badge>
                    )}
                    {setor && (
                      <Badge
                        colorScheme="green"
                        variant="subtle"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        🏬 {setor}
                      </Badge>
                    )}
                  </HStack>
                </Box>
              )}

              {/* Status de carregamento */}
              {(loadingEmpresas || loadingSetores) && (
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Carregando opções...
                </Text>
              )}
            </VStack>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default FiltrosEPSPSQI
