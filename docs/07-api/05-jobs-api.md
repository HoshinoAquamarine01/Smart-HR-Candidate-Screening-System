# 💼 Tài Liệu Đặc Tả API Quản Lý Tin Tuyển Dụng & JD (Jobs Management API)

> **Dự án**: Smart HR & Candidate Screening System  
> **Phiên bản API**: `v1`  
> **Base URL**: `/api/v1/jobs`  
> **Mã yêu cầu SRS**: `[FR-JOB-01]`, `[FR-JOB-02]`, `[FR-JOB-03]`

---

## 1. Tổng Quan Các Điểm Cuối (Endpoints Summary)

| Phương Thức | Đường Dẫn | Chức Năng | Quyền Hạn (RBAC) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/jobs` | Tạo tin tuyển dụng (AI tự động bóc tách tiêu chí + sinh embedding) | Recruiter, Admin |
| `POST` | `/api/v1/jobs/parse-jd` | Xem trước kết quả AI bóc tách JD thô (không lưu DB) | Recruiter, Admin |
| `GET` | `/api/v1/jobs` | Lấy danh sách tin tuyển dụng (Phân trang, tìm kiếm, lọc) | Tất cả |
| `GET` | `/api/v1/jobs/:id` | Xem chi tiết tin tuyển dụng + thống kê phễu ứng viên | Tất cả |
| `PUT` | `/api/v1/jobs/:id` | Cập nhật thông tin tin tuyển dụng (tùy chọn bóc tách lại) | Recruiter, Admin |
| `PATCH` | `/api/v1/jobs/:id/status` | Đổi nhanh trạng thái (`DRAFT` / `PUBLISHED` / `CLOSED`) | Recruiter, Admin |
| `DELETE` | `/api/v1/jobs/:id` | Xóa tin tuyển dụng (tự động chuyển `CLOSED` nếu đã có ứng viên) | Recruiter, Admin |

---

## 2. Chi Tiết Từng Điểm Cuối (Detailed Specifications)

### 2.1. Tạo Tin Tuyển Dụng (Create Job)
* **Endpoint**: `POST /api/v1/jobs`
* **Mô tả**: Tạo mới tin tuyển dụng. Nếu `autoExtract: true` (mặc định), hệ thống tự động gọi AI phân tích văn bản JD để trích xuất `requiredSkills`, `preferredSkills`, `minExperienceYears`, `seniorityLevel` và sinh vector embedding.

#### Request Body (`CreateJobDto`):
```json
{
  "title": "Senior Backend Engineer (NestJS / Node.js)",
  "department": "Platform Engineering",
  "location": "Hà Nội / Hybrid",
  "employmentType": "FULL_TIME",
  "rawDescription": "Tuyển dụng Senior Backend Engineer từ 4 năm kinh nghiệm. Yêu cầu: Thành thạo NestJS, Node.js, TypeScript, MongoDB. Ưu tiên: Docker, Kubernetes, Redis, AWS. Trách nhiệm: Thiết kế kiến trúc backend, tối ưu truy vấn database.",
  "autoExtract": true,
  "status": "PUBLISHED"
}
```

#### Response (`201 Created`):
```json
{
  "_id": "6af2932de3d888b86732427a",
  "title": "Senior Backend Engineer (NestJS / Node.js)",
  "department": "Platform Engineering",
  "location": "Hà Nội / Hybrid",
  "employmentType": "FULL_TIME",
  "rawDescription": "Tuyển dụng Senior Backend Engineer...",
  "extractedCriteria": {
    "requiredSkills": ["NestJS", "Node.js", "TypeScript", "MongoDB"],
    "preferredSkills": ["Docker", "Kubernetes", "Redis", "AWS"],
    "minExperienceYears": 4,
    "requiredEducation": "Cử nhân hoặc Kỹ sư chuyên ngành Công nghệ thông tin",
    "responsibilities": [
      "Thiết kế kiến trúc backend",
      "Tối ưu truy vấn database"
    ],
    "seniorityLevel": "SENIOR"
  },
  "scoringWeights": {
    "w_skill": 0.35,
    "w_exp": 0.40,
    "w_edu": 0.10,
    "w_semantic": 0.15
  },
  "embedding": [0.0125, -0.0452, 0.0891, "...(128 hoặc 768 chiều)"],
  "status": "PUBLISHED",
  "createdAt": "2026-11-10T03:41:42.000Z",
  "updatedAt": "2026-11-10T03:41:42.000Z"
}
```

---

### 2.2. Xem Trước Tiêu Chí Bóc Tách (Preview JD Extraction)
* **Endpoint**: `POST /api/v1/jobs/parse-jd`
* **Mô tả**: Gửi văn bản JD thô để AI bóc tách thử nghiệm và gợi ý trọng số trước khi người dùng quyết định tạo tin tuyển dụng chính thức.

#### Request Body:
```json
{
  "rawDescription": "Cần tuyển Junior Frontend Developer 1 năm kinh nghiệm với React, HTML, CSS, JavaScript.",
  "jobTitle": "Junior Frontend Developer"
}
```

#### Response (`200 OK`):
```json
{
  "extractedCriteria": {
    "requiredSkills": ["React", "JavaScript", "HTML", "CSS"],
    "preferredSkills": ["TypeScript"],
    "minExperienceYears": 1,
    "requiredEducation": "Đại học hoặc Cao đẳng chuyên ngành CNTT",
    "responsibilities": ["Xây dựng giao diện web", "Phối hợp với Backend"],
    "seniorityLevel": "JUNIOR"
  },
  "suggestedWeights": {
    "w_semantic": 0.25,
    "w_skill": 0.40,
    "w_exp": 0.20,
    "w_edu": 0.15
  },
  "previewLength": 88
}
```

---

### 2.3. Lấy Danh Sách Tin Tuyển Dụng (Find All Jobs)
* **Endpoint**: `GET /api/v1/jobs`
* **Query Parameters**:
  - `page`: Số trang (mặc định 1).
  - `limit`: Số bản ghi mỗi trang (mặc định 10, tối đa 50).
  - `search`: Tìm kiếm theo từ khóa trong tiêu đề hoặc nội dung JD.
  - `department`: Lọc theo phòng ban.
  - `status`: Lọc theo trạng thái (`DRAFT`, `PUBLISHED`, `CLOSED`).
  - `employmentType`: `FULL_TIME`, `PART_TIME`, `CONTRACT`.

#### Response (`200 OK`):
```json
{
  "items": [
    {
      "_id": "6af2932de3d888b86732427a",
      "title": "Senior Backend Engineer (NestJS / Node.js)",
      "department": "Platform Engineering",
      "location": "Hà Nội / Hybrid",
      "employmentType": "FULL_TIME",
      "status": "PUBLISHED",
      "extractedCriteria": {
        "requiredSkills": ["NestJS", "Node.js", "TypeScript"],
        "minExperienceYears": 4,
        "seniorityLevel": "SENIOR"
      },
      "applicantCount": 12,
      "createdAt": "2026-11-10T03:41:42.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2.4. Xem Chi Tiết Tin Tuyển Dụng (Find One Job Details)
* **Endpoint**: `GET /api/v1/jobs/:id`
* **Tham số Path**: `id` (MongoDB ObjectId).
* **Response**: Toàn bộ thông tin tin tuyển dụng kèm đối tượng `applicantStats` thống kê số lượng ứng viên theo từng vòng trong phễu tuyển dụng (`NEW`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`).

---

### 2.5. Cập Nhật Tin Tuyển Dụng (Update Job)
* **Endpoint**: `PUT /api/v1/jobs/:id`
* **Mô tả**: Cập nhật tiêu đề, mô tả, phòng ban hoặc trọng số. Nếu cập nhật `rawDescription` và `reExtract !== false`, hệ thống tự động bóc tách lại tiêu chí và tái tạo vector embedding.

---

### 2.6. Chuyển Đổi Trạng Thái Nhanh (Update Status)
* **Endpoint**: `PATCH /api/v1/jobs/:id/status`
* **Request Body**:
  ```json
  {
    "status": "CLOSED" // "DRAFT" | "PUBLISHED" | "CLOSED"
  }
  ```

---

### 2.7. Xóa Tin Tuyển Dụng (Delete / Archive Job)
* **Endpoint**: `DELETE /api/v1/jobs/:id`
* **Quy tắc an toàn**:
  - Nếu Job **chưa có hồ sơ ứng tuyển nào**: Xóa vĩnh viễn khỏi CSDL.
  - Nếu Job **đã có ứng viên nộp hồ sơ**: Hệ thống tự động chuyển trạng thái sang `CLOSED` thay vì xóa để bảo toàn lịch sử dữ liệu ứng viên.

