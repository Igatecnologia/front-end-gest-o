# IGA — Gestao e Analise de Dados

Aplicacao web **administrativa e de Business Intelligence** para visao executiva de indicadores, vendas, financeiro e relatorios. Arquitetura **frontend + backend proprio**, com integracao a APIs externas (SGBR BI) via proxy seguro.

---

## Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Frontend   │────>│   Backend    │────>│   API SGBR BI    │
│  React/Vite  │     │  Express.js  │     │  108.181.223.103  │
│  :5173       │     │  :3000       │     │  :3007           │
└──────────────┘     └──────────────┘     └──────────────────┘
```

- **Frontend** — React 19, Ant Design 6, Recharts, TypeScript
- **Backend** — Express.js, armazenamento em JSON (users, datasources), proxy para APIs externas
- **SGBR BI** — API do cliente que fornece dados de vendas (vendas/analitico)

O backend atua como **proxy seguro**: autentica na API do cliente com credenciais configuradas, cacheia o token e repassa os dados ao frontend sem expor credenciais no browser.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19, Vite 8, TypeScript, Ant Design 6, Recharts 3 |
| **Backend** | Node.js, Express 4, TypeScript, tsx (dev) |
| **Dados assincronos** | TanStack Query 5 |
| **HTTP** | Axios (frontend), fetch nativo (backend) |
| **Validacao** | Zod 4 (frontend valida todas as respostas da API) |
| **Autenticacao** | scrypt (hash de senhas), tokens aleatorios |
| **Datas** | Day.js com fuso America/Sao_Paulo |

---

## Pre-requisitos

- **Node.js** 20+ (recomendado LTS) — baixe em https://nodejs.org
- **npm** 10+ (vem junto com o Node.js)
- **Git** — baixe em https://git-scm.com

Para verificar se ja tem instalado, abra o terminal e digite:
```bash
node --version    # deve mostrar v20 ou superior
npm --version     # deve mostrar 10 ou superior
git --version     # deve mostrar qualquer versao
```

---

## Guia de instalacao passo a passo

### Passo 1 — Clonar os dois repositorios

Abra o terminal e escolha uma pasta para o projeto. Execute:

```bash
# Criar pasta do projeto
mkdir iga-gestao
cd iga-gestao

# Clonar o backend
git clone https://github.com/Igatecnologia/back-end-gest-o.git

# Clonar o frontend
git clone https://github.com/Igatecnologia/front-end-gest-o.git
```

Voce tera esta estrutura:
```
iga-gestao/
  back-end-gest-o/    ← backend (API)
  front-end-gest-o/   ← frontend (tela)
```

### Passo 2 — Instalar e iniciar o BACKEND (primeiro!)

```bash
cd back-end-gest-o
npm install
npm run dev
```

Deve aparecer:
```
[IGA Backend] Usuario admin criado: admin@iga.com / admin123
[IGA Backend] http://localhost:3000
```

**Deixe este terminal aberto.** O backend precisa ficar rodando.

Para confirmar que esta funcionando, abra outro terminal e execute:
```bash
curl http://localhost:3000/health
```
Deve retornar: `{"status":"ok",...}`

### Passo 3 — Instalar e iniciar o FRONTEND

Abra um **novo terminal** (sem fechar o do backend) e execute:

```bash
cd iga-gestao/front-end-gest-o
npm install
npm run dev
```

Deve aparecer:
```
  VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Passo 4 — Acessar o sistema

1. Abra o navegador em **http://localhost:5173**
2. Faca login com:

| Campo | Valor |
|-------|-------|
| Email | `admin@iga.com` |
| Senha | `admin123` |

### Passo 5 — Configurar a fonte de dados SGBR (primeira vez)

Apos o login, va em **Fontes de Dados** no menu e clique em **Nova conexao**:

| Campo | Valor |
|-------|-------|
| Nome | SGBR BI |
| Tipo | SGBR BI (IGA) |
| Autenticacao | Token de acesso |
| Endereco do servidor | `http://108.181.223.103:3007` |
| Caminho dos dados | `/sgbrbi/vendas/analitico` |
| Credenciais (token) | `iga:123456` |
| Login dos usuarios | Ativo |
| Caminho de login | `/sgbrbi/usuario/login` |
| Campo de usuario | `login` |
| Campo de senha | `senha` |
| Envio da senha | SHA-256 |

Clique em **Testar agora** — deve mostrar "1100 registros encontrados". Depois clique em **Salvar**.

Pronto! O dashboard ja vai carregar com os dados reais.

---

## Resumo rapido (para quem ja sabe)

