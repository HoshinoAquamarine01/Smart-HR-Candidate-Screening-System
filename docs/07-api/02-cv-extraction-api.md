# 📄 Đặc Tả API Quản Lý & Bóc Tách CV (CV & Extraction API)

> **Dự án**: Smart HR & Candidate Screening System  
> **Module**: `CvModule`, `OcrModule`, `AiModule`  

---

## 1. Tải Lên & Bóc Tách CV Tự Động

- **Endpoint**: `POST /api/v1/cv/upload`
- **Mô tả**: Tải lên tệp CV, kích hoạt OCR trích xuất văn bản, gọi LLM phân tích ngữ nghĩa, tự động tạo/liên kết hồ sơ trong `candidates` và lưu `parsedData`.
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: multipart/form-data`
- **Form Data**:
  - `file`: Tệp tin nhị phân (PDF, DOCX, DOC, PNG, JPEG $\le 5\text{MB}$).

### Phản Hồi Thành Công (HTTP 201 Created):
```json
{
  "message": "CV uploaded & extracted successfully",
  "data": {
    "id": "671b5a20e4b02540c1123456",
    "candidateId": "671b5a20e4b02540c1123457",
    "fileName": "Nguyen_Van_An_CV.pdf",
    "fileUrl": "/uploads/cvs/1729845678-123456789.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "parsedData": {
      "profile": {
        "personalInfo": {
          "fullName": "NGUYỄN VĂN AN",
          "email": "an.nguyen@techcorp.vn",
          "phone": "+84912345678",
          "location": "Cầu Giấy, Hà Nội",
          "linkedin": "https://linkedin.com/in/annguyen",
          "github": "https://github.com/annguyen",
          "portfolioUrl": null,
          "currentTitle": "Senior Backend Developer"
        },
        "summary": "Hơn 4 năm kinh nghiệm phát triển hệ thống backend phân tán microservices với NestJS và MongoDB.",
        "yearsOfExperience": 4.5,
        "skills": {
          "technicalSkills": ["TypeScript", "NestJS", "Node.js", "MongoDB", "Redis"],
          "softSkills": ["Làm việc nhóm", "Giải quyết vấn đề"],
          "toolsAndPlatforms": ["Docker", "Kubernetes", "AWS", "Git"]
        },
        "workExperience": [
          {
            "company": "Công ty Cổ phần Công nghệ FPT",
            "role": "Senior Backend Developer",
            "location": "Hà Nội",
            "startDate": "2022-03",
            "endDate": "Present",
            "isCurrent": true,
            "description": "Thiết kế và triển khai kiến trúc microservices",
            "responsibilities": ["Phát triển REST API", "Tối ưu hóa database"],
            "achievements": ["Giảm 40% độ trễ hệ thống"],
            "techStack": ["NestJS", "TypeScript", "MongoDB"]
          }
        ],
        "education": [],
        "certifications": [],
        "languages": [],
        "projects": []
      },
      "ocrMetadata": {
        "rawText": "...",
        "cleanedText": "...",
        "characterCount": 1850,
        "wordCount": 310,
        "extractorUsed": "pdf-parse",
        "isScanned": false,
        "confidenceScore": 98
      },
      "extractionMetadata": {
        "extractorModel": "gemini-2.0-flash",
        "confidenceScore": 95,
        "processingTimeMs": 1150,
        "extractedAt": "2026-10-25T08:50:00.000Z"
      }
    },
    "uploadedBy": "671b5690b2c145a4a1122334",
    "createdAt": "2026-10-25T08:50:00.000Z"
  }
}
```

---

## 2. Tái Bóc Tách CV Bằng LLM (Re-extract)

- **Endpoint**: `POST /api/v1/cv/:id/extract`
- **Mô tả**: Bóc tách lại văn bản CV đã lưu bằng mô hình LLM và cập nhật lại thông tin ứng viên.
- **Headers**: `Authorization: Bearer <access_token>`
- **URL Params**: `:id` - Mã ObjectId của CV.

### Phản Hồi Thành Công (HTTP 200 OK):
```json
{
  "statusCode": 200,
  "message": "CV re-extracted and synchronized successfully",
  "data": {
    "id": "671b5a20e4b02540c1123456",
    "candidateId": "671b5a20e4b02540c1123457",
    "profile": { "...": "Cấu trúc StandardCvProfile mới nhất" },
    "extractionMetadata": {
      "extractorModel": "gemini-2.0-flash",
      "confidenceScore": 95,
      "processingTimeMs": 950
    }
  }
}
```

---

## 3. Lấy Chi Tiết CV

- **Endpoint**: `GET /api/v1/cv/:id`
- **Headers**: `Authorization: Bearer <access_token>`
- **Phản Hồi Thành Công (HTTP 200 OK)**: Trả về chi tiết bản ghi CV và populate thông tin `candidateId`.

---

## 4. Tải Xuống / Xem Trực Tuyến Tệp CV Gốc

- **Endpoint**: `GET /api/v1/cv/:id/file`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response Headers**:
  - `Content-Type: application/pdf` (hoặc mimeType tương ứng)
  - `Content-Disposition: inline; filename="ten_file.pdf"`
- **Response**: Binary Stream (`StreamableFile`).
