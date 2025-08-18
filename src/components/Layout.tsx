import { Box, Flex, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import Header from './Header.tsx'
import Sidebar from './Sidebar.tsx'
import FiltrosGlobais from './FiltrosGlobais.tsx'
import { useFilters } from '@/contexts/store'

const MotionBox = motion(Box)

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { sidebar } = useFilters()

  return (
    <Flex minH="100vh">
      <Sidebar />
      <MotionBox 
        flex="1" 
        ml={sidebar.isOpen ? "280px" : "0px"}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.6
        }}
        w="full"
        initial={{ marginLeft: "280px" }}
        animate={{ marginLeft: sidebar.isOpen ? "280px" : "0px" }}
      >
        <Header />
        <MotionBox
          as="main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          flex="1"
          bg="gray.50"
          _dark={{ bg: 'gray.900' }}
          minH="calc(100vh - 80px)" // Altura total menos header
        >
          <VStack spacing={4} p={4} h="full">
            <FiltrosGlobais />
            <Box flex="1" w="full">
              {children}
            </Box>
          </VStack>
        </MotionBox>
      </MotionBox>
    </Flex>
  )
}

export default Layout 