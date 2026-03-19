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

## Sprint 1 — Fundação
- Setup do projeto (Vite + React + TS)
- Ant Design + Router
- Estrutura base de pastas
- Rotas iniciais + layout (Sidebar/Header/Content)

## Sprint 2 — Camada de dados (mocks/services)
- `mocks/` + `services/` com delay e simulação de erro
- Padrão de estados: **loading / success / empty / error**
- Axios preparado com `VITE_API_BASE_URL`

## Sprint 3 — Dashboard (UI + dados)
- KPIs (cards) + gráficos (linha/barras) + tabela
- Filtros básicos e busca
- Componentização inicial (ex: `PageHeaderCard`)

## Sprint 4 — UX/Responsivo/Erros
- Loading com `Skeleton` e feedback de erro com `Alert` + `notification`
- Tema **dark/light** com persistência
- Mobile: navegação lateral em **Drawer**
- Error Boundary global (evita “tela branca”)

## Sprint 5 — Relatórios e Governança (nível empresa)
- Tipos de relatório: Performance, Conversão, Retenção, Tendência (YoY/MoM), Top N, Sazonalidade e Segmentação
- Exportação: CSV, Excel, PDF executivo e gráfico em PNG/SVG
- Agendamento de relatórios (simulado)
- Filtros avançados: intervalo de datas, lógica AND/OR e filtros salvos por usuário
- Compliance: audit trail com diff (de/para), masking de PII e registro de acesso sensível (simulado)

## Backlog prioritário

- **Saved views** (salvar filtros/colunas por página) + “Compartilhar link”
- **Auditoria/Logs** (tabela + filtros + export)
- **Drill-down avançado** (cross-filter entre widgets do dashboard)
- **Componentes reutilizáveis** (Design System interno)
- **Estado avançado** (Context API ou Zustand) quando houver mais telas
- **React Query** quando houver API real (cache/performance)
- **Testes** (smoke e2e com Playwright + unit dos services/utils)

## Login (demo)

- **Admin**: `admin@admin.com` / `admin`
- **Manager**: `manager@admin.com` / `admin`
- **Viewer**: `viewer@admin.com` / `admin`
