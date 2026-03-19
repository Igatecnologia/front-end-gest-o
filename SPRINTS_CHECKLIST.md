# ✅ Checklist Evoluído — Frontend Admin + BI (2025–2026)

Este checklist é a “Fonte da Verdade” para evoluir o produto até um **Admin + BI nível empresa**.

## Sprint 1 — Fundação (Base & Arquitetura)
- [x] Setup: Vite + React + TypeScript (strict)
- [x] Ant Design + React Router
- [x] Layout base (Sidebar/Header/Content) responsivo
- [x] Rotas iniciais + 404
- [x] Aliases `@/` (path mapping) para imports
- [x] ESLint + Prettier
- [x] Regras A11y base (jsx-a11y)
- [x] Tokens de Dark/Light via CSS Variables (otimização opcional)

## Sprint 2 — Camada de Dados (Resiliência)
- [x] Axios (`http`) com interceptors (token + 401 global)
- [x] TanStack Query (QueryClient, staleTime, retry)
- [x] Query Key Factory (`src/query/queryKeys.ts`)
- [x] Migração das páginas principais para `useQuery` (sem `useEffect` para fetch)
- [x] Validação runtime (Zod) e helpers (`src/api/validatedHttp.ts`)
- [x] Zod schema por endpoint real (contratos da API)
- [x] MSW (mock realista) para integração paralela ao backend
- [x] Global error handling por código HTTP (mensagens contextuais)

## Sprint 3 — Dashboard (BI PROFISSIONAL)

### 📊 KPIs (evoluído)
- [x] Valor atual
- [x] Variação (%)
- [x] Comparação com período anterior (ex: vs período anterior selecionado)
- [x] Sparkline (mini gráfico) por KPI

### 📈 Gráficos principais (expandido)
- [x] Linha (evolução temporal)
- [x] Barras (comparação)
- [x] Área (tendência acumulada)
- [x] Combinado (linha + barra)
- [x] Pizza/Donut (participação)
- [x] Heatmap (dia/hora)
- [x] Scatter plot (correlação)
- [x] Funnel (conversão)
- [x] Waterfall (ganhos/perdas)
- [x] Radar (performance por categoria)

### 🔎 Interatividade (nível BI)
- [x] Drill-down: clique no gráfico filtra tabela (**dia e mês**)
- [x] Drill-down hierárquico (dia → mês → ano)
- [x] Drill-through (abrir outra página com contexto)
- [x] Tooltip rico (múltiplas métricas)
- [x] Cross-filter (clicar em gráfico filtra outros widgets)
- [x] Multi-seleção em gráficos

### 🧮 Tabelas inteligentes
- [x] Paginação
- [x] Filtros
- [x] Ordenação nas colunas das tabelas (sorter prop)
- [x] Virtualização base (tanstack-virtual) para listas grandes
- [x] Agrupamento (group by)
- [x] Subtotais e totais
- [x] Colunas calculadas
- [x] Colunas customizáveis (mostrar/ocultar)
- [x] Freeze columns (fixar colunas)

### 🔁 Persistência e estado
- [x] URL State
- [x] Saved Views
- [x] Compartilhar link (copiar URL)
- [x] Favoritar dashboards
- [x] Compartilhamento com permissões

## Sprint 4 — UX & Performance Crítica
- [x] Skeletons/Empty States
- [x] Error Boundary global
- [x] Dark/Light + persistência
- [x] Mobile nav em Drawer
- [x] Virtualização (tanstack-virtual) em tabelas/listas grandes (>100 linhas)
- [x] A11y Review completo (WCAG 2.1): teclado/foco/labels/contraste
- [x] Lazy loading de gráficos pesados (quando existirem)

## Sprint 5 — Relatórios (NÍVEL EMPRESA) + Governança

### 📑 Relatórios (tipos)
- [x] Operacionais: Vendas (base)
- [x] Operacionais: Usuários (base)
- [x] Operacionais: Logs/Auditoria (base)
- [x] Performance (tempo de resposta/uso)
- [x] Financeiro (receita/custos/lucro)
- [x] Conversão (funil)
- [x] Retenção (cohort)
- [x] Tendência e comparação (YoY/MoM)
- [x] Top N / Sazonalidade / Segmentação

### 📤 Exportação (profissional)
- [x] CSV
- [x] Excel formatado (abas/estilos)
- [x] PDF executivo (layout bonito)
- [x] Export gráfico como imagem (PNG/SVG)
- [x] Agendamento de relatórios (simulado)

### 🔍 Filtros avançados
- [x] Básicos
- [x] RBAC aplicado nos módulos
- [x] Intervalo de datas avançado
- [x] Filtros combinados (AND/OR)
- [x] Filtros salvos por usuário

### 🔐 Admin & Compliance
- [x] Login + rotas privadas
- [x] RBAC (rota + menu + ação)
- [x] CRUD Usuários (localStorage) + validação
- [x] Auditoria/Logs (URL + export CSV)
- [x] Audit Trail avançado: “diff” (de/para) em mudanças críticas
- [x] LGPD: masking de PII + log de revelação/acesso sensível

## Sprint 6 — BI Avançado + API Real

### 🔌 Integração real
- [x] Paginação server-side
- [x] Filtros server-side
- [x] Ordenação server-side
- [x] Mutations com invalidação de cache (TanStack Query)
- [x] Zod schema por endpoint real (contratos)

### ⚡ Performance
- [x] Debounce em filtros
- [x] Cache e invalidação consistentes
- [x] Virtualização em datasets muito grandes (ajustes finos)

### 🔄 Tempo real
- [x] Polling configurável
- [x] SSE/WebSocket
- [x] Indicador “dados atualizados agora”

### 🧠 Inteligência (diferencial)
- [x] Insights automáticos (regras simples)
- [x] Destaque de anomalias
- [x] Sugestões de filtros

## Sprint 7 — Qualidade (NÍVEL PRODUTO)

### 🧪 Testes focados em BI
- [x] Filtros + gráficos
- [x] Drill-down / drill-through
- [x] Exportação
- [x] RBAC em relatórios

### 🧪 Testes gerais
- [x] E2E (Playwright): login, navegação, RBAC (403) e CRUD
- [x] Storage State (Playwright) para acelerar
- [x] Unit: services/utils (contratos, parsers)

### 🔐 Segurança e deploy
- [x] CSP e headers de segurança (hosting)
- [x] Checklist de deploy automatizado

