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
import { ExportButton } from './ExportButton'

const Header = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { toggleSidebar } = useFilters()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Logout realizado',
        description: 'VocǦ foi desconectado com sucesso',
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
            bgGradient="linear(135deg, senturi.primaria 0%, senturi.destaqueClaro 100%)"
            bgClip="text"
          >
            Senturi
          </Text>
        </HStack>

        <HStack spacing={4}>
          <ExportButton />
          <IconButton
            aria-label="Notifica����es"
            icon={<FiBell />}
            variant="ghost"
            size="md"
            color={textColor}
            _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          />

          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Menu do usuǭrio"
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
                Configura����es
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
