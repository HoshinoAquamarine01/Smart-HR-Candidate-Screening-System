# 📋 Tài Liệu Đặc Tả API Đơn Ứng Tuyển & Bảng Điều Khiển Kanban (Applications & Kanban API)

> **Dự án**: Smart HR & Candidate Screening System  
> **Phiên bản API**: `v1`  
> **Base URL**: `/api/v1/applications`  
> **Mã yêu cầu SRS**: `[FR-CAND-03]`, `[FR-PIP-01]`

---

## 1. Tổng Quan Các Điểm Cuối (Endpoints Summary)

| Phương Thức | Đường Dẫn | Chức Năng | Quyền Hạn (RBAC) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/applications/kanban` | Lấy dữ liệu bảng Kanban phân nhóm theo 7 cột trạng thái | Recruiter, Admin |
| `GET` | `/api/v1/applications` | Lấy danh sách đơn ứng tuyển (Lọc theo tin tuyển dụng, ứng viên, trạng thái, điểm số, tìm kiếm) | Recruiter, Admin |
| `GET` | `/api/v1/applications/:id` | Xem chi tiết đơn ứng tuyển (kèm ứng viên, JD, CV, radar điểm AI và lịch sử kiểm toán) | Recruiter, Admin |
| `POST` | `/api/v1/applications` | Nộp đơn ứng tuyển (Tự động kiểm tra khử trùng lặp theo `candidateId` + `jobId`) | Recruiter, Admin, Candidate |
| `PATCH` | `/api/v1/applications/:id/status` | **Kéo thả / đổi trạng thái ứng viên giữa các cột Kanban (Audit Trail)** | Recruiter, Admin |
| `DELETE` | `/api/v1/applications/:id` | Xóa đơn ứng tuyển và dọn dẹp cascade kết quả screening liên quan | Admin |

---

## 2. Chi Tiết Từng Điểm Cuối (Detailed Specifications)

### 2.1. Đổi Trạng Thái Ứng Viên Trên Bảng Kanban (Kanban Drag-and-Drop)
* **Endpoint**: `PATCH /api/v1/applications/:id/status`
* **Mô tả**: Cho phép Recruiter kéo/thả ứng viên giữa các cột trên bảng Kanban hoặc phê duyệt/từ chối hồ sơ. Mọi lần thay đổi đều được ghi nhận vào nhật ký kiểm toán `recruiterDecision.history` kèm thời gian, người thực hiện, lý do hoặc thông tin thư mời việc.

#### Request Body (`UpdateApplicationStatusDto`):
```json
{
  "status": "OFFER",
  "note": "Ứng viên trả lời phỏng vấn xuất sắc, gửi thư mời nhận việc",
  "decidedBy": "Nguyễn Văn A (HR Manager)",
  "offerDetails": {
    "salaryGross": 45000000,
    "currency": "VND",
    "startDate": "2026-12-01",
    "probationMonths": 2
  }
}
```

#### Các giá trị hợp lệ cho `status` (`CandidateStatus`):
| Trạng thái | Ý nghĩa trên bảng Kanban | Ghi chú hành động |
| :--- | :--- | :--- |
| `NEW` | Cột 1: Hồ sơ mới tiếp nhận | Trạng thái mặc định khi nộp hồ sơ |
| `SCREENING` | Cột 2: Đang sàng lọc AI | Worker AI đang bóc tách và tính điểm matching |
| `SHORTLISTED` | Cột 3: Tiềm năng | Hồ sơ đạt điểm ngưỡng và lọt vào danh sách xem xét |
| `INTERVIEW` | Cột 4: Mời phỏng vấn | Đang lên lịch hoặc thực hiện phỏng vấn (Tuần 12 RAG) |
| `OFFER` | Cột 5: Đề nghị việc làm | Gửi thư mời việc (kèm lương thưởng, ngày đi làm) |
| `HIRED` | Cột 6: Đã tuyển dụng | Ứng viên chấp nhận offer và ký hợp đồng thành công |
| `REJECTED` | Cột 7: Từ chối | Không phù hợp tiêu chí (lưu lý do từ chối vào `reason`) |

#### Response (`200 OK`):
```json
{
  "message": "Cập nhật trạng thái ứng viên thành công sang OFFER",
  "applicationId": "6af2960fbda346d5651d0bae",
  "candidateStatus": "OFFER",
  "previousStatus": "INTERVIEW",
  "recruiterDecision": {
    "currentStatus": "OFFER",
    "previousStatus": "INTERVIEW",
    "lastUpdated": "2026-11-10T03:57:00.000Z",
    "note": "Ứng viên trả lời phỏng vấn xuất sắc, gửi thư mời nhận việc",
    "decidedBy": "Nguyễn Văn A (HR Manager)",
    "offerDetails": {
      "salaryGross": 45000000,
      "currency": "VND",
      "startDate": "2026-12-01"
    },
    "history": [
      {
        "fromStatus": "NEW",
        "toStatus": "SCREENING",
        "timestamp": "2026-11-10T03:55:00.000Z",
        "decidedBy": "AI Worker"
      },
      {
        "fromStatus": "SCREENING",
        "toStatus": "SHORTLISTED",
        "timestamp": "2026-11-10T03:55:30.000Z",
        "decidedBy": "Recruiter"
      },
      {
        "fromStatus": "SHORTLISTED",
        "toStatus": "INTERVIEW",
        "timestamp": "2026-11-10T03:56:00.000Z",
        "decidedBy": "HR Manager"
      },
      {
        "fromStatus": "INTERVIEW",
        "toStatus": "OFFER",
        "timestamp": "2026-11-10T03:57:00.000Z",
        "note": "Ứng viên trả lời phỏng vấn xuất sắc, gửi thư mời nhận việc",
        "decidedBy": "Nguyễn Văn A (HR Manager)",
        "offerDetails": {
          "salaryGross": 45000000,
          "currency": "VND",
          "startDate": "2026-12-01"
        }
      }
    ]
  },
  "updatedAt": "2026-11-10T03:57:00.000Z"
}
```

---

### 2.2. Lấy Dữ Liệu Bảng Kanban (Get Kanban Board)
* **Endpoint**: `GET /api/v1/applications/kanban?jobId=...`
* **Mô tả**: Trả về dữ liệu sẵn sàng hiển thị trên giao diện Kanban Board gồm 7 cột. Mỗi cột chứa tổng số lượng thẻ và danh sách các thẻ ứng viên kèm điểm số matching AI.

#### Query Parameters:
| Tham số | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `jobId` | `string` | Không | Nếu truyền vào, chỉ hiển thị phễu ứng viên của tin tuyển dụng đó |

#### Response (`200 OK`):
```json
{
  "jobId": "6af2932de3d888b86732427a",
  "totalApplications": 2,
  "columns": [
    {
      "id": "NEW",
      "title": "Hồ sơ mới (New)",
      "count": 0,
      "cards": []
    },
    {
      "id": "SCREENING",
      "title": "Đang sàng lọc (Screening)",
      "count": 0,
      "cards": []
    },
    {
      "id": "SHORTLISTED",
      "title": "Tiềm năng (Shortlisted)",
      "count": 0,
      "cards": []
    },
    {
      "id": "INTERVIEW",
      "title": "Phỏng vấn (Interview)",
      "count": 0,
      "cards": []
    },
    {
      "id": "OFFER",
      "title": "Đề nghị việc làm (Offer)",
      "count": 0,
      "cards": []
    },
    {
      "id": "HIRED",
      "title": "Đã tuyển dụng (Hired)",
      "count": 1,
      "cards": [
        {
          "applicationId": "6af2960fbda346d5651d0bae",
          "candidateId": "6af295f00f4a0edc71f5f3e1",
          "candidateName": "Hoàng Minh Tuấn",
          "candidateEmail": "tuan.hoang@example.com",
          "candidateTitle": "Senior Fullstack Engineer",
          "jobId": "6af2932de3d888b86732427a",
          "jobTitle": "Senior NestJS / TypeScript Backend Engineer",
          "jobDepartment": "Engineering",
          "cvFileName": "Hoang_Minh_Tuan_CV.pdf",
          "matchScore": 92.5,
          "aiPipelineStatus": "COMPLETED",
          "appliedAt": "2026-11-10T03:55:00.000Z",
          "lastNote": "Ứng viên đã ký kết hợp đồng thử việc chính thức"
        }
      ]
    },
    {
      "id": "REJECTED",
      "title": "Từ chối (Rejected)",
      "count": 1,
      "cards": [
        {
          "applicationId": "6af2960fbda346d5651d0baf",
          "candidateId": "6af295f00f4a0edc71f5f3e2",
          "candidateName": "Đặng Ngọc Lan",
          "candidateEmail": "lan.dang@example.com",
          "candidateTitle": "DevOps / Cloud Specialist",
          "matchScore": 65.0,
          "appliedAt": "2026-11-10T03:55:10.000Z",
          "lastNote": "Kinh nghiệm chưa đủ 4 năm theo yêu cầu Senior"
        }
      ]
    }
  ]
}
```

---

### 2.3. Lấy Danh Sách Đơn Ứng Tuyển & Lọc Đa Tiêu Chí
* **Endpoint**: `GET /api/v1/applications`
* **Query Parameters**:
  - `jobId`: Lọc theo tin tuyển dụng
  - `candidateId`: Lọc theo ứng viên
  - `status`: Lọc theo trạng thái (`NEW`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`)
  - `aiPipelineStatus`: Lọc theo tiến trình AI (`UPLOADED`, `PARSING`, `MATCHING`, `SCORING`, `COMPLETED`, `FAILED`)
  - `search`: Tìm kiếm theo họ tên hoặc email ứng viên
  - `minScore`: Lọc điểm số matching tối thiểu
  - `page`, `limit`: Phân trang

