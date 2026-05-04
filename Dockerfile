# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências e compilar
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src

RUN npm ci
RUN npm run build

# Stage 2: Runtime
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
