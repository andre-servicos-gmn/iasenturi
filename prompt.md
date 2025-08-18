O Senturi é uma plataforma web para análise de saúde ocupacional e risco psicossocial baseada nos questionários COPSOQ, EPS e PSQI. Seu objetivo é transformar dados complexos em dashboards visuais, interpretáveis e acionáveis — sem exigir conhecimento técnico.

 

🎯 Objetivo

Entregar uma aplicação corporativa premium que:

Apresente visualizações claras e hierárquicas

Destaque os riscos prioritários com cores, alertas e ações sugeridas

Seja 100% funcional com dados reais (via Supabase)

Sirva como ferramenta de análise e decisão para RH, consultorias e lideranças

 

📊 Base de dados

Os dados vêm exclusivamente do Supabase (PostgreSQL)

Não usar valores mockados nem dados hardcoded

Usar os campos reais conforme tabelas SQL fornecidas

 

📐 Visual & UX

Interface moderna e limpa com gradientes estratégicos (Azul Escuro → Azul Destaque)

Tipografia Inter com hierarquia visual clara (títulos grandes, texto leve)

Sistema responsivo (mobile-first) com foco em leitura rápida

Componentes animados com Framer Motion (150–300ms)

Tema Claro/Escuro com troca suave (sem flash)

Feedback visual elegante (loading states, placeholders, transições)

 

📎 Estrutura por Página

/dashboard → Painel Resumo por Colaborador

ISESO Geral (índice médio ponderado dos 8 domínios)

Cor + % de risco

Cards com:

Colaboradores avaliados

Setores críticos

Última atualização

Lista com Nome/ID, Domínio Crítico, Data da Avaliação

Top 3 Riscos com Ações Sugeridas ao lado

Alertas visuais automáticos:

< 40 → Crítico (⚠️)

40–70 → Atenção (🟡)

70 → Favorável (✅)

/dominios → Painel por Domínio

Gráfico Radar com os 8 domínios COPSOQ

Classificação por cor para leitura imediata

Comparação com média por setor

Ordenação do pior domínio ao melhor

Gradiente leve nas áreas do radar

/mapa-calor → Mapa de Calor por Setor

Linhas = setores ou equipes

Colunas = domínios

Cores = intensidade de risco (vermelho, amarelo, verde)

Filtro por tempo: últimos 30, 60, 90 dias

Gradiente Senturi nas células

/historico → Histórico por Reavaliações

Gráfico de linha com evolução dos domínios

Comparação Antes vs Depois

Destaque de mudanças significativas

Lista de intervenções realizadas por ciclo

 

📤 Exportação de Relatórios

A exportação será feita via botão (não é uma página)

Geração de PDF com logo Senturi e layout profissional

Filtros aplicados: setor, empresa, período, domínio

Agrupamento de dados por: área, faixa etária, tempo de empresa, função/cargo

Usar Puppeteer para SSR se necessário

 

⚡ Filtros Globais

Disponíveis no topo da interface, com persistência entre páginas:

Empresa

Setor

Período (data range)

Gênero / Faixa Etária (filtro extra, se disponível)

Devem influenciar todos os dashboards

 

🤖 Ações Sugeridas Contextuais

Toda vez que um domínio apresentar risco Crítico, Atenção ou Muito Favorável, deve-se exibir ao lado do gráfico ou item uma sugestão de ação contextual baseada em uma config.json.

Exemplo:

Domínio 8 – Saúde Emocional:

Crítico: Workshop de regulação emocional + sessão com liderança

Atenção: Pausas cognitivas + gamificação com microdesafios

Muito Favorável: Reforçar boas práticas + reconhecer equipes

 

🛠 Stack Tecnológica

Next.js 14 com App Router (SSR)

TypeScript

Supabase (Auth + Postgres)

TailwindCSS com shadcn/ui

Zustand (filtros globais)

Framer Motion (animações)

Recharts ou Nivo (gráficos)

Puppeteer (PDF)

next-themes (modo escuro)

 

🧠 Comportamentos esperados

Priorize clareza de leitura, sem ruído visual

Informações críticas devem aparecer primeiro

Use cores semânticas: vermelho = crítico, amarelo = atenção, verde = favorável

Sem dados falsos — apenas reais via Supabase

Use loading states elegantes

Animações suaves (entrada de cards, transição entre páginas)

Nunca use elementos visualmente genéricos de dashboards antigos

Se inspirar em sistemas modernos como Linear.app, Cal.com, Slite, Intercom

 

📁 Estrutura esperada

/app (páginas com App Router)

/components (UI e layout reutilizável)

/lib (funções de cálculo, lógica, utils)

/contexts (Zustand)

/types (tipagens gerais)

/styles (globals, themes)

/data/config.json (ações sugeridas)

/export (função de geração de PDF)

 

✅ Regras Finais

Sempre leia esse prompt.md antes de gerar algo

Crie o projeto com base nesse guia

Divida a implementação por etapas: layout → dashboard → filtros → gráficos → exportação

Refatore se o visual não estiver premium

