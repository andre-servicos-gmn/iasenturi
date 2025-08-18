# Configuração do Sistema de Autenticação - Senturi

## Visão Geral

O sistema Senturi agora possui autenticação completa usando Supabase Auth. Todas as rotas estão protegidas e requerem login para acesso.

## Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- **Login/Registro**: Página elegante com design consistente
- **Proteção de Rotas**: Todas as páginas requerem autenticação
- **Logout**: Funcionalidade de sair do sistema
- **Validação**: Formulários com validação em tempo real
- **Feedback**: Notificações de sucesso/erro

### 🎨 Design
- **Logo Senturi**: Ícone de escudo com gradiente azul
- **Paleta de Cores**: Consistente com o tema do sistema
- **Animações**: Transições suaves com Framer Motion
- **Responsivo**: Funciona em todos os dispositivos

## Configuração do Supabase

### 1. Habilitar Authentication no Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Authentication** > **Settings**
4. Configure as seguintes opções:

#### Email Auth
- ✅ Enable Email Signup
- ✅ Enable Email Confirmations
- ✅ Enable Secure Email Change

#### URL Configuration
```
Site URL: http://localhost:5173
Redirect URLs: 
- http://localhost:5173/
- http://localhost:5173/login
```

### 2. Criar Usuário de Teste

#### Opção 1: Via Dashboard Supabase
1. Vá para **Authentication** > **Users**
2. Clique em **"Add User"**
3. Preencha:
   - Email: `admin@senturi.com`
   - Password: `123456`
4. Clique em **"Create User"**

#### Opção 2: Via Aplicação
1. Acesse `http://localhost:5173/login`
2. Clique em **"Crie uma conta"**
3. Preencha:
   - Email: `admin@senturi.com`
   - Password: `123456`
4. Clique em **"Criar Conta"**
5. Verifique seu email e confirme a conta

### 3. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://gqrmsvexxrycvslvbcjk.supabase.co/
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxcm1zdmV4eHJ5Y3ZzbHZiY2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTMxNTksImV4cCI6MjA2Njk2OTE1OX0.aIJY7kSz9UjlGKwGc48NyPOIhRkhWNBkaSHTNl9I178
```

## Como Usar

### 1. Primeiro Acesso
1. Acesse `http://localhost:5173`
2. Você será redirecionado para `/login`
3. Faça login com suas credenciais
4. Após login bem-sucedido, será redirecionado para o dashboard

### 2. Navegação
- **Dashboard**: Visão geral do sistema
- **Domínios**: Análise por domínios psicossociais
- **Mapa de Calor**: Visualização em heatmap
- **Histórico**: Evolução temporal dos dados

### 3. Logout
- Clique no ícone de usuário no header
- Selecione **"Sair"**
- Você será redirecionado para a página de login

## Estrutura de Arquivos

```
src/
├── contexts/
│   └── auth.tsx          # Contexto de autenticação
├── components/
│   ├── ProtectedRoute.tsx # Proteção de rotas
│   └── Header.tsx        # Header com logout
├── pages/
│   └── LoginPage.tsx     # Página de login
└── App.tsx               # Rotas protegidas
```

## Segurança

### ✅ Implementado
- **Autenticação Obrigatória**: Todas as rotas protegidas
- **Redirecionamento**: Usuários não autenticados → login
- **Sessão Persistente**: Login mantido entre sessões
- **Logout Seguro**: Limpeza completa da sessão

### 🔒 Próximos Passos (Opcional)
- **Roles/Permissões**: Diferentes níveis de acesso
- **2FA**: Autenticação de dois fatores
- **Auditoria**: Log de ações dos usuários
- **Rate Limiting**: Proteção contra ataques

## Troubleshooting

### Problema: "Invalid login credentials"
- Verifique se o email está correto
- Confirme se a conta foi criada e confirmada
- Verifique as configurações do Supabase Auth

### Problema: "Network error"
- Verifique a conexão com a internet
- Confirme as variáveis de ambiente
- Verifique se o Supabase está online

### Problema: "Redirect loop"
- Limpe o cache do navegador
- Verifique as configurações de URL no Supabase
- Confirme se as rotas estão configuradas corretamente

## Desenvolvimento

### Comandos Úteis
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Verificar tipos TypeScript
npm run lint
```

### Estrutura de Desenvolvimento
- **Contexto de Auth**: Gerencia estado global de autenticação
- **ProtectedRoute**: Componente HOC para proteger rotas
- **LoginPage**: Página de autenticação responsiva
- **Header**: Interface de usuário com logout

---

**Sistema de Autenticação Senturi** ✅ Implementado e Funcionando 