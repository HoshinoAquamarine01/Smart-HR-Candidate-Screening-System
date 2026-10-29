# 🏷 Nhật Ký Phiên Bản (Version History & Changelog)

> **Dự án**: Smart HR & Candidate Screening System  
> **Quy ước đánh số**: Semantic Versioning (`MAJOR.MINOR.PATCH`)

---

## [v0.3.0] - 2026-10-25 (Hiện tại)
### 🚀 Tính Năng Mới
- **Tích Hợp LLM Semantic Extraction**: Bổ sung `AiModule` tích hợp chính thức Google Gemini 2.0 Flash (`@google/genai`) và OpenAI GPT-4o-mini (`openai`).
- **Ép Chuẩn JSON Schema Tuyệt Đối**: Áp dụng Gemini `responseSchema` và Zod Schema để đảm bảo 100% kết quả trả về đúng `StandardCvProfile`.
- **Tự Động Đồng Bộ Ứng Viên**: Tự động trích xuất họ tên thật, email, số điện thoại, tóm tắt và đồng bộ sang collection `candidates` (thay vì lấy tên tệp tin).
- **Khử Trùng Lặp Ứng Viên (Deduplication)**: Kiểm tra email đã có trước khi tạo hồ sơ mới.
- **Endpoint Re-extract CV**: Thêm API `POST /api/v1/cv/:id/extract` cho phép kích hoạt lại bóc tách thông tin bất cứ lúc nào.
- **Kịch Bản Kiểm Thử Tự Động**: Thêm `npm run test:llm-extract` với 6 ca kiểm thử bao quát toàn bộ các kịch bản.

---

## [v0.2.0] - 2026-10-18
### 🚀 Tính Năng Mới
- **Module OCR Đa Chiến Lược (`OcrModule`)**: Áp dụng Strategy Pattern xử lý tệp PDF Native (`pdf-parse`), Word (`mammoth`), và ảnh quét (`tesseract.js`).
- **Làm Sạch Văn Bản (`TextSanitizerUtil`)**: Khử BOM, chuẩn hóa khoảng cách và phát hiện tệp tài liệu scanned.
- **Bộ Kiểm Thử OCR**: Bổ sung `npm run test:ocr` đạt 9/9 passed.

---

## [v0.1.0] - 2026-10-10
### 🚀 Khởi Tạo Dự Án (Foundation MVP)
- Khởi tạo kiến trúc NestJS Backend với kết nối cơ sở dữ liệu MongoDB (Mongoose ODM).
- Xây dựng `AuthModule`: Đăng ký, đăng nhập tài khoản Recruiter, mã hóa mật khẩu `bcrypt` và cấp phát JWT token.
- Xây dựng `CvModule`: Tải lên tệp tin qua Multer với bộ lọc bảo mật định dạng tệp và giới hạn dung lượng 5MB.
- Endpoint tải xuống và xem trực tuyến tệp CV (`GET /api/v1/cv/:id/file`).
