# 📋 Danh Mục Ca Kiểm Thử Chi Tiết (Test Cases Specifications)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Bộ Kiểm Thử Xác Thực: `npm run test:auth` (7/7 Passed)

| Test ID | Mục Tiêu Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Đăng ký tài khoản hợp lệ | Email mới + Mật khẩu $\ge 6$ ký tự | Trả về User Object và Access Token (201) | ✅ PASS |
| **TC-AUTH-02** | Đăng ký trùng Email | Email đã tồn tại trong CSDL | Ném lỗi `ConflictException` (HTTP 409) | ✅ PASS |
| **TC-AUTH-03** | Đăng nhập đúng thông tin | Email & Password khớp | Trả về Access Token hợp lệ (200) | ✅ PASS |
| **TC-AUTH-04** | Đăng nhập sai mật khẩu | Email đúng, Password sai | Ném lỗi `UnauthorizedException` (HTTP 401) | ✅ PASS |
| **TC-AUTH-05** | Đăng nhập sai Email | Email chưa từng đăng ký | Ném lỗi `UnauthorizedException` (HTTP 401) | ✅ PASS |
| **TC-AUTH-06** | Giải mã Token hợp lệ | JWT hợp lệ trong Header | Trả về thông tin User hiện tại | ✅ PASS |
| **TC-AUTH-07** | Giải mã Token không tồn tại | Token rác / Giả mạo | Ném lỗi `UnauthorizedException` (HTTP 401) | ✅ PASS |

---

## 2. Bộ Kiểm Thử Bóc Tách OCR: `npm run test:ocr` (9/9 Passed)

| Test ID | Mục Tiêu Kiểm Thử | Tệp Thử Nghiệm | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-OCR-01** | Khử BOM & non-breaking space | Văn bản chứa `\uFEFF`, `\u00A0` | Văn bản sạch, không ký tự thừa | ✅ PASS |
| **TC-OCR-02** | Chuẩn hóa ký tự xuống dòng | Văn bản có 3+ newline liên tiếp | Rút gọn thành tối đa 2 newline (`\n\n`) | ✅ PASS |
| **TC-OCR-03** | Đếm số lượng từ chính xác | Chuỗi 7 từ có dấu tiếng Việt | Đếm đúng `wordCount = 7` | ✅ PASS |
| **TC-OCR-04** | Nhận diện tài liệu Scanned | Văn bản ít chữ, tỷ lệ ký tự thấp | `isScanned = true` | ✅ PASS |
| **TC-OCR-05** | Bóc tách PDF Native | Tệp `.pdf` chứa văn bản số | Sử dụng `pdf-parse`, `chars > 0` | ✅ PASS |
| **TC-OCR-06** | Bóc tách Word `.docx` | Tệp Microsoft Word `.docx` | Sử dụng `mammoth`, `extractorUsed = mammoth`| ✅ PASS |
| **TC-OCR-07** | Bóc tách Ảnh quét | Tệp `.png` chứa chữ | Sử dụng `image-ocr`, `isScanned = true` | ✅ PASS |
| **TC-OCR-08** | File không tồn tại | Đường dẫn file ảo | Kích hoạt `raw-fallback`, không crash | ✅ PASS |
| **TC-OCR-09** | Định dạng lạ `.xyz` | Tệp không thuộc danh mục | Kích hoạt `raw-fallback`, an toàn | ✅ PASS |

---

## 3. Bộ Kiểm Thử Bóc Tách LLM: `npm run test:llm-extract` (6/6 Passed)

| Test ID | Mục Tiêu Kiểm Thử | Đầu Vào | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-LLM-01** | Bóc tách CV tiếng Việt chuẩn | Text CV Lập trình viên tiếng Việt | Trích xuất đúng `fullName`, `email`, `skills`, `workExperience` | ✅ PASS |
| **TC-LLM-02** | Bóc tách CV tiếng Anh 2 cột | Text CV đa cột từ Canva/TopCV | Nhận diện chuẩn `technicalSkills`, không lẫn lộn giữa các cột | ✅ PASS |
| **TC-LLM-03** | Khuyết thông tin liên hệ | CV không ghi SĐT, LinkedIn | `phone: null` hoặc xử lý an toàn, không crash | ✅ PASS |
| **TC-LLM-04** | CV quá ngắn (< 30 ký tự) | Văn bản 2 từ "CV ngắn" | Ném lỗi `BadRequestException` để tiết kiệm token | ✅ PASS |
| **TC-LLM-05** | Đồng bộ sang bảng Candidate | Upload CV mới qua API | Họ tên thật của ứng viên được ghi vào CSDL thay vì tên file | ✅ PASS |
| **TC-LLM-06** | API Re-extract hoạt động | `POST /api/v1/cv/:id/extract` | Bóc tách lại thành công, cập nhật `parsedData.profile` (HTTP 200) | ✅ PASS |