Jamais use dados fictíciosO Senturi é uma plataforma web para análise de saúde ocupacional e risco psicossocial baseada nos questionários COPSOQ, EPS e PSQI. Seu objetivo é transformar dados complexos em dashboards visuais, interpretáveis e acionáveis — sem exigir conhecimento técnico.

 

🎯 Objetivo

Entregar uma aplicação corporativa premium que:

Apresente visualizações claras e hierárquicas

Destaque os riscos prioritários com cores, alertas e ações sugeridas

Seja 100% funcional com dados reais (via Supabase)

Sirva como ferramenta de análise e decisão para RH, consultorias e lideranças

 

📊 Base de dados

Os dados vêm exclusivamente do Supabase (PostgreSQL)

Não usar valores mockados nem dados hardcoded

Usar os campos reais conforme tabelas SQL fornecidas

 

📐 Visual & UX

Interface moderna e limpa com gradientes estratégicos (Azul Escuro → Azul Destaque)

Tipografia Inter com hierarquia visual clara (títulos grandes, texto leve)

Sistema responsivo (mobile-first) com foco em leitura rápida

Componentes animados com Framer Motion (150–300ms)

Tema Claro/Escuro com troca suave (sem flash)

Feedback visual elegante (loading states, placeholders, transições)

 

📎 Estrutura por Página

/dashboard → Painel Resumo por Colaborador

ISESO Geral (índice médio ponderado dos 8 domínios)

Cor + % de risco

Cards com:

Colaboradores avaliados

Setores críticos

Última atualização

Lista com Nome/ID, Domínio Crítico, Data da Avaliação

Top 3 Riscos com Ações Sugeridas ao lado

Alertas visuais automáticos:

< 40 → Crítico (⚠️)

40–70 → Atenção (🟡)

70 → Favorável (✅)

/dominios → Painel por Domínio

Gráfico Radar com os 8 domínios COPSOQ

Classificação por cor para leitura imediata

Comparação com média por setor

Ordenação do pior domínio ao melhor

Gradiente leve nas áreas do radar

/mapa-calor → Mapa de Calor por Setor

Linhas = setores ou equipes

Colunas = domínios

Cores = intensidade de risco (vermelho, amarelo, verde)

Filtro por tempo: últimos 30, 60, 90 dias

Gradiente Senturi nas células

/historico → Histórico por Reavaliações

Gráfico de linha com evolução dos domínios

Comparação Antes vs Depois

Destaque de mudanças significativas

Lista de intervenções realizadas por ciclo

 

📤 Exportação de Relatórios

A exportação será feita via botão (não é uma página)

Geração de PDF com logo Senturi e layout profissional

Filtros aplicados: setor, empresa, período, domínio

Agrupamento de dados por: área, faixa etária, tempo de empresa, função/cargo

Usar Puppeteer para SSR se necessário

 

⚡ Filtros Globais

Disponíveis no topo da interface, com persistência entre páginas:

Empresa

Setor

Período (data range)

Gênero / Faixa Etária (filtro extra, se disponível)

Devem influenciar todos os dashboards

 

🤖 Ações Sugeridas Contextuais

Toda vez que um domínio apresentar risco Crítico, Atenção ou Muito Favorável, deve-se exibir ao lado do gráfico ou item uma sugestão de ação contextual baseada em uma config.json.

Exemplo:

Domínio 8 – Saúde Emocional:

Crítico: Workshop de regulação emocional + sessão com liderança

Atenção: Pausas cognitivas + gamificação com microdesafios

Muito Favorável: Reforçar boas práticas + reconhecer equipes

 

🛠 Stack Tecnológica

React 18 + Vite (leve, rápido, simples)

TypeScript (pra evitar bugs e facilitar colaboração)

Chakra UI (componentes acessíveis, tema pronto, modo dark incluso)

Zustand (estado global de filtros e UI)

Chart.js (radar, linha, barra, heatmap — funciona muito bem)

Supabase (auth e banco de dados em tempo real)

Framer Motion (animações elegantes)

jsPDF + html2canvas (para exportação PDF)

 

🧠 Comportamentos esperados

Priorize clareza de leitura, sem ruído visual

Informações críticas devem aparecer primeiro

Use cores semânticas: vermelho = crítico, amarelo = atenção, verde = favorável

Sem dados falsos — apenas reais via Supabase

Use loading states elegantes

Animações suaves (entrada de cards, transição entre páginas)

Nunca use elementos visualmente genéricos de dashboards antigos

Se inspirar em sistemas modernos como Linear.app, Cal.com, Slite, Intercom

 

📁 Estrutura esperada

/app (páginas com App Router)

/components (UI e layout reutilizável)

/lib (funções de cálculo, lógica, utils)

/contexts (Zustand)

/types (tipagens gerais)

/styles (globals, themes)

/data/config.json (ações sugeridas)

/export (função de geração de PDF)

 

✅ Regras Finais

Sempre leia esse prompt.md antes de gerar algo

Crie o projeto com base nesse guia

Divida a implementação por etapas: layout → dashboard → filtros → gráficos → exportação

Refatore se o visual não estiver premium

Jamais use dados fictícios