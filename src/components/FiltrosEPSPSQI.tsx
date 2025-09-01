import {
  Box, VStack, HStack, Text, useColorModeValue, Card, CardBody,
  Select, Button, InputGroup, InputLeftElement, Collapse, Badge
} from '@chakra-ui/react'
import { FiFilter, FiRefreshCw, FiHome, FiGrid, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { supabase } from '@/lib/supabase'

interface FiltrosEPSPSQIProps {
  tipo: 'EPS' | 'PSQI'
  onFiltrosChange: (filtros: { empresa: string; setor: string; setorColumn: string }) => void
}


const FiltrosEPSPSQI = ({ tipo, onFiltrosChange }: FiltrosEPSPSQIProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [expanded, setExpanded] = useState(true)
  
  // Estados dos filtros com persistência
  const [empresa, setEmpresa] = useState(() => {
    const saved = localStorage.getItem(`filtros_${tipo}_empresa`)
    return saved || ''
  })
  const [setor, setSetor] = useState(() => {
    const saved = localStorage.getItem(`filtros_${tipo}_setor`)
    return saved || ''
  })
  
  

  
  // Opções disponíveis
  const [empresaOptions, setEmpresaOptions] = useState<string[]>([])
  const [setoresFiltrados, setSetoresFiltrados] = useState<string[]>([])
  const [setorColumnName, setSetorColumnName] = useState<string>('Área/Setor')

  
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
        if (!supabase) {
          console.log(`❌ Supabase não inicializado para carregar empresas ${tipo}`)
          return
        }

        console.log(`🔄 Carregando empresas para ${tipo} da tabela ${tabela}`)

        const { data, error } = await supabase
          .from(tabela)
          .select('empresa_id')
          .not('empresa_id', 'is', null)

        if (error) {
          console.error(`❌ Erro ao carregar empresas para ${tipo}:`, error)
          console.error(`📋 Detalhes do erro:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          return
        }

        console.log(`📊 Dados brutos de empresas para ${tipo}:`, data)
        console.log(`📊 Total de registros de empresas: ${data?.length || 0}`)

        const empresas = Array.from(
          new Set(data?.map(item => item.empresa_id).filter(Boolean) || [])
        ).sort()
        
        setEmpresaOptions(empresas)
        console.log(`✅ Empresas carregadas para ${tipo}:`, empresas)
        console.log(`✅ Total de empresas únicas: ${empresas.length}`)
      } catch (error) {
        console.error(`❌ Erro ao carregar empresas para ${tipo}:`, error)
        if (error instanceof Error) {
          console.error(`📋 Mensagem de erro:`, error.message)
          console.error(`📋 Stack trace:`, error.stack)
        }
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
        console.log(`📋 Usando tabela: ${tabela}`)

        // Primeiro, vamos tentar buscar todos os campos para ver a estrutura
        const { data: sampleData, error: sampleError } = await supabase
          .from(tabela)
          .select('*')
          .limit(1)

        if (sampleError) {
          console.error(`❌ Erro ao buscar dados de exemplo da tabela ${tabela}:`, sampleError)
          return
        }

        console.log(`📊 Estrutura da tabela ${tabela}:`, sampleData?.[0])

        // Agora buscar setores
        let query = supabase
          .from(tabela)
          .select('*') // Buscar todos os campos para debug

        // Filtrar por empresa se selecionada
        if (empresa) {
          query = query.eq('empresa_id', empresa)
          console.log(`🔍 Aplicando filtro de empresa para setores: ${empresa}`)
        } else {
          console.log(`🔍 Buscando setores de todas as empresas`)
        }
        
        // Limitar resultados para performance
        query = query.limit(1000)

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
        console.log(`📊 Total de registros encontrados: ${data?.length || 0}`)

        if (data && data.length > 0) {
          console.log(`📊 Primeiro registro:`, data[0])
          console.log(`📊 Campos disponíveis:`, Object.keys(data[0]))
        }

        // Detectar o nome da coluna de setor e armazená-lo
        let foundColumn = 'Área/Setor' // Default
        if (data && data.length > 0) {
          const firstItem = data[0]
          const possibleColumns = ['Área/Setor', 'area_setor', 'Area_Setor', 'setor', 'Setor', 'area', 'Area']
          const validColumn = possibleColumns.find(col => firstItem[col] !== null && firstItem[col] !== undefined)
          if (validColumn) {
            foundColumn = validColumn
          }
        }
        setSetorColumnName(foundColumn)
        console.log(`✅ Nome da coluna de setor detectado: ${foundColumn}`)
        
        // Usar a coluna detectada para extrair os nomes dos setores
        const setores = Array.from(
          new Set(data?.map((item: any) => item[foundColumn]).filter(Boolean) || [])
        ).sort()
        
        setSetoresFiltrados(setores)

        console.log(`✅ Setores carregados para ${tipo}:`, setores)
        console.log(`✅ Total de setores únicos: ${setores.length}`)
        
        // Verificar se o setor atualmente selecionado ainda está disponível
        if (setor && !setores.includes(setor)) {
          console.log(`⚠️ Setor selecionado "${setor}" não está mais disponível, mantendo seleção`)
          console.log(`📋 Setores disponíveis:`, setores)
          // Não resetar automaticamente, deixar o usuário decidir
        } else if (setor && setores.includes(setor)) {
          console.log(`✅ Setor selecionado "${setor}" ainda está disponível`)
        }
        
        // Log adicional para debug
        console.log(`📋 Empresa atual: "${empresa}"`)
        console.log(`📋 Setor atual: "${setor}"`)
        console.log(`📋 Setores carregados:`, setores)
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

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem(`filtros_${tipo}_empresa`, empresa)
  }, [empresa, tipo])

  useEffect(() => {
    localStorage.setItem(`filtros_${tipo}_setor`, setor)
  }, [setor, tipo])

  // Removido useEffect conflitante - agora é controlado diretamente nas funções

  // Limpar filtros
  const clearFilters = useCallback(() => {
    console.log(`🧹 Limpando filtros para ${tipo}`)
    setEmpresa('')
    setSetor('')
    localStorage.removeItem(`filtros_${tipo}_empresa`)
    localStorage.removeItem(`filtros_${tipo}_setor`)
    onFiltrosChange({ empresa: '', setor: '', setorColumn: 'Área/Setor' })
    console.log(`✅ Filtros limpos para ${tipo}`)
  }, [tipo, onFiltrosChange])


  // Funções para mudança de filtros
  const handleEmpresaChange = useCallback((value: string) => {
    console.log(`🏢 Mudando empresa para: ${value}`)
    setEmpresa(value)
    setSetor('') // Limpar setor quando empresa muda
    // O nome da coluna será re-detectado pelo useEffect de setores
    onFiltrosChange({ empresa: value, setor: '', setorColumn: setorColumnName })
  }, [onFiltrosChange, setorColumnName])


  const handleSetorChange = useCallback((value: string) => {
    console.log(`🏬 Mudando setor para: ${value}`)
    setSetor(value)
    onFiltrosChange({ empresa, setor: value, setorColumn: setorColumnName })
  }, [onFiltrosChange, empresa, setorColumnName])




  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => empresa || setor, [empresa, setor])

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
                      onChange={(e) => handleEmpresaChange(e.target.value)}
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
                      onChange={(e) => handleSetorChange(e.target.value)}
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

export default memo(FiltrosEPSPSQI)
