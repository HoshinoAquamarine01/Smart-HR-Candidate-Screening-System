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
