# ==============================================================================
# FILE: apps/backend/Dockerfile
# (Tạo file này trong thư mục backend: dr-drill-app/apps/backend/Dockerfile)
# ==============================================================================

FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy only backend package.json to leverage Docker cache
COPY apps/backend/package.json ./apps/backend/

RUN npm install -g pnpm
RUN pnpm install --filter @dr-drill/backend... --prod

COPY . .

WORKDIR /usr/src/app/apps/backend

CMD ["pnpm", "start:dev"]

---
# ==============================================================================
# FILE: apps/frontend/Dockerfile
# (Tạo file này trong thư mục frontend: dr-drill-app/apps/frontend/Dockerfile)
# ==============================================================================

FROM node:20-alpine AS base

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy only frontend package.json to leverage Docker cache
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --filter @dr-drill/frontend...

COPY . .

WORKDIR /app/apps/frontend

EXPOSE 3000

CMD ["pnpm", "dev"]
