# ==============================================================================
# FILE: README.md
# (Tạo file này ở thư mục gốc của dự án: dr-drill-app/README.md)
# ==============================================================================

# DR Drill Management Platform

Dự án này bao gồm một nền tảng hoàn chỉnh để quản lý và thực thi các đợt diễn tập khôi phục sau thảm họa (DR Drill).

## Yêu cầu

- Docker & Docker Compose
- Node.js >= 18
- pnpm

## Cấu trúc Monorepo

- `apps/backend`: Ứng dụng NestJS API
- `apps/frontend`: Ứng dụng Next.js UI
- `infra/`: Chứa file `docker-compose.yml` và các cấu hình hạ tầng khác.
- `packages/`: Chứa các gói chia sẻ (ví dụ: `tsconfig`, `eslint-config`).

## Khởi chạy Môi trường Phát triển

1.  **Tạo cấu trúc thư mục và file:**
    Tạo các thư mục và file như được chỉ định trong khối mã nguồn này.

2.  **Cài đặt dependencies:**
    ```bash
    pnpm install
    ```

3.  **Tạo file môi trường:**
    Sao chép file `.env.example` thành `.env`.
    ```bash
    cp .env.example .env
    ```

4.  **Khởi chạy toàn bộ stack với Docker Compose:**
    ```bash
    docker-compose -f infra/docker-compose.yml up --build
    ```

    - **Frontend** sẽ chạy tại: `http://localhost:3000`
    - **Backend API** sẽ chạy tại: `http://localhost:3001`
    - **Swagger API Docs** sẽ có tại: `http://localhost:3001/api`
    - **MinIO Console** (để xem file) sẽ có tại: `http://localhost:9001`