```bash
# Terminal 1 — Backend
git clone https://github.com/Igatecnologia/back-end-gest-o.git
cd back-end-gest-o && npm install && npm run dev

# Terminal 2 — Frontend
git clone https://github.com/Igatecnologia/front-end-gest-o.git
cd front-end-gest-o && npm install && npm run dev

# Abrir http://localhost:5173 — login: admin@iga.com / admin123
```

---

## Variaveis de ambiente (frontend)

Copie `.env.example` para `.env`. O `.env` nao deve ser versionado.

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `VITE_API_BASE_URL` | URL do backend | `http://localhost:3000` |
| `VITE_USE_MOCKS` | Ativa MSW no browser (testes) | `false` |
| `VITE_APP_STAGE` | Badge no cabecalho (`homolog`, `dev`) | — |
| `VITE_BASE` | Base path do build (GitHub Pages) | `/` |

---

## Backend — Endpoints

### Autenticacao

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login local (email + senha) |
| POST | `/api/v1/auth/logout` | Encerrar sessao |

### Usuarios (CRUD)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/users` | Listar todos |
| POST | `/api/v1/users` | Criar usuario |
| PUT | `/api/v1/users/:id` | Atualizar usuario |
| DELETE | `/api/v1/users/:id` | Excluir usuario |

### Fontes de dados (CRUD)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/datasources` | Listar conexoes |
| POST | `/api/v1/datasources` | Criar conexao |
| PUT | `/api/v1/datasources/:id` | Atualizar conexao |
| DELETE | `/api/v1/datasources/:id` | Excluir conexao |
| POST | `/api/v1/datasources/:id/test` | Testar conexao salva |
| POST | `/api/v1/datasources/test` | Testar rascunho |

### Proxy (dados do cliente)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/proxy/login` | Login na API do cliente (SGBR) |
| GET | `/api/proxy/data` | Buscar dados de vendas (com auth automatica) |

O proxy faz login automatico na API SGBR, cacheia o token por 55 minutos e renova quando expira. O frontend nao precisa conhecer credenciais da API externa.

