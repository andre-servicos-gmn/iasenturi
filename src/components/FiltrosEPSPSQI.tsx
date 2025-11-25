import {
  Box, VStack, HStack, Text, useColorModeValue, Card, CardBody,
  Select, Input, Button, InputGroup, InputLeftElement, Collapse
} from '@chakra-ui/react'
import { FiFilter, FiSearch, FiRefreshCw, FiHome, FiGrid, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useState } from 'react'

interface FiltrosEPSPSQIProps {
  filters: {
    empresa: string
    setor: string
    dataInicio: string
    dataFim: string
  }
  onFiltersChange: (filters: any) => void
  empresas: string[]
  setoresFiltrados: string[]
}

const FiltrosEPSPSQI = ({ filters, onFiltersChange, empresas, setoresFiltrados }: FiltrosEPSPSQIProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [expanded, setExpanded] = useState(true)

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      empresa: '',
      setor: '',
      dataInicio: '',
      dataFim: ''
    })
  }

  const applyFilters = () => {
    // Os filtros são aplicados automaticamente pelo componente pai
    console.log('Filtros EPS/PSQI aplicados:', filters)
  }

  const hasActiveFilters = filters.empresa || filters.setor || filters.dataInicio || filters.dataFim

  return (
    <Card
      variant="outline"
      w="full"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      borderRadius="xl"
    >
      <CardBody p={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Box
                p={2}
                bg="senturi.azulProfundo"
                borderRadius="lg"
                color="white"
              >
                <FiFilter size={20} />
              </Box>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Filtros EPS/PSQI
              </Text>
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
            style={{ willChange: 'height', overflow: 'hidden' }}
          >
            {/* Filtros em Grid */}
            <Box>
              <HStack spacing={4} wrap="wrap" gap={4}>
                {/* Empresa */}
                <Box minW="200px" flex="1">
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Empresa
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiHome color="gray.400" />
                    </InputLeftElement>
                    <Select
                      placeholder="Todas as empresas"
                      value={filters.empresa}
                      onChange={(e) => handleFilterChange('empresa', e.target.value)}
                      size="md"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'gray.400',
                        boxShadow: 'none',
                      }}
                      pl={10}
                    >
                      {empresas.map((empresa) => (
                        <option key={empresa} value={empresa}>
                          {empresa}
                        </option>
                      ))}
                    </Select>
                  </InputGroup>
                </Box>

                {/* Setor */}
                <Box minW="200px" flex="1">
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Setor
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiGrid color="gray.400" />
                    </InputLeftElement>
                    <Select
                      placeholder="Todos os setores"
                      value={filters.setor}
                      onChange={(e) => handleFilterChange('setor', e.target.value)}
                      size="md"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'gray.400',
                        boxShadow: 'none',
                      }}
                      isDisabled={!filters.empresa}
                      pl={10}
                    >
                      {setoresFiltrados.map((setor) => (
                        <option key={setor} value={setor}>
                          {setor}
                        </option>
                      ))}
                    </Select>
                  </InputGroup>
                </Box>

                {/* Data Início */}
                <Box minW="200px" flex="1">
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Data Início
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiCalendar color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="date"
                      value={filters.dataInicio}
                      onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                      size="md"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'gray.400',
                        boxShadow: 'none',
                      }}
                      placeholder="De: dd/mm/aaaa"
                      pl={10}
                    />
                  </InputGroup>
                </Box>

                {/* Data Fim */}
                <Box minW="200px" flex="1">
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Data Fim
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiCalendar color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="date"
                      value={filters.dataFim}
                      onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                      size="md"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'gray.400',
                        boxShadow: 'none',
                      }}
                      placeholder="Até: dd/mm/aaaa"
                      pl={10}
                    />
                  </InputGroup>
                </Box>

                {/* Botão Aplicar */}
                <Box minW="150px">
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    &nbsp;
                  </Text>
                  <Button
                    leftIcon={<FiSearch />}
                    bgGradient="linear(135deg, senturi.azulProfundo 0%, senturi.azulMedio 100%)"
                    _hover={{
                      bgGradient: "linear(135deg, senturi.azulMedio 0%, senturi.azulProfundo 100%)",
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(26, 69, 252, 0.4)'
                    }}
                    _active={{
                      transform: 'translateY(0)',
                      boxShadow: '0 2px 8px rgba(26, 69, 252, 0.3)'
                    }}
                    color="white"
                    size="md"
                    w="full"
                    borderRadius="lg"
                    fontWeight="medium"
                    onClick={applyFilters}
                  >
                    Aplicar
                  </Button>
                </Box>
              </HStack>
            </Box>
          </Collapse>

          {/* Filtros Ativos */}
          {hasActiveFilters && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                Filtros ativos:
              </Text>
              <HStack spacing={2} wrap="wrap">
                {filters.empresa && (
                  <Box
                    bg="blue.50"
                    color="blue.700"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="medium"
                    border="1px solid"
                    borderColor="blue.200"
                  >
                    🏢 {filters.empresa}
                  </Box>
                )}
                {filters.setor && (
                  <Box
                    bg="green.50"
                    color="green.700"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="medium"
                    border="1px solid"
                    borderColor="green.200"
                  >
                    🏬 {filters.setor}
                  </Box>
                )}
                {filters.dataInicio && (
                  <Box
                    bg="orange.50"
                    color="orange.700"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="medium"
                    border="1px solid"
                    borderColor="orange.200"
                  >
                    📅 De: {filters.dataInicio}
                  </Box>
                )}
                {filters.dataFim && (
                  <Box
                    bg="orange.50"
                    color="orange.700"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="medium"
                    border="1px solid"
                    borderColor="orange.200"
                  >
                    📅 Até: {filters.dataFim}
                  </Box>
                )}
              </HStack>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

export default FiltrosEPSPSQI