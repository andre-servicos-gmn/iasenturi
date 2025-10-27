import React, { useState, useRef } from 'react'
import {
  Button,
  Checkbox,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Progress,
  Select,
  Switch,
  Badge
} from '@chakra-ui/react'
import { FiDownload } from 'react-icons/fi'
import { generateExecutiveReport } from '@/lib/pdfExport/templates/ExecutiveTemplate'
import { useFilters } from '@/contexts/store'

type RiskLevel = 'low' | 'medium' | 'high'

export interface AdvancedReportModalProps {
  rootElementId: string
  defaultTitle?: string
  companyName: string
  period: string
  totalEmployees: number
  dominios: Array<{ name: string; score: number; risk: RiskLevel; description?: string }>
}

const AdvancedReportModal: React.FC<AdvancedReportModalProps> = ({
  rootElementId,
  defaultTitle = 'Relatório Senturi',
  companyName,
  period,
  totalEmployees,
  dominios
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const { filters, setFilters, empresas, setoresFiltrados, applyFilters, filteredData } = useFilters()

  const [title, setTitle] = useState(defaultTitle)
  const [fileName, setFileName] = useState('Relatorio-Senturi.pdf')
  const [template, setTemplate] = useState<'executive'>('executive')
  const [logoUrl, setLogoUrl] = useState('')
  const [useGlobalFilters, setUseGlobalFilters] = useState(true)
  const [empresaOverride, setEmpresaOverride] = useState<string>('')
  const [setorOverride, setSetorOverride] = useState<string>('')
  const originalFiltersRef = useRef<typeof filters | null>(null)
  const [sections, setSections] = useState({
    executiveSummary: true,
    domainsAnalysis: true,
    charts: true,
    insights: true,
    recommendations: true
  })
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleOpen = () => {
    // Snapshot current filters to allow restore on close
    originalFiltersRef.current = { ...filters }
    setEmpresaOverride(filters.empresa || '')
    setSetorOverride(filters.setor || '')
    setUseGlobalFilters(true)
    onOpen()
  }

  const handleClose = () => {
    // Restore original filters if overrides were applied
    if (originalFiltersRef.current) {
      setFilters(originalFiltersRef.current)
    }
    onClose()
  }

  const applyOverrideFilters = async () => {
    // Apply temporary filters to the global store so components re-render before capture
    setFilters(prev => ({
      ...prev,
      empresa: empresaOverride,
      setor: setorOverride
    }))
    // Wait for store to apply and fetch
    try {
      await applyFilters()
    } catch {
      // ignore
    }
    // Small delay to allow UI to render
    await new Promise(resolve => setTimeout(resolve, 400))
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setProgress(10)
      // Optionally apply overrides
      if (!useGlobalFilters) {
        setProgress(20)
        await applyOverrideFilters()
      }
      // Build report data from current filteredData to stay in sync with UI
      const values = (filteredData || [])
        .map((r: any) => (r.iseso ? parseFloat(r.iseso) : NaN))
        .filter((v: number) => !isNaN(v))
      const avg = values.length > 0 ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length) : 0
      const effectiveCompany = (useGlobalFilters ? filters.empresa : empresaOverride) || companyName
      const data = { 
        companyName: effectiveCompany,
        period,
        totalEmployees: filteredData?.length || totalEmployees,
        riskLevel: (avg >= 70 ? 'low' : avg >= 50 ? 'medium' : 'high') as RiskLevel,
        dominios
      }

      setProgress(40)
      // Prefer server-side generation when available
      const params = new URLSearchParams({
        empresa: useGlobalFilters ? (filters.empresa || '') : empresaOverride,
        setor: useGlobalFilters ? (filters.setor || '') : setorOverride,
        dataInicio: useGlobalFilters ? (filters.dataInicio || '') : '',
        dataFim: useGlobalFilters ? (filters.dataFim || '') : ''
      })
      const serverUrl = `/api/generate-report?${params.toString()}`
      try {
        setProgress(70)
        const resp = await fetch(serverUrl)
        if (resp.ok) {
          const blob = await resp.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        } else {
          throw new Error('Servidor indisponível, usando fallback local.')
        }
      } catch (e) {
        // Fallback local
        if (template === 'executive') {
          await generateExecutiveReport({
            rootElementId,
            data,
            fileName,
            logoUrl: logoUrl || undefined
          })
        }
      }
      setProgress(100)
      toast({ title: 'PDF gerado com sucesso', status: 'success', duration: 3000, isClosable: true })
      handleClose()
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao gerar PDF', status: 'error', duration: 4000, isClosable: true })
    } finally {
      setIsExporting(false)
      setTimeout(() => setProgress(0), 500)
    }
  }

  return (
    <>
      <Button leftIcon={<FiDownload />} variant="solid" colorScheme="blue" onClick={handleOpen}>
        Exportar Relatório
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Exportação Avançada</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Título</FormLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>Nome do arquivo</FormLabel>
                <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>Logo personalizado (URL opcional)</FormLabel>
                <Input placeholder="/logo_senturi_modo_clarao.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
              </FormControl>

              {/* Filtros do Relatório */}
              <FormControl>
                <FormLabel>Filtros</FormLabel>
                <Stack spacing={3}>
                  <HStack justify="space-between">
                    <HStack>
                      <Switch isChecked={useGlobalFilters} onChange={(e) => setUseGlobalFilters(e.target.checked)} />
                      <Text>Usar filtros globais</Text>
                    </HStack>
                    {useGlobalFilters && (
                      <HStack spacing={2}>
                        {filters.empresa && <Badge colorScheme="blue">Empresa: {filters.empresa}</Badge>}
                        {filters.setor && <Badge colorScheme="green">Setor: {filters.setor}</Badge>}
                      </HStack>
                    )}
                  </HStack>
                  {!useGlobalFilters && (
                    <Stack spacing={3}>
                      <FormControl>
                        <FormLabel>Empresa</FormLabel>
                        <Select
                          placeholder="Todas as empresas"
                          value={empresaOverride}
                          onChange={(e) => {
                            const val = e.target.value
                            setEmpresaOverride(val)
                            // Update global store to refresh setoresFiltrados
                            setFilters(prev => ({ ...prev, empresa: val, setor: '' }))
                            setSetorOverride('')
                          }}
                        >
                          {empresas.map((emp) => (
                            <option key={emp} value={emp}>{emp}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Setor</FormLabel>
                        <Select
                          placeholder="Todos os setores"
                          value={setorOverride}
                          onChange={(e) => {
                            const val = e.target.value
                            setSetorOverride(val)
                            setFilters(prev => ({ ...prev, setor: val }))
                          }}
                          isDisabled={!empresaOverride}
                        >
                          {setoresFiltrados.map((set) => (
                            <option key={set} value={set}>{set}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  )}
                </Stack>
              </FormControl>

              <FormControl>
                <FormLabel>Template</FormLabel>
                <Select value={template} onChange={(e) => setTemplate(e.target.value as 'executive')}>
                  <option value="executive">Executivo</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Seções</FormLabel>
                <Stack>
                  <Checkbox isChecked={sections.executiveSummary} onChange={(e) => setSections(s => ({ ...s, executiveSummary: e.target.checked }))}>Resumo Executivo</Checkbox>
                  <Checkbox isChecked={sections.domainsAnalysis} onChange={(e) => setSections(s => ({ ...s, domainsAnalysis: e.target.checked }))}>Análise por Domínios</Checkbox>
                  <Checkbox isChecked={sections.charts} onChange={(e) => setSections(s => ({ ...s, charts: e.target.checked }))}>Gráficos</Checkbox>
                  <Checkbox isChecked={sections.insights} onChange={(e) => setSections(s => ({ ...s, insights: e.target.checked }))}>Insights</Checkbox>
                  <Checkbox isChecked={sections.recommendations} onChange={(e) => setSections(s => ({ ...s, recommendations: e.target.checked }))}>Recomendações</Checkbox>
                </Stack>
              </FormControl>

              {isExporting && (
                <Stack>
                  <Text>Gerando PDF...</Text>
                  <Progress value={progress} size="sm" colorScheme="blue" />
                </Stack>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button onClick={onClose} variant="ghost">Cancelar</Button>
              <Button colorScheme="blue" onClick={handleExport} isLoading={isExporting}>Gerar</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default AdvancedReportModal








