# 💻 Hướng Dẫn Cài Đặt Môi Trường Phát Triển (Development Setup Guide)

> **Dự án**: Smart HR & Candidate Screening System  
> **Hệ điều hành hỗ trợ**: Windows 10/11, macOS, Linux (Ubuntu/Debian)

---

## 1. Yêu Cầu Tiên Quyết (Prerequisites)

- **Node.js**: Phiên bản LTS $\ge 20.x$ hoặc $22.x$
- **Trình quản lý gói**: `npm` ($\ge 10.x$) hoặc `pnpm` / `yarn`
- **Cơ sở dữ liệu**: MongoDB Community Server ($\ge 7.0$) hoặc tài khoản MongoDB Atlas Cloud
- **Docker & Docker Compose** (Tùy chọn nếu chạy container)
- **API Keys**:
  - Google Gemini API Key (Lấy miễn phí hoặc trả phí từ [Google AI Studio](https://aistudio.google.com/))
  - OpenAI API Key (Tùy chọn dự phòng)

---

## 2. Các Bước Cài Đặt Chi Tiết

### Bước 1: Clone kho mã nguồn
```bash
git clone https://github.com/your-org/Smart-HR-Candidate-Screening-System.git
cd Smart-HR-Candidate-Screening-System
```

### Bước 2: Cài đặt và cấu hình Backend (NestJS)
```bash
cd backend
npm install
```

Tạo tệp `.env` tại thư mục `backend/.env`:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/SMART-HR
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRATION=7d

# Cấu hình AI Engine
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
GEMINI_MODEL=gemini-2.0-flash
OPENAI_API_KEY=sk-proj-YourOpenAiApiKeyHere

# Cấu hình MinIO / S3 (nếu dùng Object Storage ngoài)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=smart-hr-cvs
```

### Bước 3: Khởi chạy Backend ở chế độ phát triển
```bash
npm run start:dev
```
Hệ thống sẽ lắng nghe tại: `http://localhost:3000`

### Bước 4: Cài đặt và cấu hình Frontend (React 19 + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
Giao diện Web sẽ hoạt động tại: `http://localhost:5173`

---

## 3. Các Lệnh Kiểm Thử Nhanh (Sanity Check)

Tại thư mục `backend/`:
```bash
# Kiểm thử chức năng Auth
npm run test:auth

# Kiểm thử chức năng CV upload
npm run test:cv

# Kiểm thử bộ trích xuất OCR (PDF, DOCX, Ảnh)
npm run test:ocr

# Kiểm thử bóc tách cấu trúc bằng AI (Gemini / Fallback)
npm run test:llm-extract
```
