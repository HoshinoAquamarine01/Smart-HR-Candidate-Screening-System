# 🔒 Bảo Vệ Dữ Liệu Cá Nhân & Tuân Thủ (Data Privacy & Compliance)

> **Dự án**: Smart HR & Candidate Screening System  
> **Tiêu chuẩn tuân thủ**: Nghị định 13/2023/NĐ-CP (PDPD Việt Nam) & GDPR

---

## 1. Bảo Vệ Thông Tin Nhận Dạng Cá Nhân (PII Protection)

Dữ liệu hồ sơ xin việc (CV) chứa nhiều thông tin nhạy cảm: Họ tên, số điện thoại, địa chỉ nhà, ngày sinh, email cá nhân. Hệ thống triển khai các biện pháp bảo vệ:

1. **Chế Độ Ẩn Danh Hồ Sơ (Blind Screening / CV Anonymization)**:
   - Khi tính năng `anonymized: true` được kích hoạt, hệ thống tự động ẩn các trường PII (`fullName` $\rightarrow$ "Candidate #A102", ẩn `email`, `phone`, ảnh đại diện).
   - Giúp ban giám khảo kỹ thuật đánh giá năng lực một cách hoàn toàn khách quan, loại bỏ định kiến giới tính, độ tuổi hoặc sắc tộc.
2. **Quyền Được Lãng Quên (Right to Erasure / Data Deletion)**:
   - Cho phép ứng viên hoặc HR yêu cầu xóa vĩnh viễn hồ sơ và tệp tin vật lý khỏi ổ đĩa server khi hết nhu cầu lưu trữ.
3. **Mã Hóa Dữ Liệu Khi Nghỉ (Encryption at Rest)**:
   - Cơ sở dữ liệu MongoDB Atlas được mã hóa cấp đĩa bằng AES-256.

---

## 2. Nhật Ký Truy Vấn & Kiểm Toán (Audit Logging)

Mọi thao tác liên quan đến việc xem, tải xuống hoặc trích xuất lại thông tin ứng viên đều được ghi log với các trường:
- `userId`: Người thực hiện thao tác.
- `candidateId` / `cvId`: Đối tượng bị truy cập.
- `action`: `CV_UPLOAD`, `CV_DOWNLOAD`, `CV_EXTRACT`, `SCORE_VIEW`.
- `ipAddress` và `timestamp`.
