import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Select,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react'
import { FiDownload } from 'react-icons/fi'
import { useFilters } from '@/contexts/store'
import { generatePDFReport } from '@/lib/pdfExport'

export const ExportButton = () => {
  const toast = useToast()
  const { filteredData, filters, empresas } = useFilters()
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>(filters.empresa || '')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setSelectedEmpresa(filters.empresa || '')
  }, [filters.empresa])

  const totalConsidered = useMemo(() => {
    if (!selectedEmpresa) return filteredData.length
    return filteredData.filter(item => item.empresa_id === selectedEmpresa).length
  }, [filteredData, selectedEmpresa])

  const handleExport = async () => {
    if (filteredData.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Ajuste os filtros globais ou selecione outra empresa.',
        status: 'warning',
        duration: 4000,
        isClosable: true
      })
      return
    }

    setExporting(true)
    try {
      let heatmapDataUrl: string | undefined
      let heatmapWidth: number | undefined
      let heatmapHeight: number | undefined
      const heatmapElement = document.getElementById('heatmap-relatorio')
      if (heatmapElement) {
        try {
          const { default: html2canvas } = await import('html2canvas')
          const canvas = await html2canvas(heatmapElement, {
            scale: Math.max(window.devicePixelRatio || 2, 3), // aumenta resolução da captura
            useCORS: true,
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            backgroundColor: '#f8fafc'
          })
          heatmapDataUrl = canvas.toDataURL('image/png')
          heatmapWidth = canvas.width
          heatmapHeight = canvas.height
        } catch (error) {
          console.warn('Falha ao capturar mapa de calor:', error)
        }
      } else {
        console.warn('Elemento do mapa de calor n�o encontrado (id="heatmap-relatorio"). Abra a p�gina de Mapa de Calor antes de exportar.')
      }

      await generatePDFReport({
        data: filteredData,
        filters,
        selectedEmpresa: selectedEmpresa || undefined,
        heatmapImage: heatmapDataUrl && heatmapWidth && heatmapHeight
          ? { dataUrl: heatmapDataUrl, width: heatmapWidth, height: heatmapHeight }
          : undefined
      })
      toast({
        title: 'Relatorio gerado',
        description: 'O PDF foi criado com base nos filtros atuais.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      console.error('Erro ao exportar relatorio:', error)
      toast({
        title: 'Erro ao exportar',
        description: 'Tente novamente em instantes.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Popover placement="bottom-end" closeOnBlur={!exporting}>
      <PopoverTrigger>
        <Button
          leftIcon={<FiDownload />}
          colorScheme="blue"
          variant="solid"
          isLoading={exporting}
          loadingText="Exportando..."
          size="sm"
        >
          Exportar Relatorio
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton isDisabled={exporting} />
        <PopoverHeader fontWeight="bold">Filtro do relatorio</PopoverHeader>
        <PopoverBody>
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" color="gray.600">
              Usa os mesmos filtros globais (setor, periodo) e permite escolher qual empresa incluir no PDF.
            </Text>
            <Select
              placeholder="Todas as empresas"
              value={selectedEmpresa}
              onChange={(event) => setSelectedEmpresa(event.target.value)}
              size="sm"
            >
              {empresas.map(empresa => (
                <option key={empresa} value={empresa}>{empresa}</option>
              ))}
            </Select>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">
                Registros considerados: {totalConsidered}
              </Text>
              <Button
                colorScheme="blue"
                size="sm"
                onClick={handleExport}
                isLoading={exporting}
              >
                Gerar PDF
              </Button>
            </HStack>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
