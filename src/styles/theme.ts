import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  colors: {
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#169DEF',
      600: '#0D249B',
      700: '#0C0C28',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    senturi: {
      // Nova Paleta Institucional
      primaria: '#0C0C28',          // Primária institucional - Base do sistema, títulos, botões principais
      secundaria: '#B6BEC6',        // Secundária - Fundos e áreas neutras
      destaqueClaro: '#169DEF',     // Destaque claro - Ícones, links, hover
      
      // Indicadores Principais
      iseso: '#0D249B',             // Índice geral / ISESO (principal)
      colaboradores: '#169DEF',     // Colaboradores — card informativo
      criticos: '#E53935',          // Críticos — card de alerta
      ultimaAtualizacao: '#B6BEC6', // Última atualização — neutro

      // Legado (mantido para compatibilidade)
      azulMarinho: '#0C0C28',       // Primária institucional - Base do sistema, títulos, botões principais
      cinzaGelo: '#B6BEC6',         // Secundária - Fundo, áreas neutras
      azulClaro: '#169DEF',         // Destaque claro - Ícones, links, hover
      azulMedio: '#1A45FC',         // Domínio Excelente - Radar e mapa de calor
      azulProfundo: '#0D249B',      // Índice geral (ISESO) - Indicador principal

      // Domínios (Radar & Heatmap)
      dominioExcelente: '#1A45FC',  // Excelente
      dominioSaudavel: '#00C4A7',   // Saudável
      dominioModerado: '#FDCB6E',   // Moderado
      dominioVulneravel: '#E17055', // Vulnerável
      dominioCritico: '#E53935',    // Crítico

      // Mapa de Calor (Fundo + Texto)
      mapaCalorAcaoImediata: {
        fundo: '#E53935',           // 0–35 Ação imediata
        texto: '#FFFFFF'
      },
      mapaCalorPrevencaoUrgente: {
        fundo: '#E17055',           // 36–54 Prevenção urgente
        texto: '#FFFFFF'
      },
      mapaCalorManterAtencao: {
        fundo: '#FDCB6E',           // 55–69 Manter atenção
        texto: '#0C0C28'
      },
      mapaCalorBoasPraticas: {
        fundo: '#00C4A7',           // 70–84 Boas práticas
        texto: '#FFFFFF'
      },
      mapaCalorExcelencia: {
        fundo: '#1A45FC',           // 85–100 Excelência
        texto: '#FFFFFF'
      },

      // Cores de Performance/Status (Mapa de Calor)
      acaoImediata: '#E53935',       // 0-35 - Fundo vermelho, texto branco
      prevencaoUrgente: '#E17055',   // 36-54 - Fundo laranja, texto branco
      manterAtencao: '#FDCB6E',      // 55-69 - Fundo amarelo, texto azul marinho
      boasPraticas: '#00C4A7',       // 70-84 - Fundo verde turquesa, texto branco
      excelente: '#1A45FC',          // 85-100 - Fundo azul vibrante, texto branco
    },
    gradient: {
      primary: 'linear-gradient(90deg, #0C0C28 0%, #169DEF 100%)',
      secondary: 'linear-gradient(90deg, #0D249B 0%, #1A45FC 100%)',
      success: 'linear-gradient(90deg, #00C4A7 0%, #00A085 100%)',
      warning: 'linear-gradient(90deg, #FDCB6E 0%, #F39C12 100%)',
      danger: 'linear-gradient(90deg, #E53935 0%, #C62828 100%)',
    }
  },
  components: {
    Button: {
      defaultProps: { colorScheme: 'brand' },
      variants: {
        solid: {
          bg: 'senturi.primaria',
          color: 'white',
          _hover: {
            bg: 'senturi.destaqueClaro',
            transform: 'translateY(-1px)',
            boxShadow: 'md'
          },
          _active: { transform: 'translateY(0)' }
        },
        gradient: {
          bgGradient: 'linear(90deg, #0C0C28 0%, #169DEF 100%)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(90deg, #0C0C28 0%, #169DEF 100%)',
            transform: 'translateY(-1px)',
            boxShadow: 'lg'
          }
        },
        premium: {
          bgGradient: 'linear(90deg, #0C0C28 0%, #169DEF 100%)',
          color: 'white',
          borderRadius: 'xl',
          px: 8,
          py: 4,
          fontSize: 'lg',
          fontWeight: 'semibold',
          _hover: {
            bgGradient: 'linear(90deg, #0C0C28 0%, #169DEF 100%)',
            transform: 'translateY(-2px)',
            boxShadow: 'xl'
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
          border: 'none',
          _dark: {
            bg: 'gray.800',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
          },
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease'
          },
        },
      },
      variants: {
        premium: {
          container: {
            bg: 'white',
            borderRadius: 'xl',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: 'none',
            _dark: {
              bg: 'gray.800',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
            },
            _hover: {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease'
            },
          },
        },
        gradient: {
          container: {
            bgGradient: 'linear(90deg, #0C0C28 0%, #169DEF 100%)',
            color: 'white',
            borderRadius: 'xl',
            boxShadow: '0 4px 8px rgba(12, 12, 40, 0.15), 0 2px 4px rgba(22, 157, 239, 0.1)',
          },
        },
      },
    },
    Badge: {
      variants: {
        premium: {
          bgGradient: 'linear(90deg, #0C0C28 0%, #169DEF 100%)',
          color: 'white',
          borderRadius: 'full',
          px: 4,
          py: 1,
          fontSize: 'sm',
          fontWeight: 'semibold',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        _dark: { bg: 'gray.900' }
      },
    },
  },
})

export default theme