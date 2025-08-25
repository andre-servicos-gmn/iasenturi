import React, { useState } from 'react'
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
  Select
} from '@chakra-ui/react'
import { FiDownload } from 'react-icons/fi'
import { generateExecutiveReport } from '@/lib/pdfExport/templates/ExecutiveTemplate'

type RiskLevel = 'low' | 'medium' | 'high'

export interface AdvancedReportModalProps {
  rootElementId: string
  defaultTitle?: string
  companyName: string
  period: string
  totalEmployees: number
  riskLevel: RiskLevel
  dominios: Array<{ name: string; score: number; risk: RiskLevel; description?: string }>
}

const AdvancedReportModal: React.FC<AdvancedReportModalProps> = ({
  rootElementId,
  defaultTitle = 'Relatório Senturi',
  companyName,
  period,
  totalEmployees,
  riskLevel,
  dominios
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [title, setTitle] = useState(defaultTitle)
  const [fileName, setFileName] = useState('Relatorio-Senturi.pdf')
  const [template, setTemplate] = useState<'executive'>('executive')
  const [sections, setSections] = useState({
    executiveSummary: true,
    domainsAnalysis: true,
    charts: true,
    insights: true,
    recommendations: true
  })
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setProgress(10)
      const data = { companyName, period, totalEmployees, riskLevel, dominios }

      setProgress(30)
      if (template === 'executive') {
        await generateExecutiveReport({
          rootElementId,
          data,
          fileName
        })
      }
      setProgress(100)
      toast({ title: 'PDF gerado com sucesso', status: 'success', duration: 3000, isClosable: true })
      onClose()
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
      <Button leftIcon={<FiDownload />} variant="solid" colorScheme="blue" onClick={onOpen}>
        Exportar Relatório
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
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







