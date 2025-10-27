import React, { useEffect, useMemo, useState } from 'react'
import { Box, VStack, HStack, Text, Divider, useColorModeValue, Grid, Card, CardBody } from '@chakra-ui/react'
import { useSearchParams } from 'react-router-dom'
import { useFilters } from '@/contexts/store'
import RadarChart from '@/components/RadarChart'
import HeatmapTable from '@/components/HeatmapTable'
import { calculateDomainAverages } from '@/lib/supabase'

const ReportPrintPage: React.FC = () => {
  const [search] = useSearchParams()
  const { filters, setFilters, applyFilters, filteredData } = useFilters()
  const textColor = useColorModeValue('gray.700', 'gray.200')
  const [ready, setReady] = useState(false)

  // Apply overrides from query params (empresa, setor, datas)
  useEffect(() => {
    const empresa = search.get('empresa') || ''
    const setor = search.get('setor') || ''
    const dataInicio = search.get('dataInicio') || ''
    const dataFim = search.get('dataFim') || ''
    setFilters(prev => ({ ...prev, empresa, setor, dataInicio, dataFim }))
    // Trigger fetch
    applyFilters().catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build summary metrics
  const summary = useMemo(() => {
    try {
      const values = (filteredData || [])
        .map((r: any) => (r.iseso ? parseFloat(r.iseso) : NaN))
        .filter((v: number) => !isNaN(v))
      const avg = values.length > 0 ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length) : 0
      const dominios = calculateDomainAverages(filteredData as any[])
      return { avgISESO: avg, dominios }
    } catch {
      return { avgISESO: 0, dominios: [] as any[] }
    }
  }, [filteredData])

  // Heatmap data (simplified, same mapping as MapaCalor)
  const heatmapData = useMemo(() => {
    try {
      const domainNames = [
        'Demandas Psicológicas',
        'Demandas Físicas',
        'Demandas de Trabalho',
        'Suporte Social e Liderança',
        'Esforço e Recompensa',
        'Interface Trabalho-Vida',
        'Saúde Emocional'
      ]
      const domainFields = [
        'media_exigencias',
        'media_organizacao',
        'media_relacoes',
        'media_interface',
        'media_significado',
        'media_inseguranca',
        'saude_emocional'
      ]
      const setores = [...new Set(filteredData.map((item: any) => item.area_setor).filter(Boolean))]
      const cells: any[] = []
      setores.forEach((setor: string) => {
        const dadosSetor = filteredData.filter((item: any) => item.area_setor === setor)
        domainNames.forEach((dominio, index) => {
          const field = domainFields[index]
          const valores = dadosSetor
            .map((item: any) => parseFloat(item[field] || '0'))
            .filter((valor: number) => valor > 0)
          const media = valores.length > 0 ? Math.round(valores.reduce((a: number, b: number) => a + b, 0) / valores.length) : 0
          const ultimaAvaliacao = dadosSetor
            .map((item: any) => item.data_avaliacao)
            .filter(Boolean)
            .sort()
            .pop()
          cells.push({
            setor,
            dominio,
            valor: media,
            totalColaboradores: dadosSetor.length,
            ultimaAvaliacao: ultimaAvaliacao ? new Date(ultimaAvaliacao).toLocaleDateString('pt-BR') : undefined
          })
        })
      })
      return cells
    } catch {
      return []
    }
  }, [filteredData])

  // Signal server when ready (for puppeteer)
  useEffect(() => {
    const timer = setTimeout(() => {
      ;(window as any).__REPORT_READY__ = true
      setReady(true)
    }, 800) // small delay to ensure charts rendered
    return () => clearTimeout(timer)
  }, [filteredData])

  const empresaLabel = filters.empresa || 'Empresa'
  const periodoLabel = filters.dataInicio && filters.dataFim ? `${filters.dataInicio} a ${filters.dataFim}` : 'Período atual'

  return (
    <Box bg="gray.100" _dark={{ bg: 'gray.900' }} py={6} display="flex" justifyContent="center">
      <Box bg="white" color={textColor} width="794px" p={6} borderRadius="md" boxShadow="sm">
        {/* Capa */}
        <VStack align="stretch" spacing={3} mb={6}>
          <Box bg="#1A365D" color="white" p={5} borderRadius="md">
            <HStack justify="space-between">
              <Text fontSize="2xl" fontWeight="bold">Relatório Senturi</Text>
              <img src="/logo_senturi_modo_clarao.png" alt="Senturi" style={{ height: 28 }} />
            </HStack>
            <Text mt={3}>Empresa: {empresaLabel}</Text>
            <Text>Período: {periodoLabel}</Text>
          </Box>
        </VStack>

        {/* Sumário */}
        <Card variant="outline" mb={6}>
          <CardBody>
            <HStack justify="space-between" align="center">
              <Text fontWeight="bold">ISESO Geral</Text>
              <Text fontSize="3xl" fontWeight="black" color="blue.600">{summary.avgISESO}</Text>
            </HStack>
          </CardBody>
        </Card>

        {/* Radar */}
        {summary.dominios.length > 0 && (
          <VStack align="stretch" spacing={3} mb={6}>
            <Text fontWeight="bold">Radar dos Domínios</Text>
            <Box display="flex" justifyContent="center">
              <RadarChart data={summary.dominios.map((d: any) => ({ nome: d.nome, valor: d.valor }))} />
            </Box>
          </VStack>
        )}

        {/* Heatmap */}
        {heatmapData.length > 0 && (
          <VStack align="stretch" spacing={3}>
            <Text fontWeight="bold">Mapa de Calor por Setor e Domínio</Text>
            <HeatmapTable data={heatmapData as any} />
          </VStack>
        )}

        <Divider my={6} />
        <Text fontSize="xs" color="gray.500">Relatório gerado automaticamente • {ready ? 'Pronto' : 'Carregando...'}</Text>
      </Box>
    </Box>
  )
}

export default ReportPrintPage




