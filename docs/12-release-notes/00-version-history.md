# 🏷 Nhật Ký Phiên Bản (Version History & Changelog)

> **Dự án**: Smart HR & Candidate Screening System  
> **Quy ước đánh số**: Semantic Versioning (`MAJOR.MINOR.PATCH`)

---

## [v0.5.0] - 2026-11-10 (Hiện tại)
### 🚀 Tính Năng Mới
- **Module Khởi Tạo Câu Hỏi Phỏng Vấn RAG (`InterviewsModule`)**:
  - Tích hợp kiến trúc RAG 3 nguồn: Dữ liệu dự án từ CV, yêu cầu tiêu chuẩn từ Job Description, và Ngân hàng câu hỏi chuyên môn (**Domain Question Bank**).
  - Tự động phân loại 4 nhóm câu hỏi chuẩn nghiệp vụ: `CLARIFICATION`, `TECHNICAL_DEEP_DIVE`, `SKILL_GAP`, `BEHAVIORAL_STAR`.
  - Cung cấp tiêu chí đánh giá mấu chốt (`expectedKeyPoints`) và bareme chấm điểm 3 mức (`sampleRubric`: *1-2đ Chưa đạt*, *3-4đ Đạt*, *5đ Xuất sắc*).
  - Trích xuất dẫn chứng cụ thể từ CV (`contextFromCV`) gán vào từng câu hỏi để triệt tiêu ảo giác (hallucination).
- **Cơ Chế Caching Thông Minh**: Tự động cache kết quả đã sinh trong MongoDB collection `interview_questions`, hỗ trợ cờ `regenerate: true` để tạo lại khi cần.
- **Tương Tác Human-In-The-Loop & Xuất Phiếu Phỏng Vấn**:
  - API `PUT /api/v1/interviews/:id` hỗ trợ Recruiter chỉnh sửa câu hỏi, cập nhật trạng thái `REVIEWED`, ghi chú nhận xét và chấm điểm thực tế `scoreGiven` (1–5).
  - API `POST /api/v1/interviews/:id/export` xuất phiếu phỏng vấn chuẩn hóa sang định dạng Markdown, Plain Text hoặc JSON.
- **Bộ Kiểm Thử Tự Động**: Bổ sung `npm run test:interview` đạt **34/34 PASS (100%)**.

---

## [v0.4.0] - 2026-11-08
### 🚀 Tính Năng Mới
- **Động Cơ So Khớp & Chấm Điểm Ứng Viên (`ScreeningModule`)**:
  - Phát triển **Matching Engine** đa tiêu chí kết hợp giữa So khớp ngữ nghĩa (Semantic Vector Matching qua Cosine Similarity) và So khớp kỹ năng định lượng (Skill-based Matching).
  - **4-Tier Skill Taxonomy & Normalization**: Nhận diện Khớp hoàn toàn (Exact), Khớp từ đồng nghĩa (Alias), Khớp mờ sai chính tả (Levenshtein Fuzzy $\ge 0.80$), Khớp họ hàng liên đới (Related Taxonomy), và Vector Semantic Matching cho kỹ năng mới ngoài từ điển.
  - **Mô Hình Tính Điểm Trọng Số (Weighted Scoring)**: Tổng hợp điểm từ 4 trụ cột: $S_{\text{semantic}}, S_{\text{skill}}, S_{\text{exp}}, S_{\text{edu}}$.
  - **Hard Gate Constraint**: Tự động áp dụng mức phạt -20% nếu ứng viên thiếu $>50\%$ kỹ năng bắt buộc.
  - **Khung Đo Lường Hiệu Năng Thuật Toán**: Đánh giá thứ tự xếp hạng ứng viên bằng **Precision@K**, **Recall@K**, và **NDCG@K**.
  - **Bộ Kiểm Thử Tự Động**: Bổ sung `npm run test:matching` đạt **28/28 PASS (100%)**.

---

## [v0.3.0] - 2026-10-25
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
