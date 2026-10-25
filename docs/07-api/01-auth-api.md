# 🔐 Đặc Tả API Xác Thực & Người Dùng (Auth API Specification)

> **Dự án**: Smart HR & Candidate Screening System  
> **Module**: `AuthModule`  

---

## 1. Đăng Ký Tài Khoản Mới

- **Endpoint**: `POST /api/v1/auth/register`
- **Mô tả**: Tạo mới tài khoản Recruiter hoặc Hiring Manager.
- **Quyền truy cập**: Public (Không cần Token).

### Request Body:
```json
{
  "email": "recruiter@smart-hr.com",
  "password": "SecurePassword123",
  "fullName": "Nguyễn Văn Tuyển"
}
```

### Phản Hồi Thành Công (HTTP 201 Created):
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "671b5690b2c145a4a1122334",
      "email": "recruiter@smart-hr.com",
      "fullName": "Nguyễn Văn Tuyển",
      "role": "recruiter"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Mã Lỗi Có Thể Trả Về:
- `400 Bad Request`: Email sai định dạng hoặc mật khẩu ngắn hơn 6 ký tự.
- `409 Conflict`: Email này đã tồn tại trong hệ thống.

---

## 2. Đăng Nhập Hệ Thống

- **Endpoint**: `POST /api/v1/auth/login`
- **Mô tả**: Xác thực thông tin đăng nhập và cấp mới Access Token.
- **Quyền truy cập**: Public.

### Request Body:
```json
{
  "email": "recruiter@smart-hr.com",
  "password": "SecurePassword123"
}
```

### Phản Hồi Thành Công (HTTP 200 OK):
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "671b5690b2c145a4a1122334",
      "email": "recruiter@smart-hr.com",
      "fullName": "Nguyễn Văn Tuyển",
      "role": "recruiter"
    }
  }
}
```

### Mã Lỗi Có Thể Trả Về:
- `401 Unauthorized`: Email hoặc mật khẩu không chính xác.
