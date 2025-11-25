import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type ReportFilters = {
  empresa?: string
  setor?: string
  dataInicio?: string
  dataFim?: string
}

type ReportItem = {
  id?: number | string
  nome_completo?: string
  area_setor?: string
  created_at?: string
  empresa_id?: string
  iseso?: number | string
  media_exigencias?: string
  media_organizacao?: string
  media_relacoes?: string
  media_interface?: string
  media_significado?: string
  media_inseguranca?: string
  saude_emocional?: string
}

const computeISESO = (item: ReportItem): number | null => {
  const direct = item.iseso
  const directNumber = direct !== undefined ? Number(direct) : NaN
  if (!Number.isNaN(directNumber) && directNumber > 0) {
    return Math.round(directNumber)
  }

  const values = [
    Number(item.media_exigencias || 0),
    Number(item.media_organizacao || 0),
    Number(item.media_relacoes || 0),
    Number(item.media_interface || 0),
    Number(item.media_significado || 0),
    Number(item.media_inseguranca || 0),
    Number(item.saude_emocional || 0),
  ].filter(value => !Number.isNaN(value) && value > 0)

  if (values.length === 0) return null
  const average = values.reduce((acc, value) => acc + value, 0) / values.length
  return Math.round(average)
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

interface GenerateReportOptions {
  data: ReportItem[]
  filters: ReportFilters
  selectedEmpresa?: string
  heatmapImage?: {
    dataUrl: string
    width: number
    height: number
  }
}

const loadLogoWithSize = async (path: string): Promise<{ dataUrl: string, width: number, height: number }> => {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Falha ao carregar logo: ${response.status}`)
  const blob = await response.blob()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  const dimensions = await new Promise<{ width: number, height: number }>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })

  return { dataUrl, ...dimensions }
}

export const generatePDFReport = async (options: GenerateReportOptions) => {
  const { data, filters, selectedEmpresa } = options
  const filteredData = selectedEmpresa
    ? data.filter(item => item.empresa_id === selectedEmpresa)
    : data

  const isesoValues = filteredData
    .map(computeISESO)
    .filter((value): value is number => value !== null)

  const isesoGeral = isesoValues.length > 0
    ? Math.round(isesoValues.reduce((acc, value) => acc + value, 0) / isesoValues.length)
    : null

  const doc = new jsPDF()

  // Tenta inserir a logo no canto superior direito
  try {
    const { dataUrl, width, height } = await loadLogoWithSize('/logo_senturi_modo_clarao.png')
    const pageWidth = doc.internal.pageSize.getWidth()
    const maxWidth = 45
    const maxHeight = 20
    const scale = Math.min(maxWidth / width, maxHeight / height, 1)
    const drawWidth = Math.max(10, width * scale)
    const drawHeight = Math.max(6, height * scale)
    const x = pageWidth - drawWidth - 12
    const y = 8
    doc.addImage(dataUrl, 'PNG', x, y, drawWidth, drawHeight)
  } catch (error) {
    console.warn('Logo n�o carregada para o PDF:', error)
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Relatorio Senturi', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 26)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Contexto e filtros', 14, 38)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const filterLines = [
    `Empresa: ${selectedEmpresa || filters.empresa || 'Todas'}`,
    `Setor: ${filters.setor || 'Todos'}`,
    `Periodo: ${(filters.dataInicio && formatDate(filters.dataInicio)) || 'Livre'} ate ${(filters.dataFim && formatDate(filters.dataFim)) || 'atual'}`,
  ]
  filterLines.forEach((line, index) => {
    doc.text(line, 14, 46 + index * 6)
  })

  let cursorY = 64
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ISESO geral da empresa', 14, cursorY)
  cursorY += 8
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(isesoGeral !== null ? `${isesoGeral}` : 'Sem dados', 14, cursorY)

  cursorY += 12
  if (options.heatmapImage) {
    try {
      const { dataUrl, width, height } = options.heatmapImage
      const availableWidth = doc.internal.pageSize.getWidth() - 28 // 14px margem cada lado
      const maxHeight = 200
      const scale = Math.min(availableWidth / width, maxHeight / height, 1)
      const drawWidth = width * scale
      const drawHeight = height * scale
      doc.addImage(dataUrl, 'PNG', 14, cursorY, drawWidth, drawHeight)
      cursorY += drawHeight + 8
    } catch (error) {
      console.warn('Mapa de calor n�o inclu�do no PDF:', error)
    }
  }

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Como interpretar', 14, cursorY)
  cursorY += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const explainer = doc.splitTextToSize(
    'O ISESO geral representa a media dos escores psicossociais dos colaboradores filtrados. Valores mais baixos indicam maior risco; valores mais altos indicam melhor percepcao de saude e organizacao. Use este numero para acompanhar tendencia por empresa e periodo.',
    182
  )
  doc.text(explainer, 14, cursorY)

  cursorY += explainer.length * 6 + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Colaboradores considerados', 14, cursorY)

  const tableBody = filteredData.map(item => {
    const iseso = computeISESO(item)
    return [
      item.id ?? '-',
      item.nome_completo || 'Nao informado',
      item.area_setor || 'N/A',
      formatDate(item.created_at),
      iseso !== null ? iseso : 'N/A',
    ]
  })

  autoTable(doc, {
    startY: cursorY + 6,
    head: [['ID', 'Nome', 'Setor', 'Data', 'ISESO']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 36, 155],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  })

  const fileSafeEmpresa = (selectedEmpresa || filters.empresa || 'geral')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
  const fileName = `relatorio-senturi-${fileSafeEmpresa}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
