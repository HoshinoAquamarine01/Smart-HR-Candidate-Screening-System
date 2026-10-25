# ⚙️ Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Hiệu Năng & Độ Trễ (Performance & Latency)

| Mã Yêu Cầu | Tiêu Chí Đánh Giá | Chỉ Số Mục Tiêu (SLA) | Phương Án Kỹ Thuật Đạt Mục Tiêu |
| :--- | :--- | :--- | :--- |
| **NFR-PERF-01** | Thời gian phản hồi API OCR | $< 1.0\text{ giây}$ (PDF/DOCX) | Sử dụng thư viện Node.js tối ưu (`pdf-parse`, `mammoth`) chạy trực tiếp trên bộ nhớ Buffer. |
| **NFR-PERF-02** | Thời gian bóc tách ngữ nghĩa LLM | $< 2.5\text{ giây}$ / CV | Ưu tiên Google Gemini 2.0 Flash với độ trễ thấp và streaming response token. |
| **NFR-PERF-03** | Thời gian tải tệp CV từ Server | $< 300\text{ ms}$ | Sử dụng Node.js `StreamableFile` kết hợp với caching HTTP headers (`ETag`, `Cache-Control`). |
| **NFR-PERF-04** | Khả năng phục vụ đồng thời | Tối thiểu 100 requests/giây | Kiến trúc bất đồng bộ (Non-blocking I/O) của NestJS và Express event loop. |

---

## 2. Tính Sẵn Sàng & Mở Rộng (Availability & Scalability)

- **NFR-AVAIL-01**: Tỷ lệ sẵn sàng của hệ thống đạt tối thiểu **99.9%** (Uptime).
- **NFR-AVAIL-02 (Graceful Degradation)**: Khi LLM bên ngoài bị gián đoạn hoặc quá hạn ngạch (Rate Limit 429), hệ thống tự động kích hoạt Provider dự phòng hoặc Mock Service, tuyệt đối không trả về mã lỗi 500 làm sập giao diện người dùng.
- **NFR-SCALE-01 (Stateless Architecture)**: Backend NestJS được thiết kế hoàn toàn Stateless, cho phép mở rộng quy mô ngang (Horizontal Scaling) qua nhiều container Docker đằng sau Nginx Load Balancer mà không phụ thuộc vào bộ nhớ phiên (Session).

---

## 3. Độ Chính Xác & Toàn Vẹn Dữ Liệu (Accuracy & Integrity)

- **NFR-ACC-01**: Tỷ lệ tuân thủ cấu trúc JSON Schema đạt **100%** (Zero JSON Syntax Error) nhờ sử dụng Zod Schema và Gemini `responseSchema`.
- **NFR-ACC-02**: Độ chính xác trích xuất số điện thoại và email đạt trên **98%** thông qua bộ lọc Regular Expression kết hợp với kiểm chứng ngữ cảnh LLM.
- **NFR-ACC-03**: Hệ thống có khả năng lọc bỏ nhiễu và xử lý an toàn các văn bản CV có bố cục đa cột bị đảo dòng trật tự.

---

## 4. Bảo Mật & Tuân Thủ (Security & Compliance)

- **NFR-SEC-01**: Toàn bộ lưu lượng truy cập qua giao thức mạng phải được mã hóa qua HTTPS/TLS 1.3.
- **NFR-SEC-02**: Mật khẩu người dùng được băm một chiều bằng `bcrypt` với cost factor $\ge 10$.
- **NFR-SEC-03**: Khóa bí mật API (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `JWT_SECRET`) phải được nạp qua biến môi trường an toàn, không được hardcode vào mã nguồn.
