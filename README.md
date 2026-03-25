# IGA — Gestão e Análise de Dados

Aplicação web **administrativa e de Business Intelligence** para visão executiva de indicadores, vendas, financeiro e relatórios. Construída em **React**, com interface **Ant Design**, gráficos **Recharts** e camada de dados tipada (**TypeScript** + **Zod**).

---

## Capacidades

- **Dashboard** com KPIs, gráficos temporais e tabela de lançamentos recentes.
- **Análises BI** com visualizações avançadas e textos explicativos por bloco.
- **Vendas analítico** com listagem da API, filtros, totais e **detalhe por linha**.
- **Financeiro** e **relatórios** (modo integrado: agregações a partir da mesma base analítica, quando configurado).
- **Autenticação**, **perfis com permissões** (RBAC no front), **tema claro/escuro** e layout responsivo (sidebar + drawer em mobile).
- **Exportação** (CSV, XLSX, PDF, imagens) na área de relatórios; agendamentos **simulados** (armazenamento local).

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Runtime | React 19, Vite 8, TypeScript |
| UI | Ant Design 6, ícones Ant Design |
| Rotas | React Router 7 |
| Dados assíncronos | TanStack Query 5 |
| HTTP | Axios (clientes com JWT onde aplicável) |
| Validação de contratos | Zod 4 |
| Gráficos | Recharts 3 |
| Datas | Day.js (incl. fuso `America/Sao_Paulo` onde aplicável) |
| Testes | Vitest, Playwright |
| Mock opcional | MSW 2 |

---

## Pré-requisitos

- **Node.js** 20+ (recomendado LTS)
- **npm** 10+

---

## Instalação e execução local

```bash
git clone https://github.com/Igatecnologia/front-end-gest-o.git
cd front-end-gest-o
npm install
cp .env.example .env
# Edite .env conforme o ambiente (ver secção seguinte)
npm run dev
```

Abra **http://localhost:5173**.

---

## Variáveis de ambiente

Copie **`.env.example`** para **`.env`**. O ficheiro **`.env`** não deve ser versionado (já está no `.gitignore`).

| Variável | Descrição |
|----------|-----------|
| `VITE_API_BASE_URL` | URL da API REST genérica (dashboard, usuários, etc.) quando **não** se usa só o fluxo SGBR. |
| `VITE_USE_MOCKS` | `true` ativa **MSW** no browser (útil para e2e/testes). Padrão: `false`. |
| `VITE_SGBR_BI_BASE_URL` | Base do SGBR BI. Em desenvolvimento use **`proxy`** para o Vite encaminhar `/sgbrbi` e evitar CORS. Em produção use URL absoluta com CORS permitido. |
| `VITE_SGBR_BI_PROXY_TARGET` | Alvo do proxy (só dev), ex.: `http://servidor:porta`. |
| `VITE_AUTH_BACKEND` | `mock` força login demo; `sgbrbi` usa `POST /sgbrbi/usuario/login` quando SGBR está ativo. |
| `VITE_APP_STAGE` | Opcional: `homolog` exibe badge no cabeçalho. |
| `VITE_BASE` | Base path do build (ex.: subpasta em GitHub Pages). |

Detalhes adicionais estão comentados em **`.env.example`**.

---

## Integração SGBR BI

Com **`VITE_SGBR_BI_BASE_URL`** definido (URL ou `proxy` em dev):

- **Login**: `POST /sgbrbi/usuario/login` (senha enviada como SHA-256, conforme API).
- **Dados analíticos**: `GET /sgbrbi/vendas/analitico` com `dt_de` / `dt_ate` e **Bearer token**.

**Dashboard**, **financeiro** e **relatórios** passam a ser **calculados no cliente** a partir das linhas devolvidas por `vendas/analitico` (não são endpoints separados). A página **Vendas analítico** apresenta a resposta próxima do bruto da API.

**Usuários** e **auditoria** não são expostos por esta API no projeto atual; o menu de administração é ocultado nesse modo.

---

## Scripts NPM

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desenvolvimento Vite. |
| `npm run build` | Type-check + build de produção. |
| `npm run preview` | Servir a pasta `dist` localmente. |
| `npm run build:e2e` | Build no modo e2e. |
| `npm run build:gh-pages` | Build com fallback SPA para GitHub Pages (defina `VITE_BASE` se necessário). |
| `npm run lint` | ESLint. |
| `npm run format` | Prettier. |
| `npm run test:unit` | Vitest (CI). |
| `npm run test:e2e` | Playwright. |
| `npm run test:all` | Unitários + e2e. |

---

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/login` | Entrada (demo ou SGBR). |
| `/dashboard` | Visão geral. |
| `/dashboard/analises` | BI e gráficos. |
| `/dashboard/dados` | Tabela de dados detalhados. |
| `/dashboard/vendas-analitico` | Listagem analítica + detalhe. |
| `/financeiro` | Visão financeira (derivada conforme backend). |
| `/relatorios` | Relatórios, filtros e exportações. |
| `/usuarios` | CRUD (modo API genérica / mock). |
| `/auditoria` | Logs (modo API genérica / mock). |

---

## Estrutura do repositório (`src`)

- **`api/`** — variáveis de ambiente, Axios autenticado, erros HTTP, schemas Zod.
- **`auth/`** — contexto de sessão, armazenamento, permissões.
- **`layouts/`** — shell da aplicação (sidebar, header, conteúdo).
- **`routes/`** — definição de rotas e proteção por autenticação/permissão.
- **`pages/`** — ecrãs por rota.
- **`services/`** — chamadas HTTP e regras de obtenção de dados.
- **`query/`** — cliente React Query e chaves de cache.
- **`components/`** — componentes reutilizáveis.
- **`utils/`** — agregações SGBR, datas, helpers.
- **`mocks/`** — MSW e dados de demonstração (quando aplicável).

Documentação operacional para agentes e contribuidores: **`AGENTS.md`**.

---

## Testes e qualidade

- **Unitários**: serviços e utilitários críticos (`npm run test:unit`).
- **E2E**: fluxos de autenticação, RBAC e relatórios (`npm run test:e2e`); configure ambiente conforme `playwright.config.ts` e `.env` de teste quando existir.

---

## Deploy

- **Vercel / Netlify**: SPA padrão; ajuste variáveis de ambiente no painel (sem commitar segredos).
- **GitHub Pages**: workflow em `.github/workflows/`; configure **Pages → GitHub Actions**. Em subpasta, defina **`VITE_BASE`** coerente com o nome do repositório. Build local (PowerShell):

```powershell
$env:VITE_BASE="/front-end-gest-o/"
npm run build:gh-pages
```

Consulte também **`DEPLOY_CHECKLIST.md`**.

---

## Credenciais demo (modo mock)

Quando **`VITE_AUTH_BACKEND=mock`** (ou SGBR desativado com backend mock):

| Perfil | E-mail | Senha |
|--------|--------|------|
| Admin | `admin@admin.com` | `admin` |
| Manager | `manager@admin.com` | `admin` |
| Viewer | `viewer@admin.com` | `admin` |

Com **SGBR ativo**, use utilizador e senha fornecidos pelo ambiente integrado.

---

## Documentação complementar

- **`ARCHITECTURE.md`** — visão de arquitetura.
- **`SPRINTS_CHECKLIST.md`** — histórico e itens de sprint.
- **`DEPLOY_CHECKLIST.md`** — verificação antes de publicar.

---

## Licença e privacidade

Projeto **privado** (repositório da organização). Não exponha URLs internas, tokens ou `.env` em issues ou commits.
