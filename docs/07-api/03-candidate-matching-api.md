# 🎯 Đặc Tả API So Khớp & Phỏng Vấn (Screening & Interview API)

> **Dự án**: Smart HR & Candidate Screening System  
> **Module**: `ScreeningModule`, `InterviewsModule`, `AssessmentsModule`  

---

## 1. Chấm Điểm So Khớp CV với JD (Screening Fit Score)

- **Endpoint**: `POST /api/v1/screening/match`
- **Headers**: `Authorization: Bearer <access_token>`
- **Mô tả**: Tính toán mức độ tương thích giữa một CV và một vị trí tuyển dụng (JD).

### Request Body:
```json
{
  "cvId": "671b5a20e4b02540c1123456",
  "jobId": "671b6010e4b02540c1129999"
}
```

### Phản Hồi Thành Công (HTTP 200 OK):
```json
{
  "statusCode": 200,
  "data": {
    "totalScore": 91,
    "breakdown": {
      "skillScore": 95,
      "experienceScore": 88,
      "domainScore": 90
    },
    "skillAnalysis": {
      "matchedSkills": ["TypeScript", "NestJS", "MongoDB", "Docker"],
      "missingMustHave": [],
      "missingNiceToHave": ["Kubernetes"]
    },
    "rationale": "Ứng viên rất mạnh về Backend NestJS, đáp ứng trọn vẹn yêu cầu công việc. Cần kiểm tra thêm về quy mô triển khai hạ tầng."
  }
}
```

---

## 2. Sinh Bộ Câu Hỏi Phỏng Vấn Thích Ứng

- **Endpoint**: `POST /api/v1/interviews/generate-questions`
- **Headers**: `Authorization: Bearer <access_token>`

### Request Body:
```json
{
  "candidateId": "671b5a20e4b02540c1123457",
  "jobId": "671b6010e4b02540c1129999",
  "numberOfQuestions": 5
}
```

### Phản Hồi Thành Công (HTTP 200 OK):
```json
{
  "statusCode": 200,
  "data": {
    "questions": [
      {
        "id": 1,
        "category": "Architecture & Concurrency",
        "question": "Trong dự án tại FPT Software, bạn đã tối ưu hóa MongoDB và Redis thế nào để phục vụ 500,000 người dùng hàng ngày mà không bị race condition?",
        "recommendedAnswer": "Ứng viên cần nhắc tới giải pháp Distributed Locking qua Redis Redlock, chiến lược Write-through caching và phân mảnh Sharding / Replica Sets.",
        "scoringRubric": {
          "1_point": "Chỉ nói chung chung về index, không giải thích được race condition",
          "3_points": "Nêu được Redis Cache nhưng chưa giải quyết triệt để bài toán đồng thời cao",
          "5_points": "Giải thích xuất sắc về Distributed Lock, Transaction trong Replica Set và Benchmarking"
        }
      }
    ]
  }
}
```

---

## 3. Sinh Đề Kiểm Tra Năng Lực (Technical Assessment)

- **Endpoint**: `POST /api/v1/assessments/generate-test`
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**: `{ "candidateId": "...", "jobId": "...", "difficulty": "Senior" }`
- **Phản Hồi**: Đề bài thực hành, test cases kiểm thử và tiêu chuẩn chấm điểm tự động.
