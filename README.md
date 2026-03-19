# IGA Gestão e Análise de Dados

Frontend administrativo e BI **moderno e organizado**, usando **React + Vite + TypeScript** e **Ant Design**.

## Stack

- **UI**: Ant Design (`antd`) + `@ant-design/icons`
- **Rotas**: React Router
- **HTTP (futuro)**: Axios (por enquanto a camada está mockada)
- **Gráficos**: Recharts
- **Datas**: Day.js

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run test:unit
npm run test:e2e
```

## Deploy (Vercel / Netlify)

- **Vercel**: deploy padrão (SPA) já coberto por `vercel.json`.
- **Netlify**: deploy padrão (SPA) já coberto por `netlify.toml`.

## Deploy (GitHub Pages) — **pré-visualização temporária**

> **Uso pretendido:** ambiente **temporário** só para o **cliente acompanhar o front em tempo quase real** (cada push atualiza o site). **Não é** o alvo final de produção — para isso use **Vercel / Netlify** (ou outro pipeline acordado com o time).

O workflow `.github/workflows/deploy-github-pages.yml` faz o build com `VITE_BASE=/<nome-do-repo>/` (usa o nome do repositório automaticamente), gera `404.html` para o SPA e publica a pasta `dist`.

1. Faça push para `master` ou `main`.
2. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. A URL será `https://<usuario-ou-org>.github.io/<nome-do-repo>/` (ex.: org `Igatecnologia` e repo `front-end-gest-o`).

Build local com o mesmo critério (PowerShell):

```powershell
$env:VITE_BASE="/front-end-gest-o/"
npm run build:gh-pages
```
(Ajuste o valor se o nome do repositório for outro.)

**Se logo / fundo do login ou dados (mock) não aparecem no Pages:** o app fica em subpasta (`/<repo>/`). Use `publicAssetUrl()` para arquivos em `public/` e o MSW já registra o `mockServiceWorker.js` com `BASE_URL` + `scope` corretos.

## Acessar local

Abra `http://localhost:5173`.

## Variáveis de ambiente

Quando houver API, copie `.env.example` para `.env` e ajuste:

- `VITE_API_BASE_URL`
- `VITE_USE_MOCKS` (true/false)

## Rotas principais

- `/dashboard`
- `/dashboard/analises`
- `/dashboard/dados`
- `/financeiro`
- `/relatorios`
- `/usuarios` (CRUD local)
- `/auditoria` (logs)
- `*` (404)

## Estrutura (src)

- **`layouts/`**: layout principal (Sidebar/Header/Content)
- **`routes/`**: rotas do app
- **`pages/`**: Dashboard (visão geral + BI + dados), Financeiro, Relatórios, Usuários, Auditoria
- **`services/`**: camada de serviços (mock por enquanto)
- **`mocks/`**: dados mockados para UI

## Sprints do projeto

Checklist detalhado: `SPRINTS_CHECKLIST.md`
Arquitetura: `ARCHITECTURE.md`
Deploy: `DEPLOY_CHECKLIST.md`

### Sprint 1 — Fundação (concluída)
- Base Vite + React + TypeScript (strict), Ant Design e React Router
- Layout responsivo (Sidebar/Header/Content), rotas iniciais e 404
- ESLint + Prettier + organização de imports/aliases

### Sprint 2 — Dados e resiliência (concluída)
- Axios com interceptors e tratamento global de erros HTTP
- TanStack Query + query keys padronizadas
- Contratos com Zod e MSW para mock realista

### Sprint 3 — Dashboard BI (concluída)
- KPIs com comparação de período e variação
- Biblioteca de gráficos e interações (drill-down, cross-filter, tooltip rico)
- Tabelas com paginação/filtros/ordenação e virtualização

### Sprint 4 — UX e performance (concluída)
- Skeleton/empty/error states e Error Boundary global
- Tema dark/light com persistência
- Responsividade mobile (Drawer) e revisão de acessibilidade

### Sprint 5 — Relatórios e governança (concluída)
- Relatórios operacionais e analíticos (financeiro, conversão, retenção etc.)
- Exportações CSV/Excel/PDF/PNG/SVG + agendamento (simulado)
- Compliance: RBAC, trilha de auditoria com diff, masking de PII

### Sprint 6 — BI avançado + integração (concluída)
- Paginação/filtros/ordenação server-side
- Debounce, cache e invalidação de mutations
- Indicadores em tempo real (polling) + insights e anomalias

### Sprint 7 — Qualidade de produto (concluída)
- Testes E2E (Playwright) para login, RBAC e CRUD
- Testes unitários em services/utils
- Hardening de deploy (CSP/headers/checklist)

### Sprint 8 — Fluxo ERP + BI operacional (referência)
- Roadmap de evolução funcional do front para fluxo ponta a ponta
- Abrange produção, estoque, comercial, faturamento e financeiro
- Inclui cálculo de custo real, margem, alertas e cronograma de 10 dias (dev único)

## Login (demo)

- **Admin**: `admin@admin.com` / `admin`
- **Manager**: `manager@admin.com` / `admin`
- **Viewer**: `viewer@admin.com` / `admin`
