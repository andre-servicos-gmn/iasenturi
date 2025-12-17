import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Heading,
    Textarea,
    Text,
    VStack,
    Code,
    useToast,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { semanticAnalyze } from '../services/semanticAi';

const SemanticAiTest: React.FC = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const handleAnalyze = async () => {
        if (!input.trim()) {
            toast({
                title: 'Input vazio',
                description: 'Por favor, digite algum texto para analisar.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await semanticAnalyze(input);
            setResult(data);
            toast({
                title: 'Sucesso',
                description: 'Análise semântica concluída.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err: any) {
            const msg = err.message || 'Erro desconhecido ao realizar análise.';
            setError(msg);
            toast({
                title: 'Erro',
                description: msg,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxW="container.md" py={10}>
            <VStack spacing={6} align="stretch">
                <Heading as="h1" size="xl" textAlign="center">
                    Teste de Análise Semântica (IA)
                </Heading>

                <Text>
                    Digite um texto abaixo para enviá-lo ao n8n via API Route e receber a análise semântica.
                </Text>

                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ex: O cliente está interessado em comprar o plano Premium..."
                    size="lg"
                    minH="150px"
                    disabled={isLoading}
                />

                <Button
                    colorScheme="blue"
                    onClick={handleAnalyze}
                    isLoading={isLoading}
                    loadingText="Analisando..."
                    size="lg"
                    width="full"
                >
                    Analisar por IA
                </Button>

                {error && (
                    <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box flex="1">
                            <AlertTitle>Erro na análise!</AlertTitle>
                            <AlertDescription display="block">
                                {error}
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}

                {result && (
                    <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.700' }} w="full">
                        <Heading as="h3" size="md" mb={3}>Resultado:</Heading>
                        <Box maxH="400px" overflowY="auto">
                            <Code display="block" whiteSpace="pre" p={2} borderRadius="md" w="full">
                                {JSON.stringify(result, null, 2)}
                            </Code>
                        </Box>
                    </Box>
                )}
            </VStack>
        </Container>
    );
};

export default SemanticAiTest;
