# 📊 Tài Liệu Đặc Tả API Báo Cáo & Thống Kê Tuyển Dụng (Analytics & Dashboard API)

> **Dự án**: Smart HR & Candidate Screening System  
> **Phiên bản API**: `v1`  
> **Base URL**: `/api/v1/analytics`  
> **Mã yêu cầu SRS**: `[FR-REP-01]`

---

## 1. Tổng Quan Điểm Cuối (Endpoints Summary)

| Phương Thức | Đường Dẫn | Chức Năng | Quyền Hạn (RBAC) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/dashboard` | Lấy toàn bộ số liệu tổng quan tuyển dụng phục vụ hiển thị Dashboard & Biểu đồ | Recruiter, Admin |

---

## 2. Chi Tiết Điểm Cuối: Lấy Số Liệu Tổng Quan Dashboard (Recruitment Analytics)

* **Endpoint**: `GET /api/v1/analytics/dashboard`
* **Mô tả**: Trích xuất dữ liệu tổng hợp từ các bảng `Applications`, `Candidates`, `Jobs`, `ScreeningResults` để cung cấp số liệu cho các khối thẻ chỉ số (KPIs) và các loại biểu đồ trực quan (Funnel, Pie/Donut Chart, Bar Chart, Timeline Trend).

### 2.1. Query Parameters (`DashboardQueryDto`)

| Tham số | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `jobId` | `string` | Không | Lọc số liệu riêng cho một tin tuyển dụng cụ thể (VD: chỉ xem phễu và điểm số của tin Senior Backend) |
| `fromDate` | `string` (ISO 8601) | Không | Lọc các hồ sơ nộp từ ngày này (VD: `2026-11-01`) |
| `toDate` | `string` (ISO 8601) | Không | Lọc các hồ sơ nộp đến ngày này (VD: `2026-11-30`) |

---

### 2.2. Cấu Trúc Dữ Liệu Phản Hồi (`200 OK`)

```json
{
  "summary": {
    "totalApplications": 128,
    "totalCandidates": 115,
    "totalJobs": 12,
    "activeJobs": 8,
    "totalScreened": 120,
    "averageScore": 73.4
  },
  "pipelineDistribution": {
    "total": 128,
    "byStage": {
      "NEW": { "count": 28, "percentage": 21.9, "label": "Hồ sơ mới tiếp nhận" },
      "SCREENING": { "count": 15, "percentage": 11.7, "label": "Đang sàng lọc AI" },
      "SHORTLISTED": { "count": 35, "percentage": 27.3, "label": "Tiềm năng (Shortlisted)" },
      "INTERVIEW": { "count": 24, "percentage": 18.8, "label": "Vòng phỏng vấn" },
      "OFFER": { "count": 10, "percentage": 7.8, "label": "Đề nghị việc làm (Offer)" },
      "HIRED": { "count": 8, "percentage": 6.3, "label": "Đã tuyển dụng (Hired)" },
      "REJECTED": { "count": 8, "percentage": 6.3, "label": "Không phù hợp (Rejected)" }
    },
    "stagesList": [
      { "stage": "NEW", "label": "Hồ sơ mới tiếp nhận", "count": 28, "percentage": 21.9 },
      { "stage": "SCREENING", "label": "Đang sàng lọc AI", "count": 15, "percentage": 11.7 },
      { "stage": "SHORTLISTED", "label": "Tiềm năng (Shortlisted)", "count": 35, "percentage": 27.3 },
      { "stage": "INTERVIEW", "label": "Vòng phỏng vấn", "count": 24, "percentage": 18.8 },
      { "stage": "OFFER", "label": "Đề nghị việc làm (Offer)", "count": 10, "percentage": 7.8 },
      { "stage": "HIRED", "label": "Đã tuyển dụng (Hired)", "count": 8, "percentage": 6.3 },
      { "stage": "REJECTED", "label": "Không phù hợp (Rejected)", "count": 8, "percentage": 6.3 }
    ]
  },
  "scoreDistribution": {
    "totalScreened": 120,
    "averageScore": 73.4,
    "highestScore": 96.5,
    "lowestScore": 32.0,
    "below50": {
      "count": 18,
      "percentage": 15.0
    },
    "from50to75": {
      "count": 54,
      "percentage": 45.0
    },
    "above75": {
      "count": 48,
      "percentage": 40.0
    },
    "brackets": [
      {
        "bracket": "BELOW_50",
        "label": "Dưới 50% (Không phù hợp / Kém)",
        "min": 0,
        "max": 49.9,
        "count": 18,
        "percentage": 15.0,
        "color": "#EF4444"
      },
      {
        "bracket": "FROM_50_TO_75",
        "label": "50% - 75% (Tương thích trung bình / Tiềm năng)",
        "min": 50,
        "max": 75.0,
        "count": 54,
        "percentage": 45.0,
        "color": "#F59E0B"
      },
      {
        "bracket": "ABOVE_75",
        "label": "Trên 75% (Độ tương thích cao / Xuất sắc)",
        "min": 75.1,
        "max": 100,
        "count": 48,
        "percentage": 40.0,
        "color": "#10B981"
      }
    ]
  },
  "topSkillGaps": [
    {
      "skill": "Kubernetes",
      "missingCount": 62,
      "percentage": 51.7
    },
    {
      "skill": "AWS Cloud",
      "missingCount": 45,
      "percentage": 37.5
    },
    {
      "skill": "Redis",
      "missingCount": 38,
      "percentage": 31.7
    },
    {
      "skill": "Kafka",
      "missingCount": 32,
      "percentage": 26.7
    },
    {
      "skill": "Microservices Architecture",
      "missingCount": 28,
      "percentage": 23.3
    }
  ],
  "jobBreakdown": [
    {
      "jobId": "6af2932de3d888b86732427a",
      "jobTitle": "Senior Backend Engineer (NestJS / Node.js)",
      "applicantCount": 58,
      "averageScore": 76.5
    },
    {
      "jobId": "6af2932de3d888b86732427b",
      "jobTitle": "Lead DevOps / SRE Engineer",
      "applicantCount": 42,
      "averageScore": 68.2
    }
  ],
  "timelineTrend": [
    { "date": "2026-11-01", "count": 12 },
    { "date": "2026-11-02", "count": 18 },
    { "date": "2026-11-03", "count": 25 }
  ]
}
```

---

## 3. Bản Đồ Ánh Xạ Với Giao Diện Người Dùng (UI Mapping)

| Thành phần JSON | Loại Widget trên Frontend | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| `summary` | **Metric Cards / KPI Badges** | Hiển thị 4 thẻ thông số trên cùng màn hình (Tổng hồ sơ, Ứng viên, Điểm trung bình, Vị trí đang tuyển). |
| `pipelineDistribution` | **Funnel Chart / Kanban Pipeline** | Biểu đồ phễu chuyển đổi tuyển dụng từ lúc nộp hồ sơ (`NEW`) đến khi tuyển dụng thành công (`HIRED`). |
| `scoreDistribution` | **Donut / Radial Bar Chart** | Biểu đồ tròn hiển thị 3 phân khúc chất lượng ứng viên (<50%, 50-75%, >75%). |
| `topSkillGaps` | **Horizontal Bar Chart** | Biểu đồ thanh ngang hiển thị 5 kỹ năng thiếu hụt nhiều nhất, giúp HR điều chỉnh chiến lược đào tạo hoặc JD. |
| `timelineTrend` | **Line / Area Chart** | Biểu đồ xu hướng số lượng hồ sơ tiếp nhận theo thời gian. |

