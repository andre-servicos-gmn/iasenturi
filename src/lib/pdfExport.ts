// import domtoimage from 'dom-to-image-more'
// import jsPDF from 'jspdf'
import { captureElementAsPng } from './pdfExport/core/ChartCapture'
import { createPdfContext, drawHeader, drawFooter } from './pdfExport/core/LayoutEngine'

interface ExportOptions {
  elementId: string
  filename?: string
  backgroundColor?: string
  logoUrl?: string
  title?: string
  subtitle?: string
  isDarkMode?: boolean
}

export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  const {
    elementId,
    filename,
    backgroundColor = '#ffffff',
    // logoUrl,
    title = 'Relatório Senturi',
    subtitle,
    // isDarkMode = false
  } = options

  try {
    // Buscar o elemento a ser exportado
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Elemento com ID '${elementId}' não encontrado`)
    }

    // Determinar o logo baseado no tema se não fornecido
    // const finalLogoUrl = logoUrl || (isDarkMode ? '/logo_senturi_modo_escuro.png' : '/logo_senturi_modo_clarao.png')

    // Capturar o elemento como imagem (alta qualidade)
    const dataUrl = await captureElementAsPng({ element, scale: 2, backgroundColor })
    
    // Criar PDF via engine de layout
    const ctx = createPdfContext('p')
    const pdf = ctx.pdf
    const pageWidth = ctx.pageWidth
    const pageHeight = ctx.pageHeight
    
    // Margens do PDF
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)
    
    // Calcular dimensões da imagem mantendo proporção
    const imgAspectRatio = element.scrollWidth / element.scrollHeight
    let imgWidth = contentWidth
    let imgHeight = contentWidth / imgAspectRatio
    
    // Se a altura for maior que o espaço disponível, ajustar
    if (imgHeight > contentHeight) {
      imgHeight = contentHeight
      imgWidth = imgHeight * imgAspectRatio
    }
    
    // Centralizar horizontalmente
    const imgX = margin + (contentWidth - imgWidth) / 2
    // Header e posicionamento
    drawHeader(ctx, { title, subtitle, showPageNumbers: true })
    let imgY = ctx.margins.top + 8
    
    // Adicionar a imagem principal
    pdf.addImage(dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight)
    
    // Rodapé padrão
    drawFooter(ctx, { showPageNumbers: true }, pdf.getNumberOfPages())
    
    // Nome do arquivo
    const now = new Date()
    const defaultFilename = filename || `Relatorio-Senturi-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`
    
    // Salvar PDF
    pdf.save(defaultFilename)
    
  } catch (error) {
    console.error('Erro ao exportar PDF:', error)
    throw new Error('Falha ao gerar PDF. Tente novamente.')
  }
}

// Função auxiliar para verificar se o elemento está visível
export const isElementVisible = (elementId: string): boolean => {
  const element = document.getElementById(elementId)
  if (!element) return false
  
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

// Função para aguardar o carregamento dos gráficos
export const waitForCharts = async (timeout = 3000): Promise<void> => {
  return new Promise((resolve) => {
    // Aguardar um tempo para os gráficos renderizarem
    setTimeout(resolve, timeout)
  })
}
