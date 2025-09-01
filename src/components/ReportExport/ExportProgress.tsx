import React from 'react'
import { HStack, Progress, Text } from '@chakra-ui/react'

interface ExportProgressProps {
  value: number
  label?: string
}

const ExportProgress: React.FC<ExportProgressProps> = ({ value, label }) => {
  return (
    <HStack spacing={3} width="100%">
      <Progress value={value} size="sm" colorScheme="blue" flex={1} />
      {label && <Text fontSize="sm" color="gray.500">{label}</Text>}
    </HStack>
  )
}

export default ExportProgress








