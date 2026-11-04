# 🛡 Đặc Tả Yêu Cầu Phi Chức Năng (Non-Functional Requirements - SRS)

> **Dự án**: Smart HR & Candidate Screening System  
> **Tiêu chuẩn áp dụng**: IEEE Std 830-1998 / ISO/IEC/IEEE 29148  
> **Quy ước từ ngữ**: **PHẢI** (MUST/SHALL) cho yêu cầu bắt buộc, **NÊN** (SHOULD) cho khuyến nghị, **CÓ THỂ** (MAY) cho tính năng mở rộng.

---

## 1. Yêu Cầu Hiệu Năng (Performance Requirements - PERF)

* **[NFR-PERF-01] [SHOULD] Thời gian phân tích CV tiêu chuẩn**: Trong môi trường thử nghiệm, hệ thống SHOULD hoàn thành quá trình phân tích một CV tiêu chuẩn (định dạng PDF/DOCX, dung lượng $\le 5\text{MB}$, số trang $\le 5$ trang và là tài liệu dạng text-based) trong thời gian **không quá 15 giây** khi dịch vụ AI hoạt động bình thường.
* **[NFR-PERF-02] [MAY] Xử lý đồng thời trong một phiên (Batch Capacity)**: Hệ thống CÓ THỂ hỗ trợ tải lên và xử lý ít nhất **20 hồ sơ CV** trong một phiên sàng lọc mà không làm nghẽn dịch vụ chính.
* **[NFR-PERF-03] [MUST] Thời gian phản hồi giao diện**: Thời gian phản hồi đối với các thao tác tra cứu, tìm kiếm và lọc danh sách ứng viên PHẢI **không vượt quá 3 giây** trong môi trường thử nghiệm.

---

## 2. Yêu Cầu Sao Lưu & Phục Hồi Dữ Liệu (Data Management - DATA)

* **[NFR-DATA-01] [MUST] Sao lưu dữ liệu dự phòng**: Hệ thống PHẢI hỗ trợ cơ chế sao lưu dữ liệu cơ sở dữ liệu MongoDB định kỳ nhằm hạn chế nguy cơ mất mát dữ liệu khi xảy ra sự cố phần cứng hoặc mạng.
* **[NFR-DATA-02] [MAY] Tự động hóa sao lưu & phục hồi**: Tự động hóa quy trình sao lưu (Automated Backup) và cung cấp tài liệu kịch bản phục hồi thảm họa (Disaster Recovery).
* **[NFR-DATA-03] [MUST] Quản lý vòng đời dữ liệu & Tuân thủ pháp lý**:
  * Tuân thủ các nguyên tắc bảo vệ dữ liệu cá nhân theo **Nghị định 13/2023/NĐ-CP** và **GDPR**.
  * Cho phép tiếp nhận và xử lý yêu cầu xóa dữ liệu cá nhân của ứng viên (Right to be Forgotten).
  * Tự động ẩn danh hóa (Anonymize) các thông tin định danh cá nhân khi lưu trữ lâu dài phục vụ huấn luyện hoặc đánh giá mô hình.
  * Hỗ trợ cấu hình thời gian lưu trữ tối đa (Retention Period) linh hoạt theo chính sách tổ chức.

---

## 3. Yêu Cầu Bảo Mật (Security Requirements - SEC)

* **[NFR-SEC-01] [MUST] Mã hóa dữ liệu truyền tải**: Dữ liệu cá nhân và tài liệu CV PHẢI được bảo vệ khỏi truy cập trái phép. Toàn bộ dữ liệu truyền tải giữa Client (Browser) và Server trong môi trường production PHẢI được mã hóa qua giao thức **HTTPS/TLS 1.3**.
* **[NFR-SEC-02] [MUST] Tự động hết hạn phiên làm việc**: Tự động hết hạn phiên đăng nhập (Session Timeout) sau **30 phút** nếu người dùng không có thao tác hoạt động.
* **[NFR-SEC-03] [MUST] Kiểm soát truy cập tệp tin (File Access Control)**: Đảm bảo kiểm soát truy cập chặt chẽ, người dùng không thể truy cập trái phép vào tài liệu CV của người khác. Áp dụng cơ chế Private Storage Access hoặc Signed URLs.
* **[NFR-SEC-04] [MUST] Loại bỏ thuộc tính nhạy cảm khỏi Scoring**: Các thuộc tính nhạy cảm hoặc không liên quan đến yêu cầu công việc PHẢI được loại khỏi dữ liệu đầu vào của Scoring Engine và **KHÔNG ĐƯỢC** sử dụng trực tiếp trong quá trình tính điểm ứng viên.
* **[NFR-SEC-05] [MUST] Bảo mật ứng dụng & hạ tầng**:
  * Băm mật khẩu người dùng bằng thuật toán `bcrypt` (saltRounds = 10) hoặc `argon2`.
  * Chiến lược xác thực JWT Stateless có thời gian sống ngắn kèm cơ chế Refresh Token an toàn.
  * Thiết lập cơ chế giới hạn tần suất yêu cầu (**Rate Limiting**) phòng chống tấn công brute-force và DoS.

---

## 4. Thuộc Tính Chất Lượng Phần Mềm (Software Quality Attributes - QUAL)

* **[NFR-QUAL-01] [MUST] Độ tin cậy (Reliability)**: Hệ thống PHẢI hoạt động ổn định trong quá trình kiểm thử, duy trì uptime $\ge 99\%$ và không xảy ra lỗi nghiêm trọng (unhandled crash) khi thực hiện các chức năng chính.
* **[NFR-QUAL-02] [MUST] Tính dễ sử dụng (Usability)**: Người dùng mới (HR Recruiter) có thể hoàn thành các tác vụ cơ bản (tạo JD, tải CV, xem kết quả screening và cập nhật trạng thái ứng viên) sau tối đa **2 giờ hướng dẫn**. Giao diện hướng tới tuân thủ chuẩn **WCAG 2.1**.
* **[NFR-QUAL-03] [MUST] Khả năng bảo trì (Maintainability)**: Mã nguồn backend NestJS được thiết kế theo cấu trúc Modular Architecture chuẩn mực, tách biệt tầng Controllers, Services, DTOs và Utilities; cung cấp đầy đủ tài liệu API tương tác qua Swagger/OpenAPI.

---

## 5. Đánh Giá Mô Hình AI & Tính Công Bằng (AI Evaluation & Ethics - AI)

* **[NFR-AI-01] [MUST] Lưu trữ phục vụ kiểm toán AI**: Hệ thống PHẢI lưu trữ các kết quả screening (điểm thành phần, Overall Match Score, kết quả matching và thứ hạng ứng viên) để phục vụ kiểm thử, đánh giá và phân tích hiệu quả của mô-đun AI.
* **[NFR-AI-02] [MUST] Tính công bằng & Thuộc tính nhạy cảm (Fairness & Bias Prevention)**: Hệ thống **KHÔNG ĐƯỢC PHÉP** sử dụng các thông tin nhạy cảm (giới tính, độ tuổi, dân tộc, tôn giáo, tình trạng hôn nhân, quê quán) làm tiêu chí trực tiếp để tính điểm phù hợp của ứng viên.
* **[NFR-AI-03] [MUST] Tiền xử lý dữ liệu chống thiên kiến**: Hệ thống PHẢI chủ động loại bỏ các thuộc tính nhạy cảm khỏi dữ liệu đầu vào nạp vào Scoring Engine và cung cấp dữ liệu đối chứng cần thiết để phục vụ đánh giá tính công bằng (Fairness Audit) trong các đợt benchmark.