---

### 2.4. Nộp Đơn Ứng Tuyển (Submit Application)
* **Endpoint**: `POST /api/v1/applications`
* **Mô tả**: Tạo đơn ứng tuyển mới. Nếu ứng viên đã nộp cho tin tuyển dụng này trước đó, hệ thống tự động trả về đơn hiện hữu (khử trùng lặp).

#### Request Body (`CreateApplicationDto`):
```json
{
  "candidateId": "6af295f00f4a0edc71f5f3e1",
  "jobId": "6af2932de3d888b86732427a",
  "cvId": "6af295f00f4a0edc71f5f3e4"
}
```

---

### 2.5. Xem Chi Tiết Đơn Ứng Tuyển (Application 360° Detail)
* **Endpoint**: `GET /api/v1/applications/:id`
* **Mô tả**: Trả về dữ liệu đơn ứng tuyển kèm thông tin đầy đủ về hồ sơ ứng viên, mô tả công việc, file CV, báo cáo chấm điểm AI Screening và toàn bộ nhật ký thay đổi trạng thái.

---

### 2.6. Xóa Đơn Ứng Tuyển (Delete Application)
* **Endpoint**: `DELETE /api/v1/applications/:id`
* **Mô tả**: Xóa đơn ứng tuyển và tự động dọn dẹp các bản ghi `ScreeningResults` liên quan trong CSDL.

