# 🗺 Bản Đồ Hành Trình Người Dùng (User Journey Map)

> **Dự án**: Smart HR & Candidate Screening System  

---

```mermaid
journey
    title Hành trình của Recruiter (Lan) trong quy trình tuyển dụng với Smart HR
    section 1. Tiếp nhận & Đăng tuyển
      Tạo vị trí tuyển dụng mới (JD): 5: Recruiter
      Hệ thống AI chuẩn hóa yêu cầu kỹ năng: 5: Smart HR
    section 2. Thu nạp hồ sơ CV
      Tải lên tệp CV (PDF/Word/Ảnh): 5: Recruiter
      Tự động OCR và bóc tách cấu trúc bằng Gemini: 5: Smart HR
      Đồng bộ hồ sơ ứng viên vào cơ sở dữ liệu: 5: Smart HR
    section 3. Chấm điểm & Sàng lọc
      Hệ thống tính điểm Matching 0-100%: 5: Smart HR
      Recruiter duyệt danh sách xếp hạng ứng viên: 5: Recruiter
      Xem giải trình điểm số & khoảng cách kỹ năng: 5: Recruiter
    section 4. Chuẩn bị phỏng vấn
      Chuyển ứng viên vào Shortlist cho Tech Lead: 4: Recruiter
      AI sinh bộ câu hỏi phỏng vấn & đề test thực hành: 5: Smart HR
      Tech Lead sử dụng bộ câu hỏi tiến hành phỏng vấn: 5: Tech Lead
    section 5. Quyết định tuyển dụng
      Chấm điểm câu trả lời theo rubric gợi ý: 5: Tech Lead
      Gửi thư mời nhận việc (Offer Letter): 5: Recruiter
```

---

## Các Điểm Chạm Chính (Key Touchpoints)

1. **Dashboard Tổng Quan**: Nơi hiển thị các đợt tuyển dụng đang mở, số lượng CV đã nhận, phân bổ điểm số ứng viên.
2. **Khu Vực Tải Lên CV (Drag & Drop Uploader)**: Giao diện kéo thả tệp tin nhanh, hiển thị thanh tiến trình xử lý OCR và LLM Extraction theo thời gian thực.
3. **Màn Hình Chi Tiết Ứng Viên (Candidate Profile View)**:
   - Cột trái: Tệp CV gốc kèm khung xem trực tuyến PDF.
   - Cột phải: Dữ liệu JSON chuẩn hóa (Kinh nghiệm, Kỹ năng, Học vấn, Dự án tiêu biểu).
   - Nút hành động: "Tái bóc tách" (Re-extract), "Đánh giá với JD", "Tạo bộ câu hỏi phỏng vấn".
4. **Bảng Phân Tích Khớp Nối (Match Matrix View)**: So sánh trực quan dạng radar chart giữa yêu cầu của JD và năng lực thực tế của ứng viên.
