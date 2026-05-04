# Docker - Frontend IGA Gestão

Este documento descreve como construir e executar o frontend React/Vite usando Docker.

## Requisitos

- Docker v20.10+
- Docker Compose v2+

## Estrutura dos arquivos

- `Dockerfile` — build com Node.js e runtime com Nginx
- `.dockerignore` — exclui arquivos desnecessários
- `docker-compose.yml` — serviço frontend para desenvolvimento/implantação simples
- `nginx.conf` — configuração de SPA para servir `index.html`

## Construir a imagem

```bash
cd front-end-gest-o
docker build -t iga-gestao-frontend:latest .
```

## Executar o container

```bash
docker run --rm -p 80:80 iga-gestao-frontend:latest
```

A aplicação ficará disponível em `http://localhost`.

## Usar Docker Compose

```bash
cd front-end-gest-o
docker compose up --build -d
```

Ver logs:

```bash
docker compose logs -f frontend
```

Parar:

```bash
docker compose down
```

## Variáveis de ambiente

O build do frontend não exige variáveis obrigatórias pelo Dockerfile, mas o Vite pode usar prefixed env vars:

- `VITE_BASE` — base path do deploy
- `VITE_API_URL` — URL do backend quando usado em runtime
- `VITE_SGBR_BI_PROXY_TARGET` — proxy local em desenvolvimento

Para usar variáveis no container, passe com `-e` ou `env_file`.

## Servir build em produção

A imagem final usa Nginx e CDN-friendly cache para assets estáticos.

Se precisar alterar o caminho base do app, defina `VITE_BASE` antes do build.

## Troubleshooting

### 1) O app não carrega e mostra 404

- Verifique se o build foi gerado em `dist`
- Verifique se `nginx.conf` está configurado com `try_files $uri $uri/ /index.html;`
- Confirme a porta exposta: `docker run -p 80:80 ...`

### 2) CORS ou API não responde

- O frontend via Docker serve apenas estático
- A API deve estar em outro container ou serviço acessível
- Use `VITE_API_URL` para apontar ao backend correto

### 3) Build falha por falta de arquivos

- Verifique se `src/`, `public/`, `package.json` e `vite.config.ts` foram copiados corretamente
- Se você adicionou novos arquivos de configuração, atualize o Dockerfile

## Comandos úteis

```bash
# Reconstruir sem cache
docker build --no-cache -t iga-gestao-frontend:latest .

# Ver imagens
docker images iga-gestao-frontend

# Ver logs
docker logs -f iga-gestao-frontend
```
