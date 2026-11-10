# 🎤 Tài Liệu Đặc Tả API Khởi Tạo Câu Hỏi Phỏng Vấn (AI Interview Generation API)

> **Dự án**: Smart HR & Candidate Screening System  
> **Phiên bản API**: `v1`  
> **Base URL**: `/api/v1/interviews`  
> **Mã yêu cầu SRS**: `[FR-INT-01]`, `[FR-INT-02]`, `[FR-INT-03]`

---

## 1. Tổng Quan Các Điểm Cuối (Endpoints Summary)

| Phương Thức | Đường Dẫn | Chức Năng | Quyền Hạn (RBAC) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/interviews/generate` | Sinh bộ câu hỏi phỏng vấn RAG theo hồ sơ & JD | Recruiter, Admin |
| `GET` | `/api/v1/interviews/application/:applicationId` | Lấy danh sách câu hỏi theo mã hồ sơ ứng tuyển | Recruiter, Admin, Hiring Manager |
| `GET` | `/api/v1/interviews/:id` | Lấy chi tiết bộ câu hỏi theo Document ID | Recruiter, Admin, Hiring Manager |
| `PUT` | `/api/v1/interviews/:id` | Chỉnh sửa, đánh dấu REVIEWED, chấm điểm thực tế | Recruiter, Admin, Hiring Manager |
| `POST` | `/api/v1/interviews/:id/export` | Xuất phiếu câu hỏi ra Markdown / Text / JSON | Recruiter, Admin, Hiring Manager |
| `GET` | `/api/v1/interviews/question-bank/templates` | Tra cứu câu hỏi mẫu trong Domain Question Bank | Recruiter, Admin |

---

## 2. Chi Tiết Từng Điểm Cuối (Detailed Specifications)

### 2.1. Khởi Tạo Bộ Câu Hỏi Phỏng Vấn (Generate Questions)
* **Endpoint**: `POST /api/v1/interviews/generate`
* **Mô tả**: Tự động tổng hợp dữ liệu CV, Job Description, kết quả sàng lọc (Skill Gaps) và truy xuất ngân hàng câu hỏi mẫu (Domain Question Bank) để LLM sinh bộ câu hỏi phân loại 4 nhóm có kèm bareme chấm điểm 3 mức.
* **Cơ chế Caching**: Nếu hồ sơ ứng tuyển đã có bộ câu hỏi và `regenerate: false`, hệ thống tự động trả về kết quả đã cache (`isCached: true`) giúp tiết kiệm token.

#### Request Body (`GenerateInterviewDto`):
```json
{
  "applicationId": "6af28c2b90b0f00745a5e437",
  "candidateId": "6af28c2b90b0f00745a5e438",
  "jobId": "6af28c2b90b0f00745a5e439",
  "focusAreas": ["NestJS Architecture", "Database Performance"],
  "numQuestions": 6,
  "targetDifficulty": "MEDIUM",
  "regenerate": false
}
```

#### Response Success (`201 Created` / `200 OK`):
```json
{
  "id": "6af28c2b90b0f00745a5e440",
  "applicationId": "6af28c2b90b0f00745a5e437",
  "candidateId": "6af28c2b90b0f00745a5e438",
  "jobId": "6af28c2b90b0f00745a5e439",
  "status": "GENERATED",
  "isCached": false,
  "questions": [
    {
      "id": "q-1",
      "category": "CLARIFICATION",
      "question": "Trong dự án Micro-Payment Gateway mà bạn đảm nhận vai trò Backend Tech Lead, bạn có thể nêu rõ giải pháp kỹ thuật lớn nhất do chính bạn khởi xướng là gì?",
      "purpose": "Xác minh sự đóng góp thực tế và vai trò chủ động trong dự án.",
      "difficulty": "MEDIUM",
      "relatedSkill": "System Architecture",
      "contextFromCV": "Dự án Micro-Payment Gateway được liệt kê trong CV ứng viên",
      "expectedKeyPoints": [
        "Ranh giới phân công công việc cụ thể",
        "Quyết định kỹ thuật tự khởi xướng",
        "Kết quả nghiệm thu thực tế"
      ],
      "sampleRubric": {
        "poor": "Chỉ trả lời chung chung theo team, không rõ phần mình làm.",
        "acceptable": "Nêu được module và API do mình tự tay code.",
        "excellent": "Trình bày mạch lạc từ thiết kế đến số liệu đo lường kết quả."
      }
    },
    {
      "id": "q-2",
      "category": "TECHNICAL_DEEP_DIVE",
      "question": "Với kinh nghiệm sử dụng NestJS, bạn tổ chức Dependency Injection và xử lý Exception Filters thế nào khi có lỗi bất đồng bộ?",
      "purpose": "Đánh giá mức độ am hiểu chuyên sâu về kiến trúc NestJS.",
      "difficulty": "HARD",
      "relatedSkill": "NestJS",
      "contextFromCV": "Kỹ năng NestJS được ứng viên khẳng định thành thạo trong CV",
      "expectedKeyPoints": [
        "Inversion of Control và Custom Providers",
        "Cách bắt lỗi bằng Global Exception Filters"
      ],
      "sampleRubric": {
        "poor": "Chỉ tạo controller cơ bản, chưa hiểu rõ DI.",
        "acceptable": "Biết cấu hình Module, Controller và Exception Filter chuẩn.",
        "excellent": "Hiểu Dynamic Modules, Scope (REQUEST) và Transaction đa tầng."
      }
    },
    {
      "id": "q-3",
      "category": "SKILL_GAP",
      "question": "Vị trí này yêu cầu Docker nhưng CV của bạn chưa nêu nhiều về container. Bạn có thể chia sẻ kiến thức nền tảng và kế hoạch học hỏi nhanh công nghệ này?",
      "purpose": "Đánh giá khả năng tự học và mức độ hiểu biết cơ bản về kỹ năng còn thiếu.",
      "difficulty": "MEDIUM",
      "relatedSkill": "Docker",
      "contextFromCV": "Kỹ năng Docker bị đánh dấu MISSING trong bước sàng lọc",
      "expectedKeyPoints": [
        "Khái niệm cô lập tài nguyên Container vs VM",
        "Ý nghĩa file docker-compose.yml",
        "Thái độ sẵn sàng học hỏi"
      ],
      "sampleRubric": {
        "poor": "Không phân biệt được Docker với VM thông thường.",
        "acceptable": "Nêu được Docker nhẹ hơn vì dùng chung OS kernel.",
        "excellent": "Nắm vững bản chất kernel isolation và có lộ trình học cụ thể."
      }
    },
    {
      "id": "q-4",
      "category": "BEHAVIORAL_STAR",
      "question": "Hãy kể lại một sự cố sập server hoặc nghẽn database trên môi trường Production mà bạn trực tiếp tham gia xử lý theo mô hình STAR?",
      "purpose": "Đánh giá khả năng kiểm soát áp lực và quy trình Incident Management.",
      "difficulty": "HARD",
      "relatedSkill": "Incident Management",
      "contextFromCV": "Ứng viên có 4 năm kinh nghiệm làm việc thực tế",
      "expectedKeyPoints": [
        "Situation & Task: Bối cảnh sự cố và ưu tiên khôi phục",
        "Action: Quy trình điều tra root cause bằng logs/metrics",
        "Result: Thời gian phục hồi và tài liệu Post-mortem"
      ],
      "sampleRubric": {
        "poor": "Hoảng loạn đổ lỗi, không có quy trình điều tra log.",
        "acceptable": "Kể được sự cố thực tế và biết rollback nhanh chóng.",
        "excellent": "Áp dụng xuất sắc mô hình STAR, có số liệu MTTR và Post-mortem bài bản."
      }
    }
  ],
  "metadata": {
    "totalQuestions": 6,
    "categoriesCount": {
      "CLARIFICATION": 1,
      "TECHNICAL_DEEP_DIVE": 2,
      "SKILL_GAP": 1,
      "BEHAVIORAL_STAR": 2
    },
    "retrievedTemplatesUsed": 5,
    "generatedAt": "2026-11-10T03:14:51.000Z"
  }
}
```

---

### 2.2. Lấy Câu Hỏi Theo Hồ Sơ Ứng Tuyển (Get By Application ID)
* **Endpoint**: `GET /api/v1/interviews/application/:applicationId`
* **Tham số Path**: `applicationId` (MongoDB ObjectId).
* **Response**: Toàn bộ đối tượng câu hỏi phỏng vấn đã lưu. Trả về `404 Not Found` nếu chưa khởi tạo.

---

### 2.3. Cập Nhật Câu Hỏi / Human-In-The-Loop (Update Questions & Scoring)
* **Endpoint**: `PUT /api/v1/interviews/:id`
* **Mô tả**: Cho phép Recruiter / Interviewer chỉnh sửa câu hỏi, thay đổi độ khó, chấm điểm thực tế (1–5đ) và ghi chú nhận xét trong quá trình phỏng vấn.

#### Request Body (`UpdateInterviewQuestionsDto`):
```json
{
  "status": "REVIEWED",
  "questions": [
    {
      "id": "q-1",
      "category": "CLARIFICATION",
      "question": "Trong dự án Micro-Payment Gateway bạn làm giải pháp gì nổi bật?",
      "purpose": "Xác minh đóng góp thực tế.",
      "difficulty": "MEDIUM",
      "expectedKeyPoints": ["Ranh giới công việc", "Kết quả thực tế"],
      "sampleRubric": {
        "poor": "Chung chung.",
        "acceptable": "Nêu rõ module.",
        "excellent": "Trình bày sâu sắc."
      },
      "scoreGiven": 4,
      "notes": "Ứng viên trình bày rất tự tin và mạch lạc về kiến trúc."
    }
  ]
}
```

#### Response (`200 OK`):
```json
{
  "message": "Interview questions updated successfully",
  "id": "6af28c2b90b0f00745a5e440",
  "status": "REVIEWED",
  "questionsCount": 6
}
```

---

### 2.4. Xuất Phiếu Phỏng Vấn (Export Interview Sheet)
* **Endpoint**: `POST /api/v1/interviews/:id/export`
* **Request Body**:
  ```json
  {
    "format": "markdown" // "markdown" | "text" | "json"
  }
  ```
* **Response Format**:
  - `markdown`: Trả về tài liệu Markdown chuẩn hóa có tiêu đề, checkbox tiêu chí đánh giá và bảng Rubric 3 mức.
  - `text`: Trả về văn bản định dạng phân đoạn Plain Text.
  - `json`: Trả về cấu trúc JSON thuần túy.

---

### 2.5. Tra Cứu Ngân Hàng Câu Hỏi Mẫu (Search Question Bank Templates)
* **Endpoint**: `GET /api/v1/interviews/question-bank/templates`
* **Query Parameters**:
  - `skills`: Danh sách kỹ năng cách nhau bởi dấu phẩy (ví dụ: `NestJS,Docker`).
  - `category`: `CLARIFICATION` | `TECHNICAL_DEEP_DIVE` | `SKILL_GAP` | `BEHAVIORAL_STAR`.
  - `limit`: Số lượng kết quả tối đa (mặc định 10).
* **Response**: Mảng các câu hỏi mẫu cùng bareme chấm điểm được xếp hạng theo độ tương đồng.

