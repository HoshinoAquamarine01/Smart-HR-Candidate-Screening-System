# 📑 Danh Mục Tính Năng (Feature Backlog & User Stories)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Epic 1: Xác Thực & Quản Lý Truy Cập (Auth & RBAC)

| User Story ID | Là (As a) | Tôi muốn (I want to) | Để (So that) | Độ Ưu Tiên | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-AUTH-01** | Người dùng mới | Đăng ký tài khoản bằng email & mật khẩu | Có tài khoản truy cập vào hệ thống | P0 (Must) | Hoàn thành |
| **US-AUTH-02** | Người dùng | Đăng nhập và nhận JWT token | Sử dụng các API bảo vệ một cách an toàn | P0 (Must) | Hoàn thành |
| **US-AUTH-03** | Quản trị viên | Phân quyền vai trò Recruiter / Tech Lead / Admin | Kiểm soát phạm vi thao tác dữ liệu | P1 (Should) | Đang làm |

---

## 2. Epic 2: Quản Lý CV & Bóc Tách Đa Định Dạng (CV & OCR)

| User Story ID | Là (As a) | Tôi muốn (I want to) | Để (So that) | Độ Ưu Tiên | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-CV-01** | Recruiter | Tải lên tệp CV (PDF/DOCX/Ảnh) | Đưa hồ sơ ứng viên vào hệ thống | P0 (Must) | Hoàn thành |
| **US-CV-02** | Hệ thống | Tự động OCR và làm sạch văn bản | Có dữ liệu text chuẩn phục vụ LLM | P0 (Must) | Hoàn thành |
| **US-CV-03** | Recruiter | Xem và tải lại file CV gốc | Đối chiếu khi cần xác minh thông tin | P0 (Must) | Hoàn thành |

---

## 3. Epic 3: Trích Xuất Ngữ Nghĩa LLM (Semantic Extraction)

| User Story ID | Là (As a) | Tôi muốn (I want to) | Để (So that) | Độ Ưu Tiên | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-LLM-01** | Recruiter | Trích xuất thông tin CV thành JSON chuẩn | Xem hồ sơ ứng viên có cấu trúc rõ ràng | P0 (Must) | Hoàn thành |
| **US-LLM-02** | Hệ thống | Tự động lưu họ tên, email thật vào Candidates | Không còn hiển thị tên file thay cho tên người | P0 (Must) | Hoàn thành |
| **US-LLM-03** | Recruiter | Bấm nút "Re-extract" cho một CV đã có | Cập nhật lại dữ liệu khi đổi mô hình AI | P1 (Should) | Hoàn thành |
| **US-LLM-04** | Hệ thống | Tự động fallback sang OpenAI/Mock khi mất mạng | Giữ hệ thống luôn ổn định không bị gián đoạn | P0 (Must) | Hoàn thành |

---

## 4. Epic 4: Chấm Điểm So Khớp Hồ Sơ (Fit Scoring Engine)

| User Story ID | Là (As a) | Tôi muốn (I want to) | Để (So that) | Độ Ưu Tiên | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-SCR-01** | Recruiter | Nhập mô tả công việc (JD) mới | Tạo tiêu chuẩn đánh giá ứng viên | P0 (Must) | Kế hoạch |
| **US-SCR-02** | Recruiter | Chấm điểm tương thích giữa CV và JD (0-100%) | Lọc nhanh top 10% ứng viên sáng giá nhất | P0 (Must) | Kế hoạch |
| **US-SCR-03** | Recruiter | Xem danh sách các kỹ năng thiếu hụt (Skill Gaps) | Nắm rõ điểm cần lưu ý khi phỏng vấn | P1 (Should) | Kế hoạch |

---

## 5. Epic 5: Sinh Câu Hỏi Phỏng Vấn & Đề Kiểm Tra (Interview Gen)

| User Story ID | Là (As a) | Tôi muốn (I want to) | Để (So that) | Độ Ưu Tiên | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-INT-01** | Tech Lead | Tự động sinh 5-7 câu hỏi kỹ thuật cho ứng viên | Phỏng vấn trọng tâm vào điểm nghi vấn | P1 (Should) | Kế hoạch |
| **US-INT-02** | Tech Lead | Có đáp án gợi ý và rubric thang điểm | Đánh giá câu trả lời khách quan | P1 (Should) | Kế hoạch |
| **US-INT-03** | Tech Lead | Sinh đề bài coding challenge theo cấp bậc | Kiểm tra năng lực thực hành của ứng viên | P2 (Could) | Kế hoạch |
