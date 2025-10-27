import jsPDF from 'jspdf'
import { createPdfContext, drawHeader, drawFooter, addCoverPage, LayoutContext } from './LayoutEngine'
import { captureElementAsPng } from './ChartCapture'
import { SENTURI_BRAND } from '../utils/brandUtils'
import { generateTexts } from '@/lib/pdfExport/content/ContentGenerator'

export interface DashboardData {
  companyName: string
  period: string
  totalEmployees: number
  riskLevel: 'low' | 'medium' | 'high'
  dominios: Array<{
    name: string
    score: number
    risk: 'low' | 'medium' | 'high'
    description?: string
  }>
}

export interface SectionConfig {
  executiveSummary?: boolean
  domainsAnalysis?: boolean
  charts?: boolean
  insights?: boolean
  recommendations?: boolean
}

export interface GenerateParams {
  rootElementId: string
  data: DashboardData
  fileName?: string
  logoUrl?: string
  sectionConfig?: SectionConfig
  title?: string
  chartIds?: string[]
}

export class PDFGenerator {
  private ctx: LayoutContext
  private pdf: jsPDF

  constructor() {
    this.ctx = createPdfContext('p')
    this.pdf = this.ctx.pdf
  }

  private async fetchImageDataUrl(url: string): Promise<string | undefined> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch {
      return undefined
    }
  }

  private addNewPage(title?: string, subtitle?: string, showPageNumbers = true) {
    if (this.pdf.getNumberOfPages() > 0) {
      this.pdf.addPage()
    }
    drawHeader(this.ctx, { title, subtitle, showPageNumbers })
    drawFooter(this.ctx, { showPageNumbers }, this.pdf.getNumberOfPages())
  }

  async generate(params: GenerateParams): Promise<jsPDF> {
    const { data, fileName, logoUrl, rootElementId } = params
    const title = params.title || 'Relatório Senturi'

    const logoDataUrl = logoUrl ? await this.fetchImageDataUrl(logoUrl) : undefined

    await addCoverPage(this.ctx, {
      title,
      companyName: data.companyName,
      period: data.period,
      logoDataUrl
    })
    const sections: Required<SectionConfig> = {
      executiveSummary: true,
      domainsAnalysis: true,
      charts: true,
      insights: true,
      recommendations: true,
      ...(params.sectionConfig || {})
    }

    const texts = generateTexts(data)

    if (sections.executiveSummary) {
      this.addNewPage('Sumário Executivo')
      this.pdf.setFont(SENTURI_BRAND.fonts.body, 'normal')
      this.pdf.setFontSize(12)
      const x = this.ctx.margins.left
      let y = this.ctx.margins.top + 10
      const lines = this.pdf.splitTextToSize(texts.executiveSummary, this.ctx.contentWidth)
      const lineHeight = 6
      for (const line of lines as string[]) {
        if (y > this.ctx.pageHeight - this.ctx.margins.bottom - lineHeight) {
          this.addNewPage('Sumário Executivo (cont.)')
          y = this.ctx.margins.top + 10
        }
        this.pdf.text(line, x, y)
        y += lineHeight
      }
    }

    if (sections.domainsAnalysis) {
      this.addNewPage('Análise por Domínios')
      this.pdf.setFont(SENTURI_BRAND.fonts.title, 'bold')
      this.pdf.setFontSize(12)
      let y = this.ctx.margins.top + 8
      const x = this.ctx.margins.left
      this.pdf.text('Domínio', x, y)
      this.pdf.text('Score', x + this.ctx.contentWidth - 25, y)
      this.pdf.setFont(SENTURI_BRAND.fonts.body, 'normal')
      y += 8
      data.dominios.forEach(d => {
        if (y > this.ctx.pageHeight - this.ctx.margins.bottom - 12) {
          this.addNewPage('Análise por Domínios (cont.)')
          y = this.ctx.margins.top + 8
        }
        this.pdf.text(d.name, x, y)
        this.pdf.text(String(Math.round(d.score)), x + this.ctx.contentWidth - 20, y)
        y += 7
      })
    }

    if (sections.charts) {
      const chartIds = params.chartIds && params.chartIds.length > 0
        ? params.chartIds
        : [
            // Elementos focados nos gráficos reais (menos bordas/padding)
            'domain-scores-chart', // Radar
            'heatmap-chart',       // Heatmap
            'eps10-gauge',         // Gauge EPS
            'psqi-gauge',          // Gauge PSQI
            'relatorio-senturi'    // Fallback
          ]

      // Capturar gráficos individuais; fallback para o root quando necessário
      const charts: { id: string; dataUrl: string; width: number; height: number }[] = []
      for (const id of chartIds) {
        const el = document.getElementById(id)
        if (el) {
          const dataUrl = await captureElementAsPng({ element: el, scale: 2, backgroundColor: '#ffffff' })
          const dims = await new Promise<{ w: number; h: number }>((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height })
            img.src = dataUrl
          })
          charts.push({ id, dataUrl, width: dims.w, height: dims.h })
        }
      }

      if (charts.length === 0) {
        const element = document.getElementById(rootElementId)
        if (element) {
          const dataUrl = await captureElementAsPng({ element, scale: 2, backgroundColor: '#ffffff' })
          const dims = await new Promise<{ w: number; h: number }>((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height })
            img.src = dataUrl
          })
          charts.push({ id: rootElementId, dataUrl, width: dims.w, height: dims.h })
        }
      }

      if (charts.length > 0) {
        const maxW = this.ctx.contentWidth
        const maxH = this.ctx.contentHeight
        for (let i = 0; i < charts.length; i++) {
          const c = charts[i]
          const ratio = c.width / c.height
          let w = maxW
          let h = w / ratio
          if (h > maxH) {
            h = maxH
            w = h * ratio
          }
          this.addNewPage(i === 0 ? 'Gráficos e Indicadores' : 'Gráficos e Indicadores (cont.)')
          const centeredX = this.ctx.margins.left + (maxW - w) / 2
          const y = this.ctx.margins.top + 8
          this.pdf.addImage(c.dataUrl, 'PNG', centeredX, y, w, h)
        }
      }
    }

    if (sections.insights) {
      this.addNewPage('Insights')
      this.pdf.setFont(SENTURI_BRAND.fonts.body, 'normal')
      this.pdf.setFontSize(12)
      let y = this.ctx.margins.top + 10
      for (const insight of texts.insights) {
        if (y > this.ctx.pageHeight - this.ctx.margins.bottom - 10) {
          this.addNewPage('Insights (cont.)')
          y = this.ctx.margins.top + 10
        }
        this.pdf.text(`• ${insight}`, this.ctx.margins.left, y)
        y += 8
      }
    }

    if (sections.recommendations) {
      this.addNewPage('Recomendações')
      this.pdf.setFont(SENTURI_BRAND.fonts.body, 'normal')
      this.pdf.setFontSize(12)
      let y = this.ctx.margins.top + 10
      for (const rec of texts.recommendations) {
        if (y > this.ctx.pageHeight - this.ctx.margins.bottom - 10) {
          this.addNewPage('Recomendações (cont.)')
          y = this.ctx.margins.top + 10
        }
        this.pdf.text(`• ${rec}`, this.ctx.margins.left, y)
        y += 8
      }
    }

    if (fileName) {
      // Caller can choose to save outside
      this.pdf.save(fileName)
    }
    return this.pdf
  }
}


