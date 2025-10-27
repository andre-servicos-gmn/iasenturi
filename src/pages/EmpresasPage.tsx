import {
  Box, VStack, HStack, Text, useColorModeValue, Card, CardBody,
  Badge, Button, Table, Thead, Tbody, Tr, Th, Td,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, useDisclosure, FormControl, FormLabel, Input, Select,
  Textarea, IconButton, Tooltip
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiBriefcase,
  FiCalendar, FiClock, FiPackage
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

interface Empresa {
  id: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  tipo_servico: string
  data_solicitacao: string
  data_entrega: string
  status: string
  observacoes: string
  created_at: string
  updated_at: string
}


const EmpresasPage = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('#E5E7EB', 'gray.600')
  
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
  
  const modal = useDisclosure()
  const viewModal = useDisclosure()
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    tipo_servico: '',
    data_solicitacao: '',
    data_entrega: '',
    status: 'ativa',
    observacoes: ''
  })

  useEffect(() => {
    loadEmpresas()
  }, [])

  const loadEmpresas = async () => {
    try {
      setLoading(true)
      if (!supabase) return

      const { data, error } = await supabase
        .from('empresas_servicos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar empresas:', error)
        return
      }

      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!supabase) return

      const dataToInsert = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      if (selectedEmpresa) {
        // Atualizar
        const { error } = await supabase
          .from('empresas_servicos')
          .update(dataToInsert)
          .eq('id', selectedEmpresa.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('empresas_servicos')
          .insert([dataToInsert])

        if (error) throw error
      }

      modal.onClose()
      resetForm()
      loadEmpresas()
    } catch (error) {
      console.error('Erro ao salvar empresa:', error)
      alert('Erro ao salvar empresa. Verifique os dados e tente novamente.')
    }
  }

  const handleEdit = (empresa: Empresa) => {
    setSelectedEmpresa(empresa)
    setFormData({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone,
      endereco: empresa.endereco,
      tipo_servico: empresa.tipo_servico,
      data_solicitacao: empresa.data_solicitacao ? empresa.data_solicitacao.split('T')[0] : '',
      data_entrega: empresa.data_entrega ? empresa.data_entrega.split('T')[0] : '',
      status: empresa.status,
      observacoes: empresa.observacoes
    })
    modal.onOpen()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return

    try {
      if (!supabase) return

      const { error } = await supabase
        .from('empresas_servicos')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadEmpresas()
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      alert('Erro ao excluir empresa.')
    }
  }

  const handleView = (empresa: Empresa) => {
    setSelectedEmpresa(empresa)
    viewModal.onOpen()
  }

  const resetForm = () => {
    setSelectedEmpresa(null)
    setFormData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      tipo_servico: '',
      data_solicitacao: '',
      data_entrega: '',
      status: 'ativa',
      observacoes: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'green'
      case 'suspensa': return 'yellow'
      case 'encerrada': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativa': return 'Ativa'
      case 'suspensa': return 'Suspensa'
      case 'encerrada': return 'Encerrada'
      default: return status
    }
  }

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        <Text>Carregando empresas...</Text>
      </VStack>
    )
  }

  return (
    <>
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VStack spacing={6} align="stretch">
        {/* Cabeçalho */}
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
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg="#0D249B"
                  borderRadius="lg"
                  color="white"
                >
                  <FiBriefcase size={20} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>
                    Cadastro de Empresas
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Gerencie empresas e serviços contratados
                  </Text>
                </VStack>
              </HStack>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={() => {
                  resetForm()
                  modal.onOpen()
                }}
              >
                Nova Empresa
              </Button>
            </HStack>
          </CardBody>
        </MotionCard>

        {/* Tabela de Empresas */}
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
            {empresas.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Empresa</Th>
                      <Th>CNPJ</Th>
                      <Th>Tipo de Serviço</Th>
                      <Th>Data Solicitação</Th>
                      <Th>Data Entrega</Th>
                      <Th>Status</Th>
                      <Th isNumeric>Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {empresas.map((empresa) => (
                      <Tr key={empresa.id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold">{empresa.nome}</Text>
                            <Text fontSize="xs" color="gray.500">{empresa.email}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{empresa.cnpj}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{empresa.tipo_servico}</Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <FiCalendar size={14} />
                            <Text fontSize="sm">
                              {empresa.data_solicitacao 
                                ? new Date(empresa.data_solicitacao).toLocaleDateString('pt-BR')
                                : '-'}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <FiClock size={14} />
                            <Text fontSize="sm">
                              {empresa.data_entrega
                                ? new Date(empresa.data_entrega).toLocaleDateString('pt-BR')
                                : '-'}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(empresa.status)}>
                            {getStatusText(empresa.status)}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <HStack justify="flex-end" spacing={2}>
                            <Tooltip label="Visualizar">
                              <IconButton
                                aria-label="Visualizar"
                                icon={<FiEye />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(empresa)}
                              />
                            </Tooltip>
                            <Tooltip label="Editar">
                              <IconButton
                                aria-label="Editar"
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => handleEdit(empresa)}
                              />
                            </Tooltip>
                            <Tooltip label="Excluir">
                              <IconButton
                                aria-label="Excluir"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(empresa.id)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box textAlign="center" py={10}>
                <FiPackage size={48} color="gray" style={{ margin: '0 auto' }} />
                <Text mt={4} color="gray.500">Nenhuma empresa cadastrada</Text>
                <Button
                  mt={4}
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  onClick={() => {
                    resetForm()
                    modal.onOpen()
                  }}
                >
                  Cadastrar Primeira Empresa
                </Button>
              </Box>
            )}
          </CardBody>
        </MotionCard>
      </VStack>
    </MotionBox>

    {/* Modal de Cadastro/Edição */}
    <Modal isOpen={modal.isOpen} onClose={() => { modal.onClose(); resetForm(); }} size="xl">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {selectedEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome da Empresa</FormLabel>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome da empresa"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>CNPJ</FormLabel>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </FormControl>

              <HStack w="100%" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Endereço</FormLabel>
                <Textarea
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tipo de Serviço</FormLabel>
                <Input
                  value={formData.tipo_servico}
                  onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })}
                  placeholder="Digite o tipo de serviço"
                />
              </FormControl>

              <HStack w="100%" spacing={4}>
                <FormControl>
                  <FormLabel>Data de Solicitação</FormLabel>
                  <Input
                    type="date"
                    value={formData.data_solicitacao}
                    onChange={(e) => setFormData({ ...formData, data_solicitacao: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Data de Entrega</FormLabel>
                  <Input
                    type="date"
                    value={formData.data_entrega}
                    onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="ativa">Ativa</option>
                  <option value="suspensa">Suspensa</option>
                  <option value="encerrada">Encerrada</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Observações</FormLabel>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre a empresa ou serviço"
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { modal.onClose(); resetForm(); }}>
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit">
              {selectedEmpresa ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>

    {/* Modal de Visualização */}
    <Modal isOpen={viewModal.isOpen} onClose={viewModal.onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes da Empresa</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {selectedEmpresa && (
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" color="gray.500">Nome</Text>
                <Text fontSize="md" fontWeight="semibold">{selectedEmpresa.nome}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">CNPJ</Text>
                <Text fontSize="md">{selectedEmpresa.cnpj}</Text>
              </Box>
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Email</Text>
                  <Text fontSize="md">{selectedEmpresa.email}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Telefone</Text>
                  <Text fontSize="md">{selectedEmpresa.telefone || '-'}</Text>
                </Box>
              </HStack>
              <Box>
                <Text fontSize="sm" color="gray.500">Endereço</Text>
                <Text fontSize="md">{selectedEmpresa.endereco || '-'}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">Tipo de Serviço</Text>
                <Text fontSize="md">{selectedEmpresa.tipo_servico}</Text>
              </Box>
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Data de Solicitação</Text>
                  <Text fontSize="md">
                    {selectedEmpresa.data_solicitacao
                      ? new Date(selectedEmpresa.data_solicitacao).toLocaleDateString('pt-BR')
                      : '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Data de Entrega</Text>
                  <Text fontSize="md">
                    {selectedEmpresa.data_entrega
                      ? new Date(selectedEmpresa.data_entrega).toLocaleDateString('pt-BR')
                      : '-'}
                  </Text>
                </Box>
              </HStack>
              <Box>
                <Text fontSize="sm" color="gray.500">Status</Text>
                <Badge colorScheme={getStatusColor(selectedEmpresa.status)} mt={1}>
                  {getStatusText(selectedEmpresa.status)}
                </Badge>
              </Box>
              {selectedEmpresa.observacoes && (
                <Box>
                  <Text fontSize="sm" color="gray.500">Observações</Text>
                  <Text fontSize="md" mt={1}>{selectedEmpresa.observacoes}</Text>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={viewModal.onClose}>
            Fechar
          </Button>
          {selectedEmpresa && (
            <Button
              colorScheme="blue"
              onClick={() => {
                viewModal.onClose()
                handleEdit(selectedEmpresa)
              }}
            >
              Editar
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  )
}

export default EmpresasPage
