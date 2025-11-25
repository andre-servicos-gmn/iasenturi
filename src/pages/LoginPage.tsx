import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  useColorModeValue,
  Divider,
  Link,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff, FiMail } from 'react-icons/fi'
import { useAuth } from '@/contexts/auth'
import { useNavigate } from 'react-router-dom'

const MotionBox = motion(Box)
const MotionCard = motion(Card)

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido'
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    console.log('🔐 Attempting login with email:', email)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error('❌ Login error:', error)
        setErrors({ general: error.message })
        toast({
          title: 'Erro',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } else {
        console.log('✅ Login successful!')
        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo ao Senturi',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        navigate('/')
      }
    } catch (error) {
      console.error('❌ Unexpected login error:', error)
      setErrors({ general: 'Erro inesperado. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        w="full"
        maxW="400px"
      >
        <MotionCard
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          overflow="hidden"
        >
          <CardBody p={8}>
                         {/* Logo e Header */}
             <VStack spacing={6} mb={8}>
               <Box
                 display="flex"
                 alignItems="center"
                 justifyContent="center"
                 mb={2}
               >
                                   <img 
                    src="/logo_senturi_modo_clarao.png" 
                    alt="Senturi Logo"
                    style={{
                      width: '250px',
                      height: 'auto',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                  />
               </Box>
               
               <VStack spacing={2}>
                 <Text color={textColor} textAlign="center" fontSize="sm">
                   Faça login para acessar sua conta
                 </Text>
               </VStack>
             </VStack>

            {/* Formulário */}
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                {errors.general && (
                  <Alert status="error" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Erro!</AlertTitle>
                      <AlertDescription>{errors.general}</AlertDescription>
                    </Box>
                  </Alert>
                )}

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel color={textColor}>Email</FormLabel>
                  <InputGroup>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      size="lg"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px senturi.destaqueClaro',
                      }}
                    />
                    <InputRightElement>
                      <FiMail color="gray.400" />
                    </InputRightElement>
                  </InputGroup>
                  {errors.email && (
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel color={textColor}>Senha</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      size="lg"
                      borderRadius="lg"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px senturi.destaqueClaro',
                      }}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {errors.password && (
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  )}
                </FormControl>

                                 <Button
                   type="submit"
                   w="full"
                   size="lg"
                   variant="gradient"
                   isLoading={isLoading}
                   loadingText="Entrando..."
                   _hover={{
                     transform: 'translateY(-2px)',
                     boxShadow: 'xl',
                   }}
                   _active={{
                     transform: 'translateY(0)',
                   }}
                 >
                   Entrar
                 </Button>
              </VStack>
            </form>

            {/* Divisor */}
            <VStack spacing={4} mt={6}>
              <HStack w="full">
                <Divider />
                <Text fontSize="sm" color="gray.400" px={4}>
                  ou
                </Text>
                <Divider />
              </HStack>

                             {/* Link para esqueceu senha */}
               <Link
                 fontSize="sm"
                 color="brand.500"
                 _hover={{ textDecoration: 'underline' }}
               >
                 Esqueceu sua senha?
               </Link>
            </VStack>
          </CardBody>
        </MotionCard>

        {/* Footer */}
        <Text
          textAlign="center"
          fontSize="xs"
          color="gray.400"
          mt={6}
        >
          © 2024 Senturi. Todos os direitos reservados.
        </Text>
      </MotionBox>
    </Box>
  )
}

export default LoginPage 