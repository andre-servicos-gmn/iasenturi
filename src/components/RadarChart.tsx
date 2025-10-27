import React, { useState } from 'react'
import { Box, Text, useColorModeValue } from '@chakra-ui/react'
import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { LineRadial } from '@visx/shape'
import { useFilters } from '@/contexts/store'

interface RadarChartProps {
  data: Array<{
    nome: string
    valor: number
    classificacao?: 'critico' | 'vulneravel' | 'moderado' | 'saudavel' | 'excelente'
  }>
  sectorData?: Array<{
    nome: string
    valor: number
  }>
}

const RadarChart: React.FC<RadarChartProps> = ({ data, sectorData }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { filters } = useFilters()
  
  const width = 800
  const height = 800
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 60

  // Verificar se há setor selecionado
  const hasSetorSelected = !!filters.setor

  // Definir nomes dos domínios
  const domainNames = [
    'Demandas Psicológicas',
    'Demandas Físicas', 
    'Demandas de Trabalho',
    'Suporte Social e Liderança',
    'Esforço e Recompensa',
    'Interface Trabalho-Vida',
    'Saúde Emocional',
    'ISESO'
  ]

  // Criar pontos para o radar principal
  const angleStep = (2 * Math.PI) / data.length
  const points = data.map((item, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = Math.min(item.valor / 100, 1) // Normalizar para 0-1
    const x = centerX + Math.cos(angle) * radius * value
    const y = centerY + Math.sin(angle) * radius * value
    return { x, y, label: domainNames[i] || item.nome, value: item.valor, angle }
  })

  // Criar pontos para dados do setor (apenas se setor selecionado)
  const sectorPoints = (hasSetorSelected && sectorData) ? sectorData.map((item, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = Math.min(item.valor / 100, 1)
    const x = centerX + Math.cos(angle) * radius * value
    const y = centerY + Math.sin(angle) * radius * value
    return { x, y, label: domainNames[i] || item.nome, value: item.valor, angle }
  }) : []

  // Função para determinar cor baseada no valor (5 categorias)
  const getColorByValue = (value: number) => {
    if (value < 40) return '#DC2626' // Crítico - vermelho
    if (value < 55) return '#EA580C' // Vulnerável - laranja
    if (value < 70) return '#F59E0B' // Moderado - amarelo
    if (value < 85) return '#34D399' // Saudável - verde claro
    return '#065F46' // Excelente - verde escuro
  }

  // Função para obter classificação (5 categorias)
  const getClassification = (value: number) => {
    if (value < 40) return 'Crítico'
    if (value < 55) return 'Vulnerável'
    if (value < 70) return 'Moderado'
    if (value < 85) return 'Saudável'
    return 'Excelente'
  }

  return (
    <Box id="domain-scores-chart" position="relative" width={width} height={height} mx="auto">
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {/* Gradiente para dados principais */}
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D249B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.3" />
          </linearGradient>
          
          {/* Gradiente para setor selecionado */}
          <linearGradient id="sectorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <Group left={centerX} top={centerY}>
          {/* Linhas de grade */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
            <LineRadial
              key={level}
              data={data.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2
                return {
                  angle,
                  radius: radius * level,
                }
              })}
              angle={(d) => d.angle}
              radius={(d) => d.radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          ))}

          {/* Linhas dos eixos */}
          {data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            return (
              <line
                key={i}
                x1={0}
                y1={0}
                x2={x}
                y2={y}
                stroke="#cbd5e0"
                strokeWidth={1}
                strokeOpacity={0.3}
              />
            )
          })}

          {/* Área do radar principal com gradiente */}
          {points.length > 0 && (
            <LinePath
              data={points}
              x={(d) => d.x - centerX}
              y={(d) => d.y - centerY}
              fill="url(#mainGradient)"
              stroke="url(#mainGradient)"
              strokeWidth={2}
            />
          )}

          {/* Área do setor (apenas se setor selecionado) */}
          {hasSetorSelected && sectorPoints.length > 0 && (
            <LinePath
              data={sectorPoints}
              x={(d) => d.x - centerX}
              y={(d) => d.y - centerY}
              fill="url(#sectorGradient)"
              stroke="url(#sectorGradient)"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}

          {/* Pontos principais (com área de acerto maior para hover estável) */}
          {points.map((point, i) => (
            <g key={i}>
              {/* Área invisível para capturar o hover sem interferir no tooltip */}
              <circle
                cx={point.x - centerX}
                cy={point.y - centerY}
                r={16}
                fill="transparent"
                stroke="none"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Ponto visível */}
              <circle
                cx={point.x - centerX}
                cy={point.y - centerY}
                r={hoveredPoint === i ? 10 : 7}
                fill={getColorByValue(point.value)}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          ))}

          {/* Pontos do setor (apenas se setor selecionado) */}
          {hasSetorSelected && sectorPoints.map((point, i) => (
            <circle
              key={`sector-${i}`}
              cx={point.x - centerX}
              cy={point.y - centerY}
              r={5}
              fill="#3B82F6"
              stroke="white"
              strokeWidth={1}
              strokeDasharray="2,2"
              pointerEvents="none"
            />
          ))}

          {/* Labels */}
          {data.map((item, i) => {
            const angle = i * angleStep - Math.PI / 2
            const labelRadius = radius + 30
            const x = Math.cos(angle) * labelRadius
            const y = Math.sin(angle) * labelRadius
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fill={textColor}
                fontWeight="medium"
              >
                {domainNames[i] || item.nome}
              </text>
            )
          })}

        </Group>
      </svg>

      {/* Tooltip posicionado fora do SVG para evitar cortes */}
      {hoveredPoint !== null && (
        <Box
          position="absolute"
          left={points[hoveredPoint].x - 70}
          top={points[hoveredPoint].y - 60}
          width="140px"
          zIndex={10}
          pointerEvents="none"
        >
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            p={3}
            boxShadow="xl"
            fontSize="xs"
            textAlign="center"
            _dark={{
              bg: "gray.800",
              borderColor: "gray.600"
            }}
          >
            <Text fontWeight="bold" color={textColor} mb={1} noOfLines={2}>
              {points[hoveredPoint].label}
            </Text>
            <Text color="blue.500" fontWeight="bold" fontSize="sm" mb={2}>
              {points[hoveredPoint].value}%
            </Text>
            <Text 
              fontSize="xs" 
              color="gray.500" 
              fontWeight="medium"
              px={2}
              py={1}
              bg="gray.100"
              borderRadius="md"
              _dark={{
                bg: "gray.700",
                color: "gray.300"
              }}
            >
              {getClassification(points[hoveredPoint].value)}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default RadarChart 