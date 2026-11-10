# 👥 Tài Liệu Đặc Tả API Quản Lý Hồ Sơ & Pipeline Ứng Viên (Candidates & Pipeline API)

> **Dự án**: Smart HR & Candidate Screening System  
> **Phiên bản API**: `v1`  
> **Base URL**: `/api/v1/candidates`  
> **Mã yêu cầu SRS**: `[FR-CAN-01]`, `[FR-CAN-02]`, `[FR-CAN-03]`, `[FR-PIP-01]`

---

## 1. Tổng Quan Các Điểm Cuối (Endpoints Summary)

| Phương Thức | Đường Dẫn | Chức Năng | Quyền Hạn (RBAC) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/candidates` | Lấy danh sách ứng viên (Phân trang, tìm kiếm họ tên/email, lọc theo kỹ năng, trạng thái phễu, vị trí, điểm số) | Recruiter, Admin |
| `GET` | `/api/v1/candidates/:id` | Xem chi tiết hồ sơ ứng viên (Kèm CV đã bóc tách, lịch sử ứng tuyển & điểm số AI Screening) | Recruiter, Admin |
| `POST` | `/api/v1/candidates` | Tạo mới hoặc khử trùng lặp hồ sơ ứng viên theo email | Recruiter, Admin |
| `PUT` | `/api/v1/candidates/:id` | Cập nhật thông tin ứng viên (họ tên, liên hệ, chức danh, cờ ẩn danh `anonymized`) | Recruiter, Admin |
| `PATCH` | `/api/v1/candidates/:id/status` | Chuyển trạng thái tuyển dụng Kanban (`NEW` $\rightarrow$ `SCREENING` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW` $\rightarrow$ `HIRED` / `REJECTED`) | Recruiter, Admin |
| `DELETE` | `/api/v1/candidates/:id` | Xóa hồ sơ ứng viên và dọn dẹp các bản ghi liên quan | Admin |

---

## 2. Chi Tiết Từng Điểm Cuối (Detailed Specifications)

### 2.1. Lấy Danh Sách Ứng Viên & Lọc Đa Tiêu Chí
* **Endpoint**: `GET /api/v1/candidates`
* **Mô tả**: Truy xuất danh sách ứng viên từ MongoDB, tự động tổng hợp thông tin từ CV mới nhất (chức danh, số năm kinh nghiệm, kỹ năng) và điểm số matching AI.

#### Query Parameters (`QueryCandidateDto`):
| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `page` | `number` | `1` | Trang hiện tại (1-based index) |
| `limit` | `number` | `10` | Số lượng bản ghi trên một trang (tối đa 100) |
| `search` | `string` | *(optional)* | Từ khóa tìm kiếm theo họ tên, email hoặc số điện thoại |
| `skill` | `string` | *(optional)* | Lọc ứng viên sở hữu kỹ năng cụ thể (khớp trong `parsedData.skills.technical`) |
| `status` | `string` | *(optional)* | Lọc theo trạng thái pipeline (`NEW`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `HIRED`, `REJECTED`) |
| `jobId` | `string` | *(optional)* | Lọc ứng viên nộp cho một tin tuyển dụng cụ thể |
| `minScore` | `number` | *(optional)* | Điểm matching tối thiểu (từ 0 đến 100) |

