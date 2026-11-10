# 📋 Đặc Tả Yêu Cầu Chức Năng (Functional Requirements - SRS)

> **Dự án**: Smart HR & Candidate Screening System  
> **Tiêu chuẩn áp dụng**: IEEE Std 830-1998 / ISO/IEC/IEEE 29148  
> **Quy ước từ ngữ**: **PHẢI** (MUST/SHALL) cho tính năng cốt lõi bắt buộc, **NÊN** (SHOULD) cho khuyến nghị, **CÓ THỂ** (MAY) cho tính năng nâng cao.

---

## 1. Bảng Phân Loại Tính Năng Theo Phạm Vi (Feature Classification Matrix)

| Mã Tính Năng | Tên Tính Năng | Phạm Vi (Scope) | Trạng Thái Bắt Buộc |
| :--- | :--- | :---: | :---: |
| **FR-USER-01** | Đăng nhập & Xác thực bảo mật | Core | **MUST (Bắt buộc)** |
| **FR-USER-02** | Phân quyền vai trò người dùng (RBAC) | Core | **MUST (Bắt buộc)** |
| **FR-USER-03** | Quản lý nhật ký hoạt động (Audit Log / Audit Trail) | Core | **MUST (Bắt buộc)** |
| **FR-JOB-01** | Quản lý Mô tả Công việc (Job Description - JD) | Core | **MUST (Bắt buộc)** |
| **FR-JOB-02** | Trích xuất tiêu chí JD tự động bằng AI | Core | **MUST (Bắt buộc)** |
| **FR-JOB-03** | Tùy chỉnh trọng số đánh giá vị trí tuyển dụng | Core | **MUST (Bắt buộc)** |
| **FR-CAND-01** | Tải lên CV đơn lẻ (Upload Single CV - PDF/DOCX) | Core | **MUST (Bắt buộc)** |
| **FR-CAND-02** | Quản lý hồ sơ ứng viên (Xem, Cập nhật thông tin) | Core | **MUST (Bắt buộc)** |
| **FR-CAND-03** | Quản lý trạng thái ứng viên trong quy trình (Pipeline) | Core | **MUST (Bắt buộc)** |
| **FR-CAND-04** | Xem trực tuyến & tải tệp CV gốc | Core | **MUST (Bắt buộc)** |
| **FR-CAND-05** | Tải lên hàng loạt hồ sơ CV (Batch Upload) | Advanced | **MAY (Mở rộng)** |
| **FR-CAND-06** | Xem xét & Đưa ra quyết định của Recruiter (Human-in-the-loop) | Core | **MUST (Bắt buộc)** |
| **FR-AI-01** | Tiếp nhận và trích xuất văn bản thô từ tài liệu CV (OCR) | Core | **MUST (Bắt buộc)** |
| **FR-AI-02** | Phân tích và chuyển đổi nội dung CV thành JSON có cấu trúc (LLM Parsing) | Core | **MUST (Bắt buộc)** |
| **FR-AI-03** | So khớp Ngữ nghĩa thông qua Vector Embedding & Cosine Similarity | Core | **MUST (Bắt buộc)** |
| **FR-AI-04** | Nhận diện kỹ năng tương đương (Synonyms / Normalization) | Core | **MUST (Bắt buộc)** |
| **FR-AI-04a** | Phân loại mức độ so khớp theo ngưỡng (Exact / Semantic / Partial / Missing) | Core | **MUST (Bắt buộc)** |
| **FR-AI-05** | Chấm điểm đa tiêu chí xác định (Deterministic Multi-Criteria Scoring) | Core | **MUST (Bắt buộc)** |
| **FR-AI-06** | Xếp hạng ứng viên tự động & Quy tắc giải quyết đồng điểm (Tie-breaking) | Core | **MUST (Bắt buộc)** |
| **FR-AI-07** | Báo cáo lý giải đánh giá minh bạch (AI Rationale & Gap Analysis) | Core | **MUST (Bắt buộc)** |
| **FR-AI-08** | Cơ chế Human-in-the-loop (AI chỉ khuyến nghị, con người ra quyết định) | Core | **MUST (Bắt buộc)** |
| **FR-AI-09** | Xử lý lỗi trong pipeline AI và bảo toàn dữ liệu gốc (Failure Handling) | Core | **MUST (Bắt buộc)** |
| **FR-AI-10** | Quản lý lưu trữ phiên bản chấm điểm & Metadata mô hình | Core | **MUST (Bắt buộc)** |
| **FR-INT-01** | Tự động khởi tạo bộ câu hỏi phỏng vấn thích ứng cá nhân hóa | Advanced | **MAY (Mở rộng)** |
| **FR-INT-02** | Phân loại câu hỏi phỏng vấn (Làm rõ nghi vấn, Kỹ năng, Tình huống) | Advanced | **MAY (Mở rộng)** |
| **FR-INT-03** | Chỉnh sửa và xuất danh sách câu hỏi phỏng vấn ra PDF/Word | Advanced | **MAY (Mở rộng)** |
| **FR-REP-01** | Dashboard thống kê tổng quan và trạng thái ứng viên | Core | **MUST (Bắt buộc)** |
| **FR-REP-02** | Báo cáo phân tích chuyên sâu (Advanced Analytics) | Advanced | **MAY (Mở rộng)** |