### Dados do sistema

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/dashboard` | Dados do dashboard (fallback) |
| GET | `/reports` | Relatorios paginados (fallback) |
| GET | `/audit` | Logs de auditoria |
| GET | `/finance` | Visao financeira |
| GET | `/finance/conciliacao` | Conciliacao |
| GET | `/finance/contas-pagar` | Contas a pagar |
| GET | `/finance/contas-receber` | Contas a receber |
| GET | `/finance/estoque-materia-prima` | Estoque materia-prima |
| GET | `/finance/estoque-espuma` | Estoque espuma |
| GET | `/finance/vendas-espuma` | Vendas espuma |
| GET | `/erp/compras-materia-prima` | Compras |
| GET | `/erp/lotes-producao` | Lotes de producao |
| GET | `/erp/fichas-tecnicas` | Fichas tecnicas |
| GET | `/erp/pedidos` | Pedidos |
| GET | `/erp/ordens-producao` | Ordens de producao |
| GET | `/erp/faturamentos` | Faturamentos |
| GET | `/erp/movimentos-estoque` | Movimentos de estoque |
| GET | `/erp/custo-real` | Custo real por produto |
| GET | `/erp/alertas` | Alertas operacionais |

> As rotas `/dashboard`, `/reports`, `/audit`, `/finance/*` e `/erp/*` retornam arrays vazios por padrao. Quando a fonte SGBR esta configurada, o frontend calcula dashboard, financeiro e relatorios a partir dos dados do proxy.

---

## Backend — Estrutura

```
back-end/
  src/
    server.ts              # Ponto de entrada, registra rotas
    storage.ts             # CRUD datasources (JSON em data/datasources.json)
    userStorage.ts         # CRUD usuarios (JSON em data/users.json, scrypt)
    seedAdmin.ts           # Cria admin padrao na primeira execucao
    routes/
      auth.ts              # POST /api/v1/auth/login e /logout
      users.ts             # CRUD /api/v1/users
      datasources.ts       # CRUD /api/v1/datasources + sanitizacao
      proxy.ts             # Proxy SGBR com auto-login e cache de token
      dashboard.ts         # GET /dashboard (fallback)
      reports.ts           # GET /reports (fallback)
      audit.ts             # GET /audit
      erp.ts               # GET /erp/* (9 endpoints)
      finance.ts           # GET /finance/* (7 endpoints)
    services/
      connectionTester.ts  # Testa conexao com API do cliente
      passwordHasher.ts    # SHA-256/MD5 para senhas SGBR
  data/
    datasources.json       # Fontes de dados (criado automaticamente)
    users.json             # Usuarios do sistema (criado automaticamente)
```

---

## Frontend — Rotas

| Rota | Pagina | Fonte de dados |
|------|--------|----------------|
| `/login` | Login | Local + SGBR (fallback) |
| `/dashboard` | Dashboard executivo | Proxy SGBR ou `/dashboard` |
| `/dashboard/analises` | Analises BI | Proxy SGBR |
| `/dashboard/dados` | Dados detalhados | Proxy SGBR |
| `/dashboard/vendas-analitico` | Vendas analitico | Proxy SGBR |
| `/financeiro` | Financeiro | Proxy SGBR ou `/finance` |
| `/relatorios` | Relatorios | Proxy SGBR ou `/reports` |
| `/usuarios` | Gestao de usuarios | `/api/v1/users` |
| `/auditoria` | Logs de auditoria | `/audit` |
| `/producao` | Producao | `/erp/*` |
| `/ficha-tecnica` | Fichas tecnicas | `/erp/fichas-tecnicas` |
| `/comercial` | Comercial | `/erp/*` |
| `/dashboard-operacional` | Dashboard operacional | `/erp/*` |
| `/alertas` | Alertas | `/erp/alertas` |
| `/fontes-de-dados` | Configuracao de conexoes | `/api/v1/datasources` |

---

## Frontend — Estrutura (`src`)

```
src/
  api/          # Axios, schemas Zod, erros HTTP, campos ERP
  auth/         # Contexto de sessao, storage, permissoes, throttle
  components/   # Componentes reutilizaveis (MetricCard, VirtualTable, etc.)
  hooks/        # Hooks customizados (debounce, heartbeat, saved views)
  i18n/         # Internacionalizacao (pt-BR padrao)
  layouts/      # Shell da aplicacao (sidebar, header, bottom nav mobile)
  monitoring/   # Monitoramento (placeholder)
  pages/        # Uma pagina por rota
  query/        # React Query client e chaves de cache
  routes/       # Definicao de rotas, guards de auth e permissao
  services/     # Chamadas HTTP (1 arquivo por dominio)
  tenant/       # Multi-tenant (storage isolado por tenant)
  theme/        # Tema claro/escuro (Ant Design ConfigProvider)
  types/        # Tipos de dominio (User, Pedido, Faturamento, etc.)
  utils/        # Agregacoes SGBR, datas, formatadores, exportacao
```

---

## Fluxo de autenticacao

1. Usuario digita email e senha no login
2. Frontend envia `POST /api/v1/auth/login` para o backend
3. Backend valida contra `data/users.json` (senha com scrypt)
4. Se 401, e houver fonte SGBR marcada como auth, tenta `POST /api/proxy/login` (fallback)
5. Token retornado e armazenado no localStorage
6. Axios interceptor adiciona `Authorization: Bearer {token}` em todas as requests

---

## Fluxo de dados (SGBR BI)

1. Admin configura a fonte de dados em `/fontes-de-dados`
2. Backend armazena config em `data/datasources.json`
3. Quando o frontend precisa de dados (dashboard, financeiro, relatorios):
   - Chama `GET /api/proxy/data?dt_de=YYYY.MM.DD&dt_ate=YYYY.MM.DD`
   - Backend faz login automatico na SGBR (credenciais configuradas)
   - Cacheia token SGBR por 55 minutos
   - Repassa dados ao frontend
4. Frontend valida com Zod e transforma em KPIs, graficos e tabelas

---

## Credenciais

### Sistema (login local)

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | `admin@iga.com` | `admin123` |

Novos usuarios podem ser criados na pagina `/usuarios`.

### API SGBR BI (configurado na fonte de dados)

| Campo | Valor |
|-------|-------|
| Servidor | `http://108.181.223.103:3007` |
| Login endpoint | `/sgbrbi/usuario/login` |
| Data endpoint | `/sgbrbi/vendas/analitico` |
| Campo usuario | `login` |
| Campo senha | `senha` |
| Modo senha | SHA-256 |

---

## Scripts NPM

### Frontend

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desenvolvimento (Vite, :5173) |
| `npm run build` | Type-check + build de producao |
| `npm run preview` | Servir `dist` localmente |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test:unit` | Vitest |
| `npm run test:e2e` | Playwright |

### Backend

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor com hot-reload (tsx watch, :3000) |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Iniciar build compilado |

---

## Deploy

### Desenvolvimento

```bash
# Terminal 1 — Backend
cd back-end && npm run dev

# Terminal 2 — Frontend
cd front-end-gest-o && npm run dev
```

### Producao

1. Configure `VITE_API_BASE_URL` com a URL do backend em producao
2. `npm run build` no frontend
3. Sirva a pasta `dist` com qualquer servidor estatico (Nginx, Vercel, etc.)
4. Backend: `npm run build && npm start` ou use PM2/Docker

---

## Licenca e privacidade

Projeto **privado** (repositorio da organizacao). Nao exponha URLs internas, tokens ou `.env` em issues ou commits.
