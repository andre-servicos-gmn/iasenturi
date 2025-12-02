import { useState, useEffect } from 'react'
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    SimpleGrid,
    Card,
    CardBody,
    CardHeader,
    Heading,
    Badge,
    Progress,
    Tag,
    Wrap,
    WrapItem,
    useColorModeValue,
    Icon,
    Flex,
    useToast
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiCpu, FiTrendingUp, FiThumbsUp, FiAlertTriangle, FiMessageSquare, FiHash } from 'react-icons/fi'
import { fetchEmpresas } from '@/lib/supabase'
import { Empresa } from '@/types'
import { useFilters } from '@/contexts/store'

const MotionBox = motion(Box)

// Mock data structure for type safety, though we will use API response
interface AnalysisData {
    sentiment: {
        positive: number
        neutral: number
        negative: number
    }
    themes: Array<{ name: string; value: number }>
    topPositive: Array<{ name: string; value: number }>
    topCritical: Array<{ name: string; value: number }>
    keywords: string[]
    insight: string
}

const mockAnalysisData: AnalysisData = {
    sentiment: {
        positive: 65,
        neutral: 20,
        negative: 15
    },
    themes: [
        { name: "Atendimento", value: 85 },
        { name: "Qualidade", value: 70 },
        { name: "Preço", value: 60 },
        { name: "Entrega", value: 45 },
        { name: "Suporte", value: 30 }
    ],
    topPositive: [
        { name: "Agilidade no atendimento", value: 90 },
        { name: "Simpatia dos atendentes", value: 85 },
        { name: "Resolução de problemas", value: 80 }
    ],
    topCritical: [
        { name: "Tempo de espera", value: 40 },
        { name: "Preço alto", value: 35 },
        { name: "Dificuldade de contato", value: 25 }
    ],
    keywords: ["Rápido", "Eficiente", "Caro", "Demorado", "Atencioso", "Profissional"],
    insight: "A análise indica uma forte satisfação com o atendimento humano, porém há oportunidades de melhoria no tempo de espera e percepção de valor. O sentimento geral é majoritariamente positivo."
}

