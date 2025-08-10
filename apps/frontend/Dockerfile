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
