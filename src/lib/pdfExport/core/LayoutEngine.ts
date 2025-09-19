import jsPDF from 'jspdf'
import { SENTURI_BRAND, hexToRgb } from '../utils/brandUtils'

export interface PageMargins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface HeaderFooterInfo {
  title?: string
  subtitle?: string
  showPageNumbers?: boolean
}

export interface LayoutContext {
  pdf: jsPDF
  pageWidth: number
  pageHeight: number
  contentWidth: number
  contentHeight: number
  margins: PageMargins
}

export const createPdfContext = (orientation: 'p' | 'l' = 'p'): LayoutContext => {
  const pdf = new jsPDF(orientation, 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margins: PageMargins = { top: 22, right: 16, bottom: 16, left: 16 }
  const contentWidth = pageWidth - margins.left - margins.right
  const contentHeight = pageHeight - margins.top - margins.bottom
  return { pdf, pageWidth, pageHeight, contentWidth, contentHeight, margins }
}

export const drawHeader = (ctx: LayoutContext, info: HeaderFooterInfo) => {
  const { pdf, margins, pageWidth } = ctx
  const brand = SENTURI_BRAND
  const blue = hexToRgb(brand.primaryColor)

  pdf.setDrawColor(blue.r, blue.g, blue.b)
  pdf.setFillColor(blue.r, blue.g, blue.b)
  // Accent bar
  pdf.rect(0, 0, pageWidth, 10, 'F')

  if (info.title) {
    pdf.setFont(brand.fonts.title, 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(255, 255, 255)
    pdf.text(info.title, margins.left, 7)
  }

  if (info.subtitle) {
    pdf.setFont(brand.fonts.body, 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(240, 240, 240)
    pdf.text(info.subtitle, margins.left, 12)
  }
}

export const drawFooter = (ctx: LayoutContext, info: HeaderFooterInfo, pageNumber: number, totalPages?: number) => {
  const { pdf, pageWidth, pageHeight, margins } = ctx
  const brand = SENTURI_BRAND
  const gray = 120
  pdf.setTextColor(gray, gray, gray)
  pdf.setFont(brand.fonts.body, 'normal')
  pdf.setFontSize(9)
  const text = info.showPageNumbers ? `Página ${pageNumber}${totalPages ? ` de ${totalPages}` : ''}` : ''
  if (text) {
    const textWidth = pdf.getTextWidth(text)
    pdf.text(text, pageWidth - margins.right - textWidth, pageHeight - 6)
  }
}

export const addCoverPage = async (
  ctx: LayoutContext,
  params: { title: string; companyName: string; period: string; logoDataUrl?: string }
) => {
  const { pdf, pageWidth, pageHeight } = ctx
  const brand = SENTURI_BRAND
  const primary = hexToRgb(brand.primaryColor)
  const secondary = hexToRgb(brand.secondaryColor)

  // Background block
  pdf.setFillColor(secondary.r, secondary.g, secondary.b)
  pdf.rect(0, 0, pageWidth, pageHeight * 0.35, 'F')
  pdf.setFillColor(primary.r, primary.g, primary.b)
  pdf.rect(0, pageHeight * 0.3, pageWidth, pageHeight * 0.05, 'F')

  // Optional decorative cover image if provided by branding
  if (brand.coverImagePath) {
    try {
      const resp = await fetch(brand.coverImagePath)
      const blob = await resp.blob()
      const dataUrl: string = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      const imgW = pageWidth
      const imgH = pageHeight * 0.45
      pdf.addImage(dataUrl, 'PNG', 0, pageHeight * 0.35, imgW, imgH, undefined, 'FAST')
    } catch {}
  }

  // Title
  pdf.setFont(brand.fonts.title, 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.text(params.title, 16, pageHeight * 0.2)

  pdf.setFont(brand.fonts.body, 'normal')
  pdf.setFontSize(12)
  pdf.text(`Empresa: ${params.companyName}`, 16, pageHeight * 0.24)
  pdf.text(`Período: ${params.period}`, 16, pageHeight * 0.29)

  // Logo
  const logoDataUrl = params.logoDataUrl
  if (logoDataUrl) {
    const logoW = 50
    const logoH = 18
    pdf.addImage(logoDataUrl, 'PNG', pageWidth - logoW - 16, 16, logoW, logoH)
  } else if (brand.logoPath) {
    try {
      const resp = await fetch(brand.logoPath)
      const blob = await resp.blob()
      const dataUrl: string = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      const logoW = 50
      const logoH = 18
      pdf.addImage(dataUrl, 'PNG', pageWidth - logoW - 16, 16, logoW, logoH)
    } catch {}
  }
}