#### Response (`200 OK`):
```json
{
  "items": [
    {
      "_id": "673199bc48e3d81b95324201",
      "fullName": "Nguyễn Thành Nam",
      "email": "nam.nguyen@example.com",
      "phone": "0901234567",
      "location": "Hà Nội",
      "currentTitle": "Lead Software Architect",
      "summary": "5+ năm kinh nghiệm phát triển hệ thống backend phân tán...",
      "skills": ["NestJS", "TypeScript", "MongoDB", "Docker"],
      "totalYearsExperience": 5,
      "status": "SHORTLISTED",
      "appliedJob": {
        "id": "6af2932de3d888b86732427a",
        "title": "Senior Backend Engineer",
        "department": "Platform Engineering"
      },
      "matchScore": 94.5,
      "screeningBreakdown": {
        "skillScore": 95,
        "expScore": 100,
        "eduScore": 90
      },
      "cvFileUrl": "/uploads/cvs/nam_cv.pdf",
      "createdAt": "2026-11-10T03:48:30.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2.2. Xem Chi Tiết Hồ Sơ Ứng Viên (Candidate 360° Profile)
* **Endpoint**: `GET /api/v1/candidates/:id`
* **Mô tả**: Trả về bức tranh toàn cảnh về ứng viên: thông tin cá nhân, toàn bộ dữ liệu CV đã bóc tách (kỹ năng, kinh nghiệm công tác, dự án, học vấn), các tập tin CV đính kèm và lịch sử ứng tuyển kèm điểm số AI Screening Radar.

#### Response (`200 OK`):
```json
{
  "_id": "673199bc48e3d81b95324201",
  "id": "673199bc48e3d81b95324201",
  "fullName": "Nguyễn Thành Nam",
  "email": "nam.nguyen@example.com",
  "phone": "0901234567",
  "location": "Hà Nội",
  "currentTitle": "Lead Software Architect",
  "summary": "5+ năm kinh nghiệm phát triển hệ thống backend...",
  "anonymized": false,
  "parsedProfile": {
    "totalYearsExperience": 5,
    "skills": {
      "technical": ["NestJS", "TypeScript", "MongoDB", "Docker"],
      "soft": ["Leadership", "Problem Solving"]
    },
    "workExperience": [
      {
        "company": "TechCorp Vietnam",
        "role": "Senior Backend Lead",
        "startDate": "2022-01",
        "endDate": "Present",
        "description": "Chịu trách nhiệm kiến trúc microservices và phân phối dữ liệu lớn."
      }
    ],
    "projects": [
      {
        "title": "High-Throughput Payment Engine",
        "technologies": ["NestJS", "MongoDB", "Kafka"]
      }
    ],
    "education": [
      {
        "degree": "Kỹ sư",
        "fieldOfStudy": "Công nghệ thông tin",
        "school": "Đại học Bách Khoa Hà Nội"
      }
    ]
  },
  "cvs": [
    {
      "id": "673199bc48e3d81b95324202",
      "fileName": "Nguyen_Thanh_Nam_CV.pdf",
      "fileUrl": "/uploads/cvs/nam_cv.pdf",
      "fileSize": 102400,
      "uploadedAt": "2026-11-10T03:48:30.000Z"
    }
  ],
  "applications": [
    {
      "id": "673199bc48e3d81b95324203",
      "job": {
        "_id": "6af2932de3d888b86732427a",
        "title": "Senior Backend Engineer",
        "department": "Platform Engineering",
        "location": "Hà Nội / Hybrid",
        "employmentType": "FULL_TIME"
      },
      "candidateStatus": "SHORTLISTED",
      "aiPipelineStatus": "COMPLETED",
      "matchScore": 94.5,
      "screeningResults": {
        "skillMatchScore": 95,
        "experienceMatchScore": 100,
        "educationMatchScore": 90,
        "detailedMatching": [
          { "skill": "NestJS", "score": 1.0, "type": "EXACT" }
        ],
        "aiRationale": {
          "summary": "Ứng viên xuất sắc, vượt trội về số năm kinh nghiệm và kiến trúc NestJS."
        }
      },
      "appliedAt": "2026-11-10T03:48:30.000Z"
    }
  ],
  "createdAt": "2026-11-10T03:48:30.000Z",
  "updatedAt": "2026-11-10T03:48:30.000Z"
}
```

---

### 2.3. Tạo Mới Hoặc Khử Trùng Lặp Ứng Viên (Create / Deduplicate)
* **Endpoint**: `POST /api/v1/candidates`
* **Mô tả**: Tạo hồ sơ ứng viên mới. Nếu email đã tồn tại trong CSDL, hệ thống tự động trả về hồ sơ hiện hữu, tránh sinh bản ghi rác.

#### Request Body (`CreateCandidateDto`):
```json
{
  "fullName": "Lê Thu Trang",
  "email": "trang.le@example.com",
  "phone": "0912345678",
  "location": "TP. Hồ Chí Minh",
  "currentTitle": "Junior Frontend Developer",
  "summary": "1 năm kinh nghiệm phát triển giao diện React và Next.js"
}
```

#### Response (`201 Created`):
```json
{
  "_id": "673199bc48e3d81b95324209",
  "fullName": "Lê Thu Trang",
  "email": "trang.le@example.com",
  "phone": "0912345678",
  "location": "TP. Hồ Chí Minh",
  "currentTitle": "Junior Frontend Developer",
  "summary": "1 năm kinh nghiệm phát triển giao diện React và Next.js",
  "anonymized": false,
  "createdAt": "2026-11-10T03:49:00.000Z",
  "updatedAt": "2026-11-10T03:49:00.000Z"
}
```

---

### 2.4. Cập Nhật Hồ Sơ Ứng Viên (Update Profile & Anonymize)
* **Endpoint**: `PUT /api/v1/candidates/:id`
* **Mô tả**: Cho phép cập nhật thông tin cá nhân và bật chế độ ẩn danh (`anonymized: true`) nhằm phục vụ sàng lọc không thiên vị (Blind Screening).

#### Request Body (`UpdateCandidateDto`):
```json
{
  "location": "Đà Nẵng / Remote",
  "anonymized": true
}
```

---

### 2.5. Chuyển Trạng Thái Tuyển Dụng (Kanban Pipeline Transition)
* **Endpoint**: `PATCH /api/v1/candidates/:id/status`
* **Mô tả**: Cập nhật trạng thái ứng viên trong quy trình tuyển dụng (đồng bộ trực tiếp sang bảng `Applications`).

#### Request Body (`UpdateCandidateStatusDto`):
```json
{
  "status": "INTERVIEW",
  "jobId": "6af2932de3d888b86732427a",
  "note": "Ứng viên vượt qua vòng sàng lọc sơ bộ, chuyển sang phỏng vấn kỹ thuật"
}
```

#### Giá trị hợp lệ cho `status`:
- `NEW`: Hồ sơ mới tiếp nhận.
- `SCREENING`: Đang trong tiến trình chấm điểm AI.
- `SHORTLISTED`: Đạt điểm chuẩn và vào danh sách tiềm năng.
- `INTERVIEW`: Đang tiến hành phỏng vấn trực tiếp.
- `HIRED`: Đã nhận việc thành công.
- `REJECTED`: Không phù hợp với tiêu chí tuyển dụng.

#### Response (`200 OK`):
```json
{
  "message": "Đã cập nhật trạng thái ứng viên thành công sang INTERVIEW",
  "candidateId": "673199bc48e3d81b95324201",
  "applicationId": "673199bc48e3d81b95324203",
  "status": "INTERVIEW"
}
```

---

### 2.6. Xóa Hồ Sơ Ứng Viên (Delete Candidate)
* **Endpoint**: `DELETE /api/v1/candidates/:id`
* **Mô tả**: Xóa hồ sơ ứng viên khỏi hệ thống, đồng thời xóa cascade toàn bộ các bản ghi `Applications` liên quan.

#### Response (`200 OK`):
```json
{
  "message": "Đã xóa hồ sơ ứng viên thành công",
  "deletedCandidateId": "673199bc48e3d81b95324201"
}
```