const AnaliseIAPage = () => {
    const textColor = useColorModeValue('gray.600', 'gray.300')
    const cardBg = useColorModeValue('white', 'gray.800')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<AnalysisData | null>(null)
    const [companies, setCompanies] = useState<Empresa[]>([])
    const [loadingStage, setLoadingStage] = useState<string>('')
    const { filters } = useFilters()
    const toast = useToast()

    useEffect(() => {
        const loadCompanies = async () => {
            const data = await fetchEmpresas()
            setCompanies(data)
        }
        loadCompanies()
    }, [])

    const handleGenerateAnalysis = async () => {
        if (!filters.empresa) {
            toast({
                title: 'Empresa não selecionada',
                description: 'Por favor, selecione uma empresa no filtro global (menu lateral) para gerar a análise.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            })
            return
        }

        setLoading(true)
        setLoadingStage('Inicializando IA...')

        try {
            // const empresaNome = companies.find(c => c.id === filters.empresa)?.nome || filters.empresa

            // Sequence of loading stages
            const stages = [
                { text: 'Conectando à base de conhecimento...', delay: 1000 },
                { text: 'Processando linguagem natural...', delay: 2000 },
                { text: 'Identificando padrões de sentimento...', delay: 3000 },
                { text: 'Gerando insights estratégicos...', delay: 4000 }
            ]

            // Execute stages
            for (const stage of stages) {
                setLoadingStage(stage.text)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Final small delay
            await new Promise(resolve => setTimeout(resolve, 800))

            /* 
            const params = new URLSearchParams({
                empresa_id: filters.empresa,
                empresa_nome: empresaNome
            })

            const response = await fetch(`https://nouvaris-n8n.ojdb99.easypanel.host/webhook/Senturi-IA?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`)
            }

            const text = await response.text()
            if (!text) {
                throw new Error('A resposta da IA veio vazia. Verifique o nó "Respond to Webhook" no n8n.')
            }

            let result
            try {
                result = JSON.parse(text)
            } catch (e) {
                console.error('Erro ao fazer parse do JSON:', text)
                throw new Error('A resposta da IA não é um JSON válido.')
            }

            if (!result || Object.keys(result).length === 0) {
                throw new Error('O JSON retornado pela IA está vazio.')
            }

            // Save to Supabase
            try {
                const { error } = await supabase
                    .from('analise_ia_resultados')
                    .insert({
                        empresa_id: filters.empresa,
                        resultado: result
                    })

                if (error) {
                    console.error('Erro ao salvar no Supabase:', error)
                    toast({
                        title: 'Aviso',
                        description: 'Análise gerada, mas houve um erro ao salvar o histórico.',
                        status: 'warning',
                        duration: 5000,
                        isClosable: true,
                    })
                }
            } catch (dbError) {
                console.error('Erro ao conectar com Supabase:', dbError)
            }
            */

            // Use mock data
            const result = mockAnalysisData

            setData(result)

            toast({
                title: 'Análise gerada com sucesso!',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

        } catch (error: any) {
            console.error('Erro ao gerar análise:', error)
            toast({
                title: 'Erro ao gerar análise',
                description: error.message || 'Não foi possível conectar ao serviço de IA. Tente novamente.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setLoading(false)
            setLoadingStage('')
        }
    }

    return (
        <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            w="full"
            minH="100vh"
            bg="gray.50"
            _dark={{ bg: 'gray.900' }}
            p={6}
        >
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
                    <HStack spacing={3}>
                        <Icon as={FiCpu} w={8} h={8} color="#0D249B" />
                        <VStack align="start" spacing={0}>
                            <Heading size="lg" color={textColor}>Análise Semântica IA</Heading>
                            <Text fontSize="sm" color="gray.500">Análise qualitativa automatizada das respostas abertas</Text>
                        </VStack>
                    </HStack>

                    <HStack spacing={4}>
                        {filters.empresa && (
                            <Tag size="lg" colorScheme="blue" borderRadius="full">
                                {companies.find(c => c.id === filters.empresa)?.nome || 'Empresa Selecionada'}
                            </Tag>
                        )}

                        <Button
                            leftIcon={<FiCpu />}
                            colorScheme="blue"
                            onClick={handleGenerateAnalysis}
                            isLoading={loading}
                            loadingText={loadingStage || "Analisando..."}
                            size="lg"
                            bg="#0D249B"
                            _hover={{ bg: "#0a1c7a" }}
                            isDisabled={!filters.empresa}
                        >
                            Gerar Análise IA
                        </Button>
                    </HStack>
                </HStack>

                {/* Loading State */}
                {loading && (
                    <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        h="60vh"
                        bg={cardBg}
                        borderRadius="lg"
                        position="relative"
                        overflow="hidden"
                    >
                        <MotionBox
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 180, 360],
                                borderRadius: ["20%", "50%", "20%"]
                            }}
                            transition={{
                                duration: 2,
                                ease: "easeInOut",
                                times: [0, 0.5, 1],
                                repeat: Infinity,
                            }}
                            w={20}
                            h={20}
                            bgGradient="linear(to-r, blue.400, purple.500)"
                            mb={8}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="0 0 20px rgba(66, 153, 225, 0.6)"
                        >
                            <Icon as={FiCpu} w={10} h={10} color="white" />
                        </MotionBox>

                        <VStack spacing={3}>
                            <Heading size="md" color={textColor}>
                                {loadingStage}
                            </Heading>
                            <Text color="gray.500" fontSize="sm">
                                Isso pode levar alguns segundos
                            </Text>
                            <Progress
                                size="xs"
                                isIndeterminate
                                w="200px"
                                colorScheme="purple"
                                borderRadius="full"
                                bg="gray.100"
                                _dark={{ bg: "gray.700" }}
                            />
                        </VStack>
                    </Flex>
                )}

                {data && !loading && (
                    <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>

                            {/* Sentimento Geral */}
                            <Card bg={cardBg} shadow="sm" borderRadius="lg">
                                <CardHeader pb={0}>
                                    <HStack>
                                        <Icon as={FiTrendingUp} color="blue.500" />
                                        <Text fontWeight="bold" fontSize="lg">Sentimento Geral</Text>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <HStack spacing={4} w="full">
                                            <VStack flex={1} p={4} bg="green.50" borderRadius="md" _dark={{ bg: 'green.900' }}>
                                                <Text fontSize="2xl" fontWeight="bold" color="green.500">{data.sentiment.positive}%</Text>
                                                <Text fontSize="sm" color="green.600">Positivo</Text>
                                            </VStack>
                                            <VStack flex={1} p={4} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                                                <Text fontSize="2xl" fontWeight="bold" color="gray.500">{data.sentiment.neutral}%</Text>
                                                <Text fontSize="sm" color="gray.600">Neutro</Text>
                                            </VStack>
                                            <VStack flex={1} p={4} bg="red.50" borderRadius="md" _dark={{ bg: 'red.900' }}>
                                                <Text fontSize="2xl" fontWeight="bold" color="red.500">{data.sentiment.negative}%</Text>
                                                <Text fontSize="sm" color="red.600">Negativo</Text>
                                            </VStack>
                                        </HStack>
                                        <Progress
                                            value={100}
                                            sx={{
                                                '& > div': {
                                                    background: `linear-gradient(to right, 
                            var(--chakra-colors-green-400) 0%, 
                            var(--chakra-colors-green-400) ${data.sentiment.positive}%, 
                            var(--chakra-colors-gray-400) ${data.sentiment.positive}% ${data.sentiment.positive + data.sentiment.neutral}%, 
                            var(--chakra-colors-red-400) ${data.sentiment.positive + data.sentiment.neutral}% 100%)`
                                                }
                                            }}
                                            h="8px"
                                            borderRadius="full"
                                        />
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* Insight da IA */}
                            <Card bg="linear-gradient(135deg, #0D249B 0%, #102dd1 100%)" shadow="sm" borderRadius="lg" color="white">
                                <CardHeader pb={0}>
                                    <HStack>
                                        <Icon as={FiCpu} color="white" />
                                        <Text fontWeight="bold" fontSize="lg">Insight da IA</Text>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack align="start" spacing={4} h="full" justify="center">
                                        <Text fontSize="lg" fontStyle="italic" lineHeight="tall">
                                            "{data.insight}"
                                        </Text>
                                        <Badge colorScheme="whiteAlpha" variant="solid">Análise Automática</Badge>
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* Principais Temas */}
                            <Card bg={cardBg} shadow="sm" borderRadius="lg" gridColumn={{ lg: "span 2" }}>
                                <CardHeader pb={0}>
                                    <HStack>
                                        <Icon as={FiMessageSquare} color="purple.500" />
                                        <Text fontWeight="bold" fontSize="lg">Principais Temas Identificados</Text>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
                                        {data.themes.map((theme, index) => (
                                            <VStack key={index} p={4} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }} align="start">
                                                <Text fontSize="xs" color="gray.500" fontWeight="bold">TEMA {index + 1}</Text>
                                                <Text fontWeight="bold" fontSize="md">{theme.name}</Text>
                                                <HStack w="full" justify="space-between">
                                                    <Progress value={theme.value} w="full" colorScheme="purple" size="sm" borderRadius="full" />
                                                    <Text fontSize="sm" fontWeight="bold">{theme.value}%</Text>
                                                </HStack>
                                            </VStack>
                                        ))}
                                    </SimpleGrid>
                                </CardBody>
                            </Card>

                            {/* Top 3 Positivos */}
                            <Card bg={cardBg} shadow="sm" borderRadius="lg">
                                <CardHeader pb={0}>
                                    <HStack>
                                        <Icon as={FiThumbsUp} color="green.500" />
                                        <Text fontWeight="bold" fontSize="lg">Top 3 Aspectos Positivos</Text>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {data.topPositive.map((item, index) => (
                                            <HStack key={index} p={3} bg="green.50" borderRadius="md" _dark={{ bg: 'green.900' }} justify="space-between">
                                                <HStack>
                                                    <Badge colorScheme="green" borderRadius="full" w={6} h={6} display="flex" alignItems="center" justifyContent="center">
                                                        {index + 1}
                                                    </Badge>
                                                    <Text fontWeight="medium">{item.name}</Text>
                                                </HStack>
                                                <Badge colorScheme="green" variant="subtle">{item.value}%</Badge>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* Top 3 Críticos */}
                            <Card bg={cardBg} shadow="sm" borderRadius="lg">
                                <CardHeader pb={0}>
                                    <HStack>
                                        <Icon as={FiAlertTriangle} color="red.500" />
                                        <Text fontWeight="bold" fontSize="lg">Top 3 Pontos Críticos</Text>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {data.topCritical.map((item, index) => (
                                            <HStack key={index} p={3} bg="red.50" borderRadius="md" _dark={{ bg: 'red.900' }} justify="space-between">
                                                <HStack>
                                                    <Badge colorScheme="red" borderRadius="full" w={6} h={6} display="flex" alignItems="center" justifyContent="center">
                                                        {index + 1}
                                                    </Badge>
                                                    <Text fontWeight="medium">{item.name}</Text>
                                                </HStack>
                                                <Badge colorScheme="red" variant="subtle">{item.value}%</Badge>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* Palavras-chave */}
                            <Card bg={cardBg} shadow="sm" borderRadius="lg" gridColumn={{ lg: "span 2" }}>
                                <CardHeader pb={0}>
                                    <HStack>
                                        <Icon as={FiHash} color="orange.500" />
                                        <Text fontWeight="bold" fontSize="lg">Palavras-chave Predominantes</Text>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <Wrap spacing={3}>
                                        {data.keywords.map((word, index) => (
                                            <WrapItem key={index}>
                                                <Tag
                                                    size="lg"
                                                    variant="subtle"
                                                    colorScheme={index % 2 === 0 ? "blue" : "cyan"}
                                                    borderRadius="full"
                                                    px={4}
                                                    py={2}
                                                >
                                                    {word}
                                                </Tag>
                                            </WrapItem>
                                        ))}
                                    </Wrap>
                                </CardBody>
                            </Card>

                        </SimpleGrid>
                    </MotionBox>
                )}

                {!data && !loading && (
                    <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        h="60vh"
                        bg={cardBg}
                        borderRadius="lg"
                        border="2px dashed"
                        borderColor="gray.200"
                        _dark={{ borderColor: 'gray.700' }}
                    >
                        <Icon as={FiCpu} w={16} h={16} color="gray.300" mb={4} />
                        <Text fontSize="xl" color="gray.500" fontWeight="medium">Pronto para analisar</Text>
                        <Text color="gray.400">Selecione uma empresa no menu lateral e clique em "Gerar Análise IA".</Text>
                    </Flex>
                )}
            </VStack>
        </MotionBox>
    )
}

export default AnaliseIAPage
