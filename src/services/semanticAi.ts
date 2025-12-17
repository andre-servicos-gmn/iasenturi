export interface SemanticAnalyzeParams {
    input: string;
    context?: Record<string, any>;
    requestId?: string;
}

export interface SemanticAnalyzeResponse {
    [key: string]: any;
}

/**
 * Envia um input para análise semântica via API route (proxy para n8n).
 *
 * @param input Texto para análise
 * @param context Contexto opcional (objeto JSON)
 * @returns Promise com o JSON de resposta do n8n
 */
export async function semanticAnalyze(
    input: string,
    context?: Record<string, any>
): Promise<SemanticAnalyzeResponse> {
    const requestId = crypto.randomUUID(); // Gera um ID único para rastreamento (opcional, mas boa prática)

    try {
        const response = await fetch('/api/semantic-analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestId,
                input,
                context,
            }),
        });

        if (!response.ok) {
            let errorMessage = `Erro na requisição: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Se não for JSON, usa o texto padrão
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro em semanticAnalyze:', error);
        throw error;
    }
}
