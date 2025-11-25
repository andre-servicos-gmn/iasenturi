import {
  Box, VStack, Text, Flex,
  HStack, Avatar, Badge
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  FiHome, FiBarChart2, FiGrid,
  FiTrendingUp, FiBriefcase, FiAlertTriangle
} from 'react-icons/fi'
import { Link, useLocation } from 'react-router-dom'
import { IconType } from 'react-icons'
import { useFilters } from '@/contexts/store'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

// Componente Logo do Senturi
const SenturiLogo = () => {
  return (
    <Box
      w="180px"
      h="48px"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <img
        src="/logo_senturi_modo_escuro.png"
        alt="Senturi"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </Box>
  )
}

interface MenuItem {
  icon: IconType
  label: string
  path: string
  active?: boolean
  badge?: string
  count?: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const Sidebar = () => {
  const location = useLocation()
  const { sidebar } = useFilters()

  const menuGroups: MenuGroup[] = [
    {
      title: 'Dashboard',
      items: [
        { icon: FiHome, label: 'Dashboard', path: '/', active: true }
      ]
    },
    {
      title: 'Análises',
      items: [
        { icon: FiBarChart2, label: 'Domínios', path: '/dominios' },
        { icon: FiAlertTriangle, label: 'Ações Recomendadas', path: '/acoes-recomendadas' },
        { icon: FiGrid, label: 'Mapa de Calor', path: '/mapa-calor' },
        { icon: FiTrendingUp, label: 'Histórico', path: '/historico' }
      ]
    },
    {
      title: 'Gestão',
      items: [
        { icon: FiBriefcase, label: 'Empresas', path: '/empresas' }
      ]
    }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <MotionBox
      position="fixed"
      left={0}
      top={0}
      h="100vh"
      w="280px"
      bg="gray.900"
      borderRight="1px solid"
      borderColor="gray.700"
      zIndex={1000}
      initial={{ x: -280 }}
      animate={{
        x: sidebar.isOpen ? 0 : -280,
        opacity: sidebar.isOpen ? 1 : 0.8
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.6
      }}
      boxShadow="2xl"
      backdropFilter="blur(10px)"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'rgba(0, 0, 0, 0.1)',
        opacity: sidebar.isOpen ? 0 : 1,
        transition: 'opacity 0.3s ease'
      }}
    >
      <VStack spacing={0} h="full">
        {/* Header with Senturi Logo */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Flex justify="center" align="center" p={6} borderBottom="1px solid" borderColor="gray.700">
            <SenturiLogo />
          </Flex>
        </MotionBox>

        {/* User Profile Section */}
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Box p={4} borderBottom="1px solid" borderColor="gray.700">
            <HStack spacing={3}>
              <Avatar size="sm" name="Thiago Dias" src="https://bit.ly/charles-hall" />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="sm" fontWeight="semibold" color="white">
                  Thiago Dias
                </Text>
                <Text fontSize="xs" color="gray.400">
                  CEO
                </Text>
              </VStack>
            </HStack>
          </Box>
        </MotionBox>

        {/* Menu Items with Groups */}
        <VStack spacing={0} flex={1} p={4} align="stretch" justify="flex-start" overflowY="auto">
          {menuGroups.map((group, groupIndex) => (
            <MotionBox
              key={groupIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.3 + (groupIndex * 0.1),
                duration: 0.5,
                type: "spring",
                stiffness: 200
              }}
            >
              {/* Group Title */}
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
                px={3}
                py={2}
                mt={groupIndex > 0 ? 4 : 2}
                mb={1}
              >
                {group.title}
              </Text>

              {/* Group Items */}
              <VStack spacing={1} align="stretch">
                {group.items.map((item, index) => {
                  const IconComponent = item.icon
                  const active = isActive(item.path)

                  return (
                    <MotionBox
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.4 + (groupIndex * 0.1) + (index * 0.05),
                        duration: 0.4,
                        type: "spring",
                        stiffness: 250
                      }}
                      whileHover={{
                        scale: 1.02,
                        x: 4,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }
                      }}
                      whileTap={{
                        scale: 0.98,
                        transition: { duration: 0.1 }
                      }}
                      w="full"
                    >
                      <Link to={item.path} style={{ width: '100%', display: 'block' }}>
                        <MotionFlex
                          align="center"
                          gap={3}
                          px={3}
                          py={2}
                          borderRadius="lg"
                          bg={active ? 'blue.600' : 'transparent'}
                          color={active ? 'white' : 'gray.300'}
                          _hover={{
                            bg: active ? 'blue.700' : 'gray.800',
                            color: 'white',
                            transform: 'translateX(4px)'
                          }}
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          cursor="pointer"
                          w="full"
                          h="40px"
                          position="relative"
                          overflow="hidden"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bg: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                            transform: 'translateX(-100%)',
                            transition: 'transform 0.6s ease'
                          }}
                          sx={{
                            '&:hover::before': {
                              transform: 'translateX(100%)'
                            }
                          }}
                        >
                          {/* Active Indicator */}
                          {active && (
                            <MotionBox
                              position="absolute"
                              left={0}
                              top={0}
                              bottom={0}
                              w="3px"
                              bg="blue.400"
                              borderRadius="0 2px 2px 0"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                              }}
                            />
                          )}

                          {/* Icon */}
                          <MotionBox
                            whileHover={{
                              scale: 1.1,
                              rotate: 5,
                              transition: {
                                type: "spring",
                                stiffness: 400
                              }
                            }}
                          >
                            <IconComponent
                              size={16}
                              color={active ? 'white' : 'gray.400'}
                            />
                          </MotionBox>

                          <Text
                            fontSize="sm"
                            fontWeight={active ? 'semibold' : 'normal'}
                            flex={1}
                            color={active ? 'white' : 'gray.300'}
                          >
                            {item.label}
                          </Text>

                          {/* Badge or Count */}
                          {item.badge && (
                            <MotionBox
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                delay: 0.5
                              }}
                            >
                              <Badge
                                colorScheme="blue"
                                variant="solid"
                                fontSize="xs"
                                px={2}
                                py={0.5}
                              >
                                {item.badge}
                              </Badge>
                            </MotionBox>
                          )}
                          {item.count && (
                            <Text fontSize="xs" color="gray.500" fontWeight="medium">
                              {item.count}
                            </Text>
                          )}
                        </MotionFlex>
                      </Link>
                    </MotionBox>
                  )
                })}
              </VStack>
            </MotionBox>
          ))}
        </VStack>

        {/* Footer */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Box p={4} borderTop="1px solid" borderColor="gray.700">
            <VStack spacing={2} align="stretch">
              <Text fontSize="xs" color="gray.500" textAlign="center" fontWeight="medium">
                Senturi 4.0
              </Text>
              <Text fontSize="xs" color="gray.600" textAlign="center">
                Plataforma Corporativa
              </Text>
            </VStack>
          </Box>
        </MotionBox>
      </VStack>
    </MotionBox>
  )
}

export default Sidebar 