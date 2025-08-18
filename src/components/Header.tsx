import {
  Box,
  HStack,
  Text,
  IconButton,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast
} from '@chakra-ui/react'
import { FiBell, FiSettings, FiLogOut, FiUser, FiMenu } from 'react-icons/fi'
import { useAuth } from '@/contexts/auth'
import { useNavigate } from 'react-router-dom'
import { useFilters } from '@/contexts/store'
// import ExportButton from './ExportButton'
import AdvancedReportModal from './ReportExport/AdvancedReportModal'
const Header = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { toggleSidebar, filteredData, filters } = useFilters()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Erro no logout',
        description: 'Tente novamente',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box
      as="header"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={4}>
          <IconButton
            aria-label="Abrir menu"
            icon={<FiMenu />}
            variant="ghost"
            size="md"
            color={textColor}
            onClick={toggleSidebar}
            _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          />
          <Text
            fontSize="xl"
            fontWeight="bold"
            bgGradient="linear(135deg, #0D249B 0%, #1A45FC 100%)"
            bgClip="text"
          >
            Senturi
          </Text>
        </HStack>

        <HStack spacing={4}>
          {(() => {
            const companyName = filters.empresa || 'Empresa'
            const period = filters.dataInicio && filters.dataFim ? `${filters.dataInicio} a ${filters.dataFim}` : 'Período atual'
            const totalEmployees = filteredData.length
            const averageScore = (() => {
              try {
                const values = filteredData
                  .map((r: any) => (r.iseso ? parseFloat(r.iseso) : NaN))
                  .filter((v: number) => !isNaN(v))
                if (values.length === 0) return 0
                return Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length)
              } catch {
                return 0
              }
            })()
            const riskLevel = averageScore >= 70 ? 'low' : averageScore >= 50 ? 'medium' : 'high'
            const dominios: Array<{ name: string; score: number; risk: 'low' | 'medium' | 'high' }> = [
              { name: 'Demandas Psicológicas', score: averageScore, risk: riskLevel },
              { name: 'Demandas Físicas', score: averageScore, risk: riskLevel },
              { name: 'Demandas de Trabalho', score: averageScore, risk: riskLevel },
              { name: 'Suporte Social e Liderança', score: averageScore, risk: riskLevel },
              { name: 'Suporte Social', score: averageScore, risk: riskLevel },
              { name: 'Esforço e Recompensa', score: averageScore, risk: riskLevel },
              { name: 'Saúde Emocional', score: averageScore, risk: riskLevel },
              { name: 'Interface Trabalho-Vida', score: averageScore, risk: riskLevel }
            ]
            return (
              <AdvancedReportModal
                rootElementId="relatorio-senturi"
                defaultTitle="Dashboard Senturi"
                companyName={companyName}
                period={period}
                totalEmployees={totalEmployees}
                riskLevel={riskLevel as 'low' | 'medium' | 'high'}
                dominios={dominios}
              />
            )
          })()}
          
          <IconButton
            aria-label="Notificações"
            icon={<FiBell />}
            variant="ghost"
            size="md"
            color={textColor}
            _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          />
          
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Menu do usuário"
              icon={<FiUser />}
              variant="ghost"
              size="md"
              color={textColor}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
            />
            <MenuList>
              <MenuItem icon={<FiUser />}>
                Perfil
              </MenuItem>
              <MenuItem icon={<FiSettings />}>
                Configurações
              </MenuItem>
              <MenuDivider />
              <MenuItem 
                icon={<FiLogOut />}
                onClick={handleLogout}
                color="red.500"
              >
                Sair
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </HStack>
    </Box>
  )
}

export default Header 