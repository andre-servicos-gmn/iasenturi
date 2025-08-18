import { PDFGenerator, GenerateParams } from '../core/PDFGenerator'
import { generateTexts } from '@/lib/pdfExport/content/ContentGenerator'
import { SENTURI_BRAND } from '../utils/brandUtils'

export const generateExecutiveReport = async (params: GenerateParams) => {
  const generator = new PDFGenerator()
  const pdf = await generator.generate(params)

  // Additional executive content could be appended here using generated texts
  const texts = generateTexts(params.data)
  // Simple example: add a page with insights
  pdf.addPage()
  pdf.setFont(SENTURI_BRAND.fonts.title, 'bold')
  pdf.setFontSize(14)
  pdf.text('Insights', 16, 22)
  pdf.setFont(SENTURI_BRAND.fonts.body, 'normal')
  pdf.setFontSize(11)
  let y = 30
  for (const insight of texts.insights) {
    pdf.text(`• ${insight}`, 16, y)
    y += 8
  }
  return pdf
}



