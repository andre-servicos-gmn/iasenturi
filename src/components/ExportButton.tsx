import React, { useState } from 'react'
import { Button, useToast, useColorModeValue } from '@chakra-ui/react'
import { FiDownload } from 'react-icons/fi'
import { exportToPDF, waitForCharts } from '@/lib/pdfExport'

interface ExportButtonProps {
  elementId: string
  filename?: string
  title?: string
  subtitle?: string
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'ghost'
  isLoading?: boolean
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: Error) => void
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  elementId,
  filename,
  title = 'Relatório Senturi',
  subtitle,
  children = 'Exportar PDF',
  size = 'md',
  variant = 'solid',
  isLoading: externalLoading,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const toast = useToast()
  
  const isLoading = externalLoading || isExporting
  
  // Cores baseadas no tema
  const bgColor = useColorModeValue('white', 'gray.800')
  const isDarkMode = useColorModeValue(false, true)
  
  const handleExport = async () => {
    try {
      setIsExporting(true)
      onExportStart?.()
      
      // Aguardar os gráficos renderizarem
      await waitForCharts()
      
      // Exportar PDF
      await exportToPDF({
        elementId,
        filename,
        backgroundColor: bgColor,
        title,
        subtitle,
        isDarkMode
      })
      
      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O arquivo foi baixado automaticamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onExportComplete?.()
      
    } catch (error) {
      console.error('Erro na exportação:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na exportação'
      
      toast({
        title: 'Erro ao gerar PDF',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      onExportError?.(error instanceof Error ? error : new Error(errorMessage))
      
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <Button
      leftIcon={<FiDownload />}
      onClick={handleExport}
      isLoading={isLoading}
      loadingText="Gerando PDF..."
      disabled={isLoading}
      size={size}
      variant={variant}
      bgGradient={variant === 'solid' ? "linear(135deg, #0D249B 0%, #1A45FC 100%)" : undefined}
      _hover={variant === 'solid' ? {
        bgGradient: "linear(135deg, #1A45FC 0%, #0D249B 100%)",
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(26, 69, 252, 0.4)'
      } : undefined}
      _active={variant === 'solid' ? {
        transform: 'translateY(0)',
        boxShadow: '0 2px 8px rgba(26, 69, 252, 0.3)'
      } : undefined}
      color={variant === 'solid' ? 'white' : undefined}
      borderRadius="lg"
      fontWeight="medium"
    >
      {children}
    </Button>
  )
}

export default ExportButton
