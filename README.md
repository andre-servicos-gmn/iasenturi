# Senturi 4.0 - Plataforma de Análise de Saúde Ocupacional

Uma plataforma web moderna para análise de saúde ocupacional e risco psicossocial, com sistema de autenticação completo.

## 🚀 Funcionalidades

### ✅ Sistema de Autenticação
- **Login/Registro**: Interface elegante com validação em tempo real
- **Proteção de Rotas**: Todas as páginas requerem autenticação
- **Logout Seguro**: Funcionalidade completa de sair do sistema
- **Sessão Persistente**: Login mantido entre sessões do navegador

### 📊 Análise de Dados
- **Dashboard**: Visão geral com métricas principais
- **Domínios Psicossociais**: Análise detalhada por domínios
- **Mapa de Calor**: Visualização interativa dos dados
- **Histórico**: Evolução temporal e intervenções

### 🎨 Interface
- **Design Moderno**: Interface limpa e profissional
- **Responsivo**: Funciona em todos os dispositivos
- **Animações**: Transições suaves com Framer Motion
- **Tema Consistente**: Paleta de cores Senturi

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Chakra UI
- **Autenticação**: Supabase Auth
- **Banco de Dados**: Supabase (PostgreSQL)
- **Animações**: Framer Motion
- **Gráficos**: Chart.js + React Chart.js 2
- **Build Tool**: Vite

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone <repository-url>
cd senturi-4.0
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto (ou `.env.local`):

```env
VITE_SUPABASE_URL=<sua_url_do_supabase>
VITE_SUPABASE_ANON_KEY=<sua_chave_anonima_supabase>
```

### 4. Configure o Supabase Auth
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá para **Authentication** > **Settings**
3. Configure:
   - Enable Email Signup: ✅
   - Enable Email Confirmations: ✅
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/`

### 5. Execute o projeto
```bash
npm run dev
```

### 6. Arquivos de ambiente

Um `.env.example` é fornecido com as chaves esperadas. Copie-o para `.env` e preencha:

```bash
cp .env.example .env
```

## 🔐 Primeiro Acesso

### Criar Conta
1. Acesse `http://localhost:5173`
2. Você será redirecionado para `/login`
3. Clique em **"Crie uma conta"**
4. Preencha:
   - Email: `seu-email@empresa.com`
   - Senha: `defina-uma-senha-forte`
5. Clique em **"Criar Conta"**
6. Verifique seu email e confirme a conta

### Fazer Login
1. Acesse `http://localhost:5173/login`
2. Preencha suas credenciais
3. Clique em **"Entrar"**
4. Você será redirecionado para o dashboard

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Header.tsx       # Header com logout
│   ├── Layout.tsx       # Layout da aplicação
│   ├── ProtectedRoute.tsx # Proteção de rotas
│   └── Sidebar.tsx      # Menu lateral
├── contexts/            # Contextos React
│   ├── auth.tsx         # Contexto de autenticação
│   └── store.ts         # Estado global
├── pages/               # Páginas da aplicação
│   ├── LoginPage.tsx    # Página de login
│   ├── DominiosPage.tsx # Análise por domínios
│   ├── MapaCalorPage.tsx # Mapa de calor
│   └── HistoricoPage.tsx # Histórico
├── lib/                 # Utilitários
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Funções utilitárias
├── styles/              # Estilos
│   └── theme.ts         # Tema Chakra UI
└── types/               # Tipos TypeScript
    └── index.ts         # Definições de tipos
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Build para produção
npm run preview      # Preview do build

# Qualidade de Código
npm run lint         # Verifica tipos TypeScript
```

## 📤 Exportação de Relatórios

### Funcionalidades
- **Exportação em PDF**: Geração de relatórios de alta qualidade
- **Captura de Gráficos**: Preserva Chart.js e Visx com nitidez máxima
- **Logo Automático**: Detecta tema claro/escuro e usa logo apropriado
- **Layout Fiel**: Mantém tipografia e gradientes do Chakra UI
- **Nome Dinâmico**: Formato `Relatorio-Senturi-YYYY-MM-DD.pdf`

### Tecnologias
- **dom-to-image-more**: Captura HTML com qualidade máxima
- **jsPDF**: Geração de PDF em formato A4 com margens
- **Frontend Only**: Funciona sem dependência de backend

### Uso
```tsx
import ExportButton from '@/components/ExportButton'

<ExportButton
  elementId="relatorio-senturi"
  title="Título do Relatório"
  subtitle="Subtítulo opcional"
  filename="Nome-personalizado.pdf" // opcional
/>
```

### Implementação
1. Adicione `id="relatorio-senturi"` ao container principal
2. Importe e use o componente `ExportButton`
3. Configure título, subtítulo e nome do arquivo
4. O botão automaticamente detecta tema e gera PDF

## 🎨 Design System

### Cores Principais
- **Azul Escuro**: `#0D249B`
- **Azul Destaque**: `#1A45FC`
- **Verde**: `#10B981`
- **Vermelho**: `#EF4444`
- **Amarelo**: `#F59E0B`

### Componentes
- **Cards**: Bordas arredondadas com sombras suaves
- **Botões**: Gradientes com hover effects
- **Formulários**: Validação em tempo real
- **Navegação**: Menu lateral responsivo

## 🔒 Segurança

### Implementado
- ✅ Autenticação obrigatória para todas as rotas
- ✅ Redirecionamento automático para login
- ✅ Sessão persistente entre sessões
- ✅ Logout seguro com limpeza de dados
- ✅ Validação de formulários
- ✅ Proteção contra acesso direto às rotas

### Próximos Passos (Opcional)
- 🔄 Roles e permissões por usuário
- 🔄 Autenticação de dois fatores (2FA)
- 🔄 Auditoria de ações dos usuários
- 🔄 Rate limiting para proteção
 - 🔄 Remover logs sensíveis em produção

## 📊 Funcionalidades de Análise

### Dashboard
- Métricas gerais de saúde ocupacional
- Indicadores de risco psicossocial
- Gráficos de tendência temporal
- Alertas e recomendações

### Domínios Psicossociais
- **Demandas Psicológicas**: Concentração, memorização
- **Demandas Físicas**: Esforço físico, postura
- **Demandas de Trabalho**: Influência e desenvolvimento
- **Suporte Social e Liderança**: Relacionamentos, liderança
- **Esforço e Recompensa**: Reconhecimento, desenvolvimento
- **Interface Trabalho-Vida**: Equilíbrio pessoal/profissional
- **Saúde Emocional**: Bem-estar, satisfação

### Mapa de Calor
- Visualização interativa por setores
- Identificação de áreas críticas
- Comparação entre períodos
- Exportação de relatórios em PDF

### Histórico
- Evolução temporal dos dados
- Intervenções realizadas
- Análise de impacto
- Tendências e projeções

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- 📧 Email: suporte@senturi.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Website: https://senturi.com

---

**Senturi 4.0** - Transformando a saúde ocupacional através da tecnologia 🚀 