---

## 2. Chi Tiết Các Yêu Cầu Chức Năng Cốt Lõi

### 2.1. Quản lý Người dùng & Hệ thống (User Management)
* **[FR-USER-01] [MUST] Đăng nhập & Xác thực**: Hệ thống PHẢI hỗ trợ đăng nhập qua Email/Password bảo mật. Mật khẩu được mã hóa băm bằng `bcrypt` trước khi lưu trữ vào MongoDB.
* **[FR-USER-02] [MUST] Phân quyền vai trò (RBAC)**: Hệ thống PHẢI thiết lập và gán các quyền hạn truy cập tương ứng với 4 nhóm vai trò: `Admin`, `HR Manager`, `Recruiter`, và `Hiring Manager`.
* **[FR-USER-03] [MUST] Quản lý nhật ký hoạt động (Audit Trail)**: Hệ thống PHẢI ghi lại lịch sử thao tác của người dùng trên dữ liệu ứng viên và điều chỉnh cấu hình AI với các trường tối thiểu: `userId`, `timestamp`, `action`, `entity`, `entityId`, `oldValue`, `newValue`.

### 2.2. Quản lý Tin tuyển dụng & JD (Job Management)
* **[FR-JOB-01] [MUST] Quản lý Mô tả Công việc (JD)**: Hệ thống PHẢI cho phép tạo mới, chỉnh sửa, lưu trữ và xuất bản các tin tuyển dụng.
* **[FR-JOB-02] [MUST] Trích xuất tiêu chí JD tự động bằng AI**: Khi một JD được tải lên hoặc nhập vào, mô-đun AI PHẢI tự động trích xuất các thông tin cấu trúc: Kỹ năng cứng (Hard skills), Kỹ năng mềm (Soft skills), Số năm kinh nghiệm tối thiểu, Trình độ học vấn, và Bằng cấp/Chứng chỉ liên quan.
* **[FR-JOB-03] [MUST] Tùy chỉnh trọng số đánh giá**: Hệ thống PHẢI cho phép HR điều chỉnh thủ công trọng số (weight) dạng thập phân từ 0.0 đến 1.0 giữa các tiêu chí: Kỹ năng ($W_{\text{skill}}$), Kinh nghiệm ($W_{\text{exp}}$), Học vấn ($W_{\text{edu}}$), Chứng chỉ ($W_{\text{cert}}$). Tổng các trọng số PHẢI bằng 1.0.

