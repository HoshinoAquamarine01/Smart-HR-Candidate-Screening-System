# 🌐 Quy Chuẩn Thiết Kế API (API Standards & Guidelines)

> **Dự án**: Smart HR & Candidate Screening System  
> **Kiến trúc API**: RESTful JSON over HTTPS  
> **Prefix gốc**: `/api/v1`

---

## 1. Định Dạng Phản Hồi Chuẩn (Standard Response Envelope)

Tất cả các endpoint trong hệ thống đều tuân thủ cấu trúc phong bì phản hồi thống nhất:

### Phản Hồi Thành Công (HTTP 200, 201)
```json
{
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": {
    "id": "60d0fe4f5311236168a109ca",
    "...": "Dữ liệu kết quả"
  }
}
```

### Phản Hồi Lỗi (HTTP 400, 401, 403, 404, 409, 500)
```json
{
  "statusCode": 400,
  "message": "Văn bản CV quá ngắn hoặc rỗng, không đủ nội dung để phân tích.",
  "error": "Bad Request"
}
```

---

## 2. Mã Trạng Thái HTTP Chuẩn Được Sử Dụng

- `200 OK`: Yêu cầu GET/POST/PUT được thực hiện thành công.
- `201 Created`: Tạo mới thành công bản ghi (Đăng ký tài khoản, Tải lên CV).
- `400 Bad Request`: Tham số không hợp lệ, thiếu file, định dạng tệp không được hỗ trợ.
- `401 Unauthorized`: Chưa cung cấp Bearer JWT Token hoặc Token đã hết hạn.
- `403 Forbidden`: Người dùng không có quyền thực hiện thao tác (RBAC).
- `404 Not Found`: Không tìm thấy bản ghi theo ID (CV không tồn tại, Ứng viên không tồn tại).
- `409 Conflict`: Xung đột dữ liệu (Email đã được đăng ký trước đó).
- `429 Too Many Requests`: Vượt quá giới hạn tần suất gọi API (Rate limit).
- `500 Internal Server Error`: Lỗi phát sinh ngoài dự kiến phía máy chủ.

---

## 3. Tiêu Chuẩn Xác Thực (Authentication Header)

Đối với các endpoint yêu cầu xác thực (`JwtAuthGuard`), Client phải gửi kèm Header:
```http
Authorization: Bearer <access_token>
```

---

## 4. Danh Sách Các Tài Liệu Đặc Tả API Theo Phân Hệ

1. [01-auth-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/01-auth-api.md): Xác thực tài khoản, đăng ký, đăng nhập và phân quyền JWT.
2. [02-cv-extraction-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/02-cv-extraction-api.md): Tải lên tệp CV, bóc tách OCR và trích xuất cấu trúc LLM.
3. [03-candidate-matching-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/03-candidate-matching-api.md): Đối soát điểm số CV - JD, Semantic Matching và xếp hạng ứng viên.
4. [04-interview-generation-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/04-interview-generation-api.md): **[TUẦN 12] Khởi tạo bộ câu hỏi phỏng vấn thích ứng theo kiến trúc RAG, chỉnh sửa Human-in-the-loop và xuất phiếu phỏng vấn.**
5. [05-jobs-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/05-jobs-api.md): **Quản lý tin tuyển dụng (Jobs CRUD), AI bóc tách tiêu chí JD tự động và sinh vector embedding.**
6. [06-candidates-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/06-candidates-api.md): **Quản lý hồ sơ ứng viên 360°, tìm kiếm lọc đa tiêu chí (kỹ năng, điểm số, trạng thái phễu), và chuyển trạng thái Kanban.**
7. [07-applications-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/07-applications-api.md): **Quản lý đơn ứng tuyển, bảng điều khiển Kanban drag-and-drop và lịch sử kiểm toán quyết định tuyển dụng [FR-CAND-03].**
8. [08-analytics-api.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/08-analytics-api.md): **Báo cáo & thống kê tuyển dụng Dashboard, phân bố điểm số matching, phễu ứng viên và khoảng cách kỹ năng (Skill Gaps) [FR-REP-01].**

