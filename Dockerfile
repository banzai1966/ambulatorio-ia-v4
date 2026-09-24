# ==========================================
# AMBULATÓRIO IA - Dockerfile de Produção
# ==========================================

# Estágio 1: Build da Aplicação
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Instala certificados essenciais
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia dependências primeiro para cache do Docker
COPY package*.json ./
RUN npm install

# Copia todo o código fonte
COPY . .

# Compila o frontend Vite e o servidor backend Node
RUN npm run build

# Estágio 2: Runner de Produção (Leve e Seguro)
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia package.json e instala dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia o build final compilado do estágio anterior
COPY --from=builder /app/dist ./dist

# Expõe a porta 3000 do contêiner
EXPOSE 3000

# Inicia o servidor do Ambulatório IA
CMD ["npm", "start"]
