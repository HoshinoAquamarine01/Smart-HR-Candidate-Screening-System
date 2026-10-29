# 📋 Yêu Cầu Chức Năng (Functional Requirements)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Danh Mục Yêu Cầu Chức Năng (Functional Requirements Matrix)

### Module 1: Quản Lý Xác Thực & Người Dùng (Auth & User Management)
- **FR-AUTH-01 (Đăng ký tài khoản)**: Hệ thống cho phép người dùng đăng ký tài khoản với email hợp lệ, mật khẩu bảo mật (tối thiểu 6 ký tự). Mật khẩu phải được mã hóa bằng thuật toán `bcrypt` trước khi lưu trữ vào CSDL.
- **FR-AUTH-02 (Đăng nhập & JWT)**: Người dùng đăng nhập thành công nhận được mã `access_token` định dạng JWT có thời hạn hợp lệ để xác thực các yêu cầu tiếp theo.
- **FR-AUTH-03 (Phân quyền người dùng)**: Hỗ trợ các vai trò người dùng (Recruiter, Hiring Manager, Admin) kiểm soát quyền truy cập tài nguyên.

---

### Module 2: Quản Lý & Tải Lên Hồ Sơ CV (CV Management & OCR)
- **FR-CV-01 (Tải lên đa định dạng)**: Cho phép tải lên tệp tin CV có định dạng PDF, Microsoft Word (`.docx`, `.doc`), và Ảnh (`.png`, `.jpg`, `.jpeg`). Giới hạn kích thước tối đa 5MB mỗi tệp.
- **FR-CV-02 (Trích xuất văn bản thô - OCR)**:
  - Tệp PDF Native: Trích xuất trực tiếp bằng thư viện `pdf-parse`.
  - Tệp Word `.docx`: Trích xuất bằng thư viện `mammoth`.
  - Tệp ảnh hoặc Scanned PDF: Tự động kích hoạt nhận diện ký tự quang học qua `tesseract.js`.
- **FR-CV-03 (Làm sạch văn bản)**: Tự động loại bỏ mã rác, chuẩn hóa ký tự xuống dòng liên tiếp, loại bỏ ký tự điều khiển (control characters) và tính toán số từ/số ký tự.
- **FR-CV-04 (Xem & Tải tệp CV)**: Hỗ trợ endpoint tải hoặc xem trực tuyến (streaming inline) file gốc của ứng viên.

---

### Module 3: Bóc Tách Hồ Sơ Ngữ Nghĩa Qua LLM (LLM Semantic Extraction)
- **FR-LLM-01 (Trích xuất Profile Chuẩn)**: Chuyển đổi văn bản thô từ OCR thành đối tượng JSON chuẩn hóa (`StandardCvProfile`) bao gồm:
  - Thông tin cá nhân: Họ tên, email, số điện thoại, địa chỉ, liên kết mạng xã hội (LinkedIn, GitHub).
  - Tóm tắt nghề nghiệp (Professional Summary).
  - Kỹ năng phân loại 3 tầng: Kỹ thuật (Technical Skills), Kỹ năng mềm (Soft Skills), Công cụ/Nền tảng (Tools & Platforms).
  - Lịch sử công tác: Tên công ty, chức danh, khoảng thời gian (startDate, endDate, isCurrent), trách nhiệm, thành tựu nổi bật, tech stack đã dùng.
  - Học vấn, chứng chỉ chuyên môn, ngoại ngữ và dự án thực tế.
- **FR-LLM-02 (Đồng bộ ứng viên)**: Tự động cập nhật họ tên thực và thông tin liên hệ vào bảng `Candidates`. Nếu email ứng viên đã tồn tại, liên kết CV mới với ứng viên hiện có nhằm tránh tạo dữ liệu rác (Deduplication).
- **FR-LLM-03 (Tái trích xuất - Re-extract)**: Cung cấp API `POST /api/v1/cv/:id/extract` cho phép kích hoạt lại quá trình trích xuất LLM từ dữ liệu OCR đã lưu.
- **FR-LLM-04 (Cơ chế chịu lỗi - Fallback)**: Tự động chuyển đổi giữa Google Gemini 2.0 Flash $\rightarrow$ OpenAI GPT-4o-mini $\rightarrow$ Mock Offline Provider nếu gặp sự cố mạng hoặc hết hạn ngạch API.

---

### Module 4: Quản Lý Mô Tả Công Việc (Job Description - JD Management)
- **FR-JD-01 (Tạo và quản lý JD)**: Cho phép HR tạo mới vị trí tuyển dụng với các trường: Tiêu đề công việc, phòng ban, cấp bậc (Junior, Mid, Senior, Lead), mô tả trách nhiệm, kỹ năng bắt buộc, kỹ năng ưu tiên, số năm kinh nghiệm yêu cầu.
- **FR-JD-02 (Chuẩn hóa tiêu chí JD)**: Tự động chuẩn hóa từ khóa kỹ năng từ mô tả văn bản tự do của JD.

---

### Module 5: Chấm Điểm Tương Thích (Semantic Fit Scoring Engine)
- **FR-SCORE-01 (Tính điểm đa chiều)**: Tính điểm tổng hợp (0–100%) giữa ứng viên và JD theo công thức trọng số:
  - Điểm Kỹ năng (Skill Fit Score - 45%): Mức độ phủ của kỹ năng ứng viên trên danh mục kỹ năng yêu cầu.
  - Điểm Kinh nghiệm (Experience Score - 35%): So khớp số năm kinh nghiệm và mức độ phù hợp của các dự án đã làm.
  - Điểm Nghiệp vụ & Học vấn (Domain & Education Fit - 20%): Ngành nghề tương đồng và bằng cấp.
- **FR-SCORE-02 (Giải trình điểm số)**: Trả về đoạn văn giải thích lý do đạt/không đạt điểm, liệt kê rõ các kỹ năng thiếu hụt (Skill Gaps).

---

### Module 6: Sinh Câu Hỏi Phỏng Vấn & Đề Kiểm Tra Năng Lực (Interview & Assessment Gen)
- **FR-INT-01 (Sinh câu hỏi phỏng vấn thích ứng)**: Tạo 5-10 câu hỏi kỹ thuật xoay quanh điểm yếu phát hiện trong quá trình so khớp và đào sâu vào các dự án lớn ứng viên từng đảm nhiệm.
- **FR-INT-02 (Gợi ý đáp án & Thang điểm)**: Cung cấp đáp án mẫu và tiêu chí chấm điểm từ 1-5 cho từng câu hỏi.
- **FR-ASSESS-01 (Sinh đề kiểm tra kỹ thuật)**: Tạo các bài tập lập trình hoặc câu hỏi tình huống thiết kế hệ thống tương ứng với cấp bậc ứng viên.
