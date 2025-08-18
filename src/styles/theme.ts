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
      500: '#1A45FC',
      600: '#0D249B',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    senturi: {
      azulEscuro: '#0D249B',
      azulDestaque: '#1A45FC',
      roxo: '#1A45FC',
      roxoClaro: '#3B82F6',
      vermelho: '#EF4444',
      amarelo: '#F59E0B',
      verde: '#10B981',
      cinza: '#6B7280',
    },
    gradient: {
      primary: 'linear-gradient(90deg, #0D249B 0%, #1A45FC 100%)',
      secondary: 'linear-gradient(90deg, #0D249B 0%, #1A45FC 100%)',
      success: 'linear-gradient(90deg, #0D249B 0%, #1A45FC 100%)',
      warning: 'linear-gradient(90deg, #0D249B 0%, #1A45FC 100%)',
      danger: 'linear-gradient(90deg, #0D249B 0%, #1A45FC 100%)',
    }
  },
  components: {
    Button: {
      defaultProps: { colorScheme: 'brand' },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: { 
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'md'
          },
          _active: { transform: 'translateY(0)' }
        },
        gradient: {
          bgGradient: 'linear(90deg, #0D249B 0%, #1A45FC 100%)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(90deg, #0D249B 0%, #1A45FC 100%)',
            transform: 'translateY(-1px)',
            boxShadow: 'lg'
          }
        },
        premium: {
          bgGradient: 'linear(90deg, #0D249B 0%, #1A45FC 100%)',
          color: 'white',
          borderRadius: 'xl',
          px: 8,
          py: 4,
          fontSize: 'lg',
          fontWeight: 'semibold',
          _hover: {
            bgGradient: 'linear(90deg, #0D249B 0%, #1A45FC 100%)',
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
            bgGradient: 'linear(90deg, #0D249B 0%, #1A45FC 100%)',
            color: 'white',
            borderRadius: 'xl',
            boxShadow: '0 4px 8px rgba(26, 69, 252, 0.15), 0 2px 4px rgba(26, 69, 252, 0.1)',
          },
        },
      },
    },
    Badge: {
      variants: {
        premium: {
          bgGradient: 'linear(90deg, #0D249B 0%, #1A45FC 100%)',
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