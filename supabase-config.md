# Configuração do Supabase

Para conectar o projeto com o banco de dados Supabase, siga estes passos:

## 1. Criar arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 2. Obter credenciais do Supabase

1. Acesse o painel do Supabase (https://supabase.com)
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie:
   - **Project URL** → VITE_SUPABASE_URL
   - **anon public** → VITE_SUPABASE_ANON_KEY

## 3. Estrutura da Tabela

O projeto espera uma tabela chamada `COPSQ_respostas` com os seguintes campos principais:

- `id` (string)
- `nome_completo` (string)
- `area_setor` (string)
- `media_exigencias` (string/number)
- `media_organizacao` (string/number)
- `media_relacoes` (string/number)
- `media_interface` (string/number)
- `media_significado` (string/number)
- `media_inseguranca` (string/number)
- `media_bem_estar` (string/number)
- `iseso` (string/number)

## 4. Dados de Exemplo

Baseado no arquivo SQL fornecido, os dados já estão estruturados corretamente. O sistema irá:

- Buscar todos os registros da tabela `COPSQ_respostas`
- Calcular médias por domínio
- Gerar gráficos radar com dados reais
- Mostrar comparações por setor

## 5. Testar a Conexão

Após configurar as variáveis de ambiente, reinicie o servidor:

```bash
npm run dev
```

A página de Domínios agora deve carregar dados reais do banco de dados. 