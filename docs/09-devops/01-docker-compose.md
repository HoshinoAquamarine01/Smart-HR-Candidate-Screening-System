# 🐳 Container Hóa Với Docker Compose (Docker & Deployment)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Cấu Trúc Docker Compose Cho Toàn Bộ Hệ Thống

Tệp cấu hình `docker-compose.yml` triển khai trọn bộ 4 dịch vụ:
- **`backend`**: Ứng dụng NestJS API Server (Port 3000)
- **`frontend`**: Ứng dụng React 19 chạy trên Nginx (Port 80)
- **`mongodb`**: Cơ sở dữ liệu chính MongoDB (Port 27017)
- **`minio`**: Máy chủ lưu trữ tệp tin tương thích AWS S3 (Port 9000, 9001)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: smart_hr_mongodb
    restart: always
    environment:
      MONGO_INITDB_DATABASE: SMART-HR
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db
    networks:
      - smart_hr_network

  minio:
    image: minio/minio:RELEASE.2024-01-16T16-07-38Z
    container_name: smart_hr_minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadminpassword
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data
    networks:
      - smart_hr_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart_hr_backend
    restart: always
    depends_on:
      - mongodb
      - minio
    environment:
      PORT: 3000
      MONGO_URI: mongodb://mongodb:27017/SMART-HR
      JWT_SECRET: production_jwt_secret_must_be_very_long_and_secure
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - '3000:3000'
    volumes:
      - cv_uploads:/app/uploads/cvs
    networks:
      - smart_hr_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: smart_hr_frontend
    restart: always
    depends_on:
      - backend
    ports:
      - '80:80'
    networks:
      - smart_hr_network

volumes:
  mongo_data:
  minio_data:
  cv_uploads:

networks:
  smart_hr_network:
    driver: bridge
```

---

## 2. Dockerfile Cho Backend NestJS (`backend/Dockerfile`)

```dockerfile
# Giai đoạn 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Giai đoạn 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads/cvs

EXPOSE 3000
CMD ["node", "dist/main"]
```

---

## 3. Lệnh Vận Hành Nhanh

```bash
# Khởi động toàn bộ cụm dịch vụ
docker-compose up -d --build

# Xem log thời gian thực của Backend
docker-compose logs -f backend

# Tắt và giải phóng tài nguyên
docker-compose down
```
