import { Box, VStack, Heading } from '@chakra-ui/react'
import ExportButton from './ExportButton'

/**
 * Exemplo de uso do ExportButton em diferentes contextos
 * 
 * Este componente demonstra como implementar a exportação de PDF
 * em diferentes páginas do Senturi Dashboard.
 */

// Exemplo 1: Botão simples para exportar o dashboard
export const DashboardExportExample = () => (
  <Box>
    <Heading size="md" mb={4}>Dashboard</Heading>
    <ExportButton
      elementId="relatorio-senturi"
      title="Dashboard Senturi"
      subtitle="Relatório completo de saúde ocupacional"
    />
  </Box>
)

// Exemplo 2: Botão para exportar mapa de calor
export const HeatmapExportExample = () => (
  <Box>
    <Heading size="md" mb={4}>Mapa de Calor</Heading>
    <ExportButton
      elementId="relatorio-senturi"
      title="Mapa de Calor Psicossocial"
      subtitle="Análise de risco por setor e domínio"
      filename="Mapa-Calor-Senturi.pdf"
    />
  </Box>
)

// Exemplo 3: Botão para exportar histórico
export const HistoricoExportExample = () => (
  <Box>
    <Heading size="md" mb={4}>Histórico</Heading>
    <ExportButton
      elementId="relatorio-senturi"
      title="Histórico de Avaliações"
      subtitle="Evolução temporal dos indicadores"
      filename="Historico-Senturi.pdf"
    />
  </Box>
)

// Exemplo 4: Botão com callbacks personalizados
export const CustomExportExample = () => (
  <Box>
    <Heading size="md" mb={4}>Exportação Personalizada</Heading>
    <ExportButton
      elementId="relatorio-senturi"
      title="Relatório Personalizado"
      subtitle="Com callbacks e tratamento de eventos"
      onExportStart={() => console.log('Iniciando exportação...')}
      onExportComplete={() => console.log('Exportação concluída!')}
      onExportError={(error) => console.error('Erro na exportação:', error)}
    />
  </Box>
)

// Exemplo 5: Botão com tema personalizado
export const ThemedExportExample = () => (
  <Box>
    <Heading size="md" mb={4}>Botão Tematizado</Heading>
    <ExportButton
      elementId="relatorio-senturi"
      title="Relatório Tematizado"
      size="lg"
      variant="outline"
    >
      Exportar Relatório
    </ExportButton>
  </Box>
)

// Exemplo 6: Múltiplos botões para diferentes seções
export const MultipleExportExample = () => (
  <VStack spacing={4} align="stretch">
    <Heading size="md">Múltiplas Exportações</Heading>
    
    <ExportButton
      elementId="relatorio-senturi"
      title="Resumo Executivo"
      subtitle="Principais indicadores e métricas"
      size="sm"
      variant="ghost"
    >
      Resumo
    </ExportButton>
    
    <ExportButton
      elementId="relatorio-senturi"
      title="Relatório Detalhado"
      subtitle="Análise completa com gráficos e tabelas"
      size="md"
      variant="solid"
    >
      Completo
    </ExportButton>
    
    <ExportButton
      elementId="relatorio-senturi"
      title="Relatório Técnico"
      subtitle="Dados brutos e análises estatísticas"
      size="lg"
      variant="outline"
    >
      Técnico
    </ExportButton>
  </VStack>
)

/**
 * INSTRUÇÕES DE IMPLEMENTAÇÃO:
 * 
 * 1. Adicione o ID "relatorio-senturi" ao container principal da página:
 *    <Box id="relatorio-senturi">
 *      ... conteúdo da página ...
 *    </Box>
 * 
 * 2. Importe o componente ExportButton:
 *    import ExportButton from '../components/ExportButton'
 * 
 * 3. Use o componente onde desejar:
 *    <ExportButton
 *      elementId="relatorio-senturi"
 *      title="Título do Relatório"
 *      subtitle="Subtítulo opcional"
 *      filename="Nome-do-arquivo.pdf" // opcional
 *    />
 * 
 * 4. O botão automaticamente:
 *    - Detecta o tema atual (claro/escuro)
 *    - Usa o logo apropriado
 *    - Aguarda os gráficos renderizarem
 *    - Gera PDF com alta qualidade
 *    - Salva com nome dinâmico
 *    - Mostra feedback visual
 * 
 * 5. Para personalizar:
 *    - Use as props size, variant para estilo
 *    - Implemente callbacks para eventos
 *    - Defina filename personalizado
 *    - Ajuste title e subtitle
 */
