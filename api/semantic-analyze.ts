interface ValidRequest {
    method?: string;
    body?: any;
}

interface ValidResponse {
    status: (statusCode: number) => ValidResponse;
    json: (data: any) => ValidResponse;
}

export default async function handler(
    request: ValidRequest,
    response: ValidResponse
) {
    // 1. Validar método HTTP
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Method Not Allowed',
            message: 'Apenas POST é permitido.',
        });
    }

    // 2. Ler e validar body
    const { requestId, input, context } = request.body || {};

    if (!input || typeof input !== 'string') {
        return response.status(400).json({
            error: 'Bad Request',
            message: 'O campo "input" é obrigatório e deve ser uma string.',
        });
    }

    // 3. Obter configurações do ambiente
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    const n8nClientToken = process.env.N8N_CLIENT_TOKEN;

    if (!n8nWebhookUrl) {
        console.error('N8N_WEBHOOK_URL não está configurada no ambiente.');
        return response.status(500).json({
            error: 'Server Configuration Error',
            message: 'A variável de ambiente N8N_WEBHOOK_URL não está definida.',
        });
    }

    try {
        // 4. Fazer requisição ao n8n
        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-token': n8nClientToken || '',
            },
            body: JSON.stringify({
                requestId,
                input,
                context: context || {},
            }),
        });

        // 5. Tratar resposta do n8n
        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error('Erro no n8n:', n8nResponse.status, errorText);
            return response.status(n8nResponse.status).json({
                error: 'Upstream Error',
                message: `Erro ao comunicar com n8n: ${n8nResponse.statusText}`,
                details: errorText
            });
        }

        const data = await n8nResponse.json();

        // 6. Retornar dados ao cliente
        return response.status(200).json(data);

    } catch (error: any) {
        console.error('Erro interno na API:', error);
        return response.status(500).json({
            error: 'Internal Server Error',
            message: error.message || 'Ocorreu um erro desconhecido.',
        });
    }
}
