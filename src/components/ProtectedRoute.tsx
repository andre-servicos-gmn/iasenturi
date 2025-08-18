import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, Center, Spinner, Text, VStack } from '@chakra-ui/react'
import { useAuth } from '@/contexts/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  console.log('🔒 ProtectedRoute - User:', !!user, 'Loading:', loading)

  if (loading) {
    console.log('⏳ ProtectedRoute - Showing loading...')
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        _dark={{ bg: 'gray.900' }}
      >
        <Center>
          <VStack spacing={4}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="brand.500"
              size="xl"
            />
            <Text color="gray.500" fontSize="sm">
              Carregando...
            </Text>
          </VStack>
        </Center>
      </Box>
    )
  }

  if (!user) {
    console.log('🚫 ProtectedRoute - No user, redirecting to login...')
    return <Navigate to="/login" replace />
  }

  console.log('✅ ProtectedRoute - User authenticated, showing content')
  return <>{children}</>
}

export default ProtectedRoute 