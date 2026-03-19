# Guia do Agente (IA) — IGA Gestão e Análise de Dados

Este arquivo é o “mapa” do projeto para qualquer IA/agente: **o que é**, **como roda**, **onde fica cada coisa** e **como implementar mudanças** sem se perder.

## Objetivo do produto

**IGA Gestão e Análise de Dados** — frontend administrativo e BI **moderno e organizado**, com:
- Layout padrão (Sidebar + Header + Content)
- Páginas principais (Dashboard, Relatórios, 404)
- Camada de dados por `services/` (atualmente **mock**; preparada para API futura)
- Boa UX: loading/empty/error e responsividade

## Stack e libs

- React + Vite + TypeScript
- Ant Design (`antd`) + `@ant-design/icons`
- React Router DOM
- Recharts (gráficos)
- Day.js (datas)
- Axios (instalado; preparado para API real no futuro)

## Como rodar

```bash
npm install
npm run dev
```

Build/preview:

```bash
npm run build
npm run preview
```

## Rotas atuais

- `/dashboard`
- `/relatorios`
- `*` → 404

As rotas estão em `src/routes/AppRouter.tsx`.

## Estrutura do projeto (o que procurar onde)

Base (src):
- `src/main.tsx`: Providers globais (AntD `ConfigProvider`, Router) e imports globais
- `src/App.tsx`: entrada do app (renderiza o Router)
- `src/routes/`: definição de rotas
- `src/layouts/`: layout principal (Sidebar/Header/Content) com `<Outlet />`
- `src/pages/`: páginas (cada rota = uma page)
- `src/services/`: “fontes de dados” (mock hoje; API amanhã)
- `src/mocks/`: dados mockados usados pelos services
- `src/utils/`: utilitários pequenos (ex: `sleep`)
- `src/index.css`: estilos globais mínimos (fundo/box-sizing)

## Fluxo de dados (padrão atual)

1) Página chama `services/*` dentro de `useEffect`.
2) Página mantém estado local com `useState` e o shape:
   - `loading` / `success` / `empty` / `error`
3) UI renderiza:
   - loading: `Skeleton`/`Spin`
   - error: `Alert` + ação “tentar novamente”
   - empty: `Empty`
   - success: conteúdo (cards/gráficos/tabela)

## Padrões de UI/UX (AntD)

- Preferir AntD para consistência: `Layout`, `Menu`, `Card`, `Space`, `Row/Col`, `Table`, `Form`, `Modal`, `Alert`, `notification`.
- Manter páginas com “estrutura” consistente:
  - Card de topo com título + subtítulo + ações
  - Conteúdo em cards
  - Espaçamento padrão `16`
- Responsividade:
  - Grid com `Row/Col`
  - Sidebar colapsável (já existe no layout)

## Convenções de implementação

- **Nomes**:
  - Pages: `XxxPage.tsx` em `src/pages/`
  - Layouts: `XxxLayout.tsx` em `src/layouts/`
  - Services: `xxxService.ts` em `src/services/`
- **Onde adicionar uma nova página**:
  1) Criar `src/pages/NovaPaginaPage.tsx`
  2) Adicionar rota em `src/routes/AppRouter.tsx`
  3) Adicionar item no menu em `src/layouts/AppLayout.tsx` (se for rota principal)
- **Sem dependência de API**:
  - Preferir criar mock em `src/mocks/` + função em `src/services/`
  - Simular latência e (opcionalmente) falha para validar UX

## Checklist rápido para qualquer mudança

- A tela tem estados: **loading / empty / error / success**?
- A UI está consistente com o layout (cards, espaçamento, grid)?
- A rota está registrada e acessível via menu (se aplicável)?
- Não há warnings/erros evidentes no console durante uso normal?
- O build funciona: `npm run build`

## Backlog recomendado (próximas evoluções)

- Tema dark/light (tokens do AntD)
- Componentes reutilizáveis (PageHeader, filtros, tabela padrão)
- Notificações globais e tratamento global de erro (interceptor quando tiver API)
- CRUD local (memória/localStorage) para fluxo completo
- Estado avançado (Context API ou Zustand) quando escalar telas
- React Query quando houver API real (cache/performance)
- Testes básicos (smoke de rotas + dashboard)