### 2.3. Quản lý Ứng viên & Hồ sơ (Candidate Management)
* **[FR-CAND-01] [MUST] Tải lên CV**: Cho phép Recruiter tải lên tệp CV đơn lẻ (PDF/DOCX, dung lượng tối đa 5MB).
* **[FR-CAND-02] [MUST] Quản lý hồ sơ ứng viên**: Cho phép xem chi tiết, cập nhật thông tin cá nhân và lịch sử làm việc của ứng viên.
* **[FR-CAND-03] [MUST] Quản lý trạng thái**: Cho phép cập nhật trạng thái ứng viên theo chuỗi pipeline: `NEW` $\rightarrow$ `SCREENING` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW` $\rightarrow$ `OFFER` $\rightarrow$ `HIRED` / `REJECTED`.
* **[FR-CAND-04] [MUST] Xem CV**: Cho phép truy cập xem trực tiếp (inline streaming) hoặc tải tệp CV gốc.
* **[FR-CAND-05] [MAY] Batch CV Upload**: Hỗ trợ tải lên và xử lý bất đồng bộ đồng thời nhiều hồ sơ CV.
* **[FR-CAND-06] [MUST] Recruiter Review & Decision**: Hệ thống PHẢI cho phép Recruiter/HR xem xét kết quả phân tích AI, ghi nhận đánh giá chuyên môn và cập nhật quyết định xử lý ứng viên.

### 2.4. Mô-đun AI Sàng lọc Hồ sơ (AI-Assisted Candidate Screening)
* **[FR-AI-01] [MUST] Trích xuất văn bản (OCR)**: Tiếp nhận và trích xuất nội dung văn bản từ CV qua các thư viện chuyên dụng (`pdf-parse`, `mammoth`, `tesseract.js`).
* **[FR-AI-02] [MUST] Bóc tách cấu trúc CV**: Sử dụng NLP/LLM để phân tích và chuẩn hóa văn bản CV thành đối tượng JSON tuân thủ JSON Schema (Thông tin cá nhân, Học vấn, Lịch sử làm việc, Dự án, Kỹ năng, Chứng chỉ).
* **[FR-AI-03] [MUST] Semantic Matching**: Biểu diễn yêu cầu tuyển dụng và CV dưới dạng vector qua mô hình Embedding, sau đó đo độ tương đồng ngữ nghĩa bằng Cosine Similarity.
* **[FR-AI-04] [MUST] Nhận diện kỹ năng tương đương**: Nhận diện các biến thể tên gọi công nghệ (ví dụ: `React.js` $\leftrightarrow$ `ReactJS`, `REST API` $\leftrightarrow$ `RESTful API`).
* **[FR-AI-04a] [MUST] Phân loại mức độ so khớp theo ngưỡng (Thresholds)**:
  * $\text{Similarity} \ge 0.90$: **Exact Match** (Hệ số: 1.0).
  * $0.75 \le \text{Similarity} < 0.90$: **Semantic Match** (Hệ số: 0.8).
  * $0.50 \le \text{Similarity} < 0.75$: **Partial Match** (Hệ số: 0.5).
  * $\text{Similarity} < 0.50$: **Missing** (Hệ số: 0.0).
* **[FR-AI-05] [MUST] Công thức tính Overall Match Score**:
  $$\text{Overall Score} = S_{\text{skill}} \times W_{\text{skill}} + S_{\text{exp}} \times W_{\text{exp}} + S_{\text{edu}} \times W_{\text{edu}} + S_{\text{cert}} \times W_{\text{cert}}$$
  Mọi tính toán nội bộ duy trì độ chính xác 4 chữ số thập phân, kết quả hiển thị làm tròn đến 2 chữ số thập phân.
* **[FR-AI-06] [MUST] Xếp hạng ứng viên & Tie-breaking**: Tự động sắp xếp danh sách ứng viên theo điểm giảm dần. Khi đồng điểm, ưu tiên theo thứ tự: $\text{Experience Score} > \text{Skill Score} > \text{Thời gian nộp sớm hơn}$.
* **[FR-AI-07] [MUST] Lý giải đánh giá (AI Rationale)**: Tự động tạo báo cáo tóm tắt giải thích các yếu tố ảnh hưởng đến điểm số, chỉ rõ kỹ năng đáp ứng và kỹ năng thiếu hụt. LLM không được tự ý suy diễn hoặc thay đổi điểm số định lượng đã tính.
* **[FR-AI-08] [MUST] Human-in-the-loop**: AI chỉ đóng vai trò khuyến nghị; quyền quyết định tuyển dụng thuộc về Recruiter/HR.
* **[FR-AI-09] [MUST] AI Failure Handling**: Khi quá trình OCR, LLM hoặc Scoring gặp lỗi, hệ thống phải ghi nhận lỗi, bảo toàn CV gốc và không được tạo điểm số rác.
* **[FR-AI-10] [MUST] Quản lý lưu trữ kết quả phân tích AI**: Lưu trữ đầy đủ metadata: `scoringVersion`, `scoringWeights`, và `modelIdentifiers`.

### 2.4. Khởi tạo Câu hỏi Phỏng vấn Thông minh (AI Interview Generation)
* **[FR-INT-01] [MAY] Khởi tạo bộ câu hỏi phỏng vấn thích ứng cá nhân hóa (Adaptive Interview Generation)**:
  - Hệ thống sử dụng kiến trúc RAG kết hợp LLM để tự động sinh bộ câu hỏi phỏng vấn dựa trên: (1) Thông tin trích xuất từ CV ứng viên, (2) Yêu cầu từ Job Description (JD), và (3) Kết quả phân tích khoảng cách kỹ năng (Skill Gap Analysis) từ Matching Engine.
  - Mỗi câu hỏi phải gắn liền với ngữ cảnh thực tế (evidence/context) từ hồ sơ ứng viên nhằm hạn chế ảo giác (hallucination).
* **[FR-INT-02] [MAY] Phân loại câu hỏi đa chiều & Cung cấp tiêu chí đánh giá**:
  - Tự động phân loại câu hỏi thành các nhóm:
    1. `Clarification / Verification`: Làm rõ thông tin mập mờ, khoảng trống thời gian hoặc công nghệ liệt kê chưa rõ vai trò.
    2. `Technical Deep-dive`: Đào sâu chuyên môn vào các công nghệ trọng tâm mà ứng viên claim có kinh nghiệm.
    3. `Skill Gap Probing`: Đánh giá nhanh các kỹ năng JD yêu cầu nhưng CV còn thiếu hụt hoặc chỉ đáp ứng một phần.
    4. `Behavioral & Situational (STAR)`: Câu hỏi tình huống theo khung năng lực (Situation, Task, Action, Result).
  - Đi kèm mỗi câu hỏi PHẢI có: Độ khó (`Easy`, `Medium`, `Hard`), Mục đích câu hỏi (`purpose`), Điểm mấu chốt mong đợi (`expectedKeyPoints`), và Bareme gợi ý chấm điểm mẫu (1 điểm - 3 điểm - 5 điểm).
* **[FR-INT-03] [MAY] Tương tác Human-in-the-loop & Xuất tài liệu phỏng vấn**:
  - Cho phép Recruiter / Hiring Manager xem trước, chỉnh sửa nội dung, thay đổi độ khó, thêm câu hỏi tùy chỉnh, hoặc xóa câu hỏi không mong muốn trước buổi phỏng vấn.
  - Hỗ trợ xuất phiếu câu hỏi phỏng vấn ra định dạng PDF / Word hoặc sao chép nhanh vào clipboard.

### 2.5. Báo cáo & Phân tích Tuyển dụng (Reporting & Analytics)
* **[FR-REP-01] [MUST] Dashboard thống kê tổng quan**:
  - Cung cấp giao diện trực quan hiển thị các chỉ số tuyển dụng cơ bản: Tổng số hồ sơ tiếp nhận, số lượng theo từng trạng thái pipeline (`NEW`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`), phân bố điểm số phù hợp (Score distribution).
* **[FR-REP-02] [MAY] Báo cáo phân tích chuyên sâu (Advanced Analytics)**:
  - Thống kê tỷ lệ chuyển đổi qua từng phễu tuyển dụng (Conversion rate).
  - Thống kê các kỹ năng ứng viên còn thiếu hụt nhiều nhất theo từng vị trí (Skill gap heatmap).
  - Đánh giá thời gian trung bình từ khi nộp đơn đến khi hoàn thành sàng lọc (Time-to-screen).
