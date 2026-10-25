# 🔧 Hướng Dẫn Xử Lý Sự Cố (Troubleshooting & Runbook)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Sự Cố Phổ Biến & Hướng Dẫn Khắc Phục (Common Issues)

### Vấn Đề 1: `GEMINI_API_KEY is not defined. GeminiProvider will be marked unavailable.`
- **Nguyên nhân**: Tệp `.env` chưa khai báo biến `GEMINI_API_KEY` hoặc server chưa tải lại tệp môi trường.
- **Hậu quả**: Hệ thống tự động chuyển sang `MockAiProvider` để đảm bảo không sập ứng dụng (Graceful Degradation).
- **Cách xử lý**:
  1. Mở tệp `backend/.env` và thêm:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```
  2. Khởi động lại server NestJS.

---

### Vấn Đề 2: LLM API trả về lỗi `429 Too Many Requests`
- **Nguyên nhân**: Vượt quá hạn mức số lượt gọi API trong một phút (Rate Limit) của gói miễn phí Google Gemini.
- **Cách xử lý**:
  - Hệ thống tự động kích hoạt `OpenAiProvider` (nếu có cấu hình `OPENAI_API_KEY`).
  - Nâng cấp dự án trên Google Cloud Console sang gói Pay-As-You-Go hoặc tích hợp hàng đợi xử lý ngầm (BullMQ / Redis Queue) để điều tiết nhịp độ gửi request.

---

### Vấn Đề 3: Lỗi Tải Lên CV: `Invalid file type. Only PDF, DOCX, DOC, PNG, and JPEG files are allowed.`
- **Nguyên nhân**: Ứng viên tải lên tệp tin nén (`.zip`, `.rar`) hoặc file định dạng không an toàn (`.exe`, `.sh`).
- **Cách xử lý**: Đây là tính năng bảo vệ an toàn của Multer Filter. HR cần thông báo ứng viên xuất lại định dạng PDF hoặc DOCX chuẩn.

---

### Vấn Đề 4: Không Kết Nối Được Cơ Sở Dữ Liệu: `MongooseServerSelectionError`
- **Nguyên nhân**: Dịch vụ MongoDB local chưa khởi chạy hoặc chuỗi kết nối `MONGO_URI` sai địa chỉ/cổng mạng.
- **Cách xử lý**:
  - Kiểm tra dịch vụ MongoDB:
    ```bash
    # Windows
    net start MongoDB
    # Linux
    sudo systemctl status mongod
    ```
  - Kiểm tra kết nối MongoDB Compass tại `mongodb://localhost:27017`.
