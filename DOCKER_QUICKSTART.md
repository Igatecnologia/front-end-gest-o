# Quick Start Docker - Frontend IGA Gestão

## 1. Construir a imagem

```bash
cd front-end-gest-o
docker build -t iga-gestao-frontend:latest .
```

## 2. Executar o container

```bash
docker run --rm -p 80:80 iga-gestao-frontend:latest
```

Acesse `http://localhost` no navegador.

## 3. Usar Docker Compose

```bash
cd front-end-gest-o
docker compose up --build -d
```

## 4. Verificar Logs

```bash
docker compose logs -f frontend
```

## 5. Parar o container

```bash
docker compose down
```

## Observação

- Se a porta `80` já estiver em uso, altere o mapeamento:

```bash
docker run --rm -p 8080:80 iga-gestao-frontend:latest
```

- O build final é servido via Nginx com fallback de SPA.
