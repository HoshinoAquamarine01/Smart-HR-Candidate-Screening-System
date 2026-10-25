# 🏗 Kiến Trúc Hệ Thống Tổng Thể (High-Level Architecture)

> **Dự án**: Smart HR & Candidate Screening System  
> **Kiểu kiến trúc**: Modular Monolith hướng Service & Clean Architecture (NestJS)

---

## 1. Sơ Đồ Khối C4 - Container Level Diagram

```mermaid
C4Container
    title Container Diagram for Smart HR Candidate Screening System

    Person(recruiter, "Nhà Tuyển Dụng / HR", "Người tải lên CV, tạo JD và xem kết quả chấm điểm")
    Person(techlead, "Tech Lead / Phỏng vấn viên", "Người sử dụng bộ câu hỏi phỏng vấn và đề test")

    Container(spa, "Single Page App", "React 19, TypeScript, Vite", "Cung cấp giao diện dashboard và công cụ tương tác")
    
    Container_Boundary(backend_api, "NestJS Backend API") {
        Component(gateway, "API Gateway / Routing", "NestJS Guards & Interceptors", "Định tuyến, xác thực JWT và kiểm tra định dạng dữ liệu")
        Component(cv_service, "CV & Document Service", "CvService, Multer", "Quản lý tệp tải lên và điều phối trích xuất")
        Component(ocr_service, "OCR Strategy Service", "PdfParse, Mammoth, Tesseract", "Bóc tách văn bản thô theo loại tệp tin")
        Component(ai_service, "AI LLM Service", "GeminiProvider, OpenAiProvider", "Bóc tách JSON có cấu trúc và dự phòng thông minh")
        Component(screening_service, "Screening Service", "ScoringEngine", "Tính toán mức độ phù hợp và phân tích khoảng cách kỹ năng")
        Component(interview_service, "Interview & Assessment", "PromptGenerators", "Tạo câu hỏi phỏng vấn thích ứng và đề test")
    }

    ContainerDb(mongodb, "Primary Database", "MongoDB", "Lưu trữ tài khoản, ứng viên, CVs, JDs, lịch sử phỏng vấn")
    ContainerDb(filestore, "File Storage", "Local Disk / MinIO S3", "Lưu trữ tệp gốc PDF, DOCX của ứng viên")

    System_Ext(gemini_api, "Google Gemini API", "Gemini 2.0 Flash LLM bóc tách văn bản chính")
    System_Ext(openai_api, "OpenAI API", "GPT-4o-mini LLM dự phòng Structured Outputs")

    Rel(recruiter, spa, "Sử dụng qua trình duyệt", "HTTPS")
    Rel(techlead, spa, "Sử dụng qua trình duyệt", "HTTPS")
    Rel(spa, gateway, "Gửi API Requests", "JSON / HTTPS / Multipart")

    Rel(gateway, cv_service, "Gọi", "Internal Call")
    Rel(cv_service, ocr_service, "Yêu cầu bóc tách text thô", "Internal Call")
    Rel(cv_service, ai_service, "Yêu cầu bóc tách cấu trúc", "Internal Call")
    Rel(ai_service, gemini_api, "Gửi văn bản phân tích", "HTTPS REST")
    Rel(ai_service, openai_api, "Gọi dự phòng khi Gemini lỗi", "HTTPS REST")
    Rel(cv_service, mongodb, "Ghi bản ghi CV & Candidate", "Mongoose ODM")
    Rel(cv_service, filestore, "Lưu tệp tin", "File I/O / S3")
```

---

## 2. Nguyên Tắc Thiết Kế (Architectural Principles)

1. **Phân Tách Trách Nhiệm (Separation of Concerns)**:
   - Module `OcrModule` chỉ chuyên trách trích xuất văn bản thô và siêu dữ liệu kỹ thuật của tệp.
   - Module `AiModule` chuyên trách giao tiếp với các nhà cung cấp LLM, ép kiểu schema và dự phòng lỗi.
   - Module `CvModule` điều phối quy trình tải lên, liên kết dữ liệu giữa CSDL và tệp tin.
2. **Strategy Pattern trong Xử Lý Tệp**: Tự động áp dụng chiến lược phù hợp (`PdfExtractorStrategy`, `DocxExtractorStrategy`, `ImageOcrStrategy`) dựa vào định dạng MIME type của tệp tin.
3. **Mô Hình Đa Nhà Cung Cấp LLM (Multi-Provider with Graceful Fallback)**:
   - Thứ tự ưu tiên: Google Gemini 2.0 Flash $\rightarrow$ OpenAI GPT-4o-mini $\rightarrow$ Mock Local Provider.
   - Tránh hiện tượng Single Point of Failure (SPOF) khi dịch vụ của một nhà cung cấp gặp trục trặc mạng hoặc vượt hạn ngạch.
