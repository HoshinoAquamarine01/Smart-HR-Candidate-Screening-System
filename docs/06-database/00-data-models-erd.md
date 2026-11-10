# 🗄 Mô Hình Dữ Liệu & ERD (Data Models & ERD)

> **Dự án**: Smart HR & Candidate Screening System  
> **Cơ sở dữ liệu**: MongoDB (Mongoose ODM)  
> **Tài liệu tham chiếu**: [ERD.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/ERD.md)

---

## 1. Sơ Đồ Quan Hệ Thực Thể (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    USERS ||--o{ CVS : "uploads"
    USERS ||--o{ JOBS : "creates"
    CANDIDATES ||--o{ CVS : "owns"
    JOBS ||--o{ MATCH_SCORES : "evaluated in"
    CVS ||--o{ MATCH_SCORES : "evaluated in"
    CANDIDATES ||--o{ INTERVIEWS : "participates"
    JOBS ||--o{ INTERVIEWS : "associated with"
    INTERVIEWS ||--o{ ASSESSMENTS : "includes"

    USERS {
        ObjectId _id PK
        string email UK "Email đăng nhập"
        string passwordHash "Băm mật khẩu bcrypt"
        string role "admin | recruiter | hiring_manager"
        string fullName "Họ tên người dùng"
        date createdAt
        date updatedAt
    }

    CANDIDATES {
        ObjectId _id PK
        string fullName "Họ tên ứng viên trích xuất từ CV"
        string email "Email liên hệ (nếu có)"
        string phone "Số điện thoại"
        string location "Địa chỉ / Thành phố"
        string currentTitle "Chức danh hiện tại"
        string summary "Tóm tắt bản thân hoặc mục tiêu nghề nghiệp"
        boolean anonymized "Đã ẩn danh thông tin PII hay chưa"
        date createdAt
        date updatedAt
    }

    CVS {
        ObjectId _id PK
        ObjectId candidateId FK "Tham chiếu Candidates"
        string fileUrl "Đường dẫn tải tệp (/uploads/cvs/...)"
        string fileName "Tên tệp gốc"
        number fileSize "Kích thước tệp (bytes)"
        string mimeType "application/pdf | docx | png..."
        object parsedData "Chứa ocrMetadata, profile JSON, extractionMetadata"
        array embedding "Vector biểu diễn ngữ nghĩa"
        ObjectId uploadedBy FK "Tham chiếu Users"
        date createdAt
        date updatedAt
    }

    JOBS {
        ObjectId _id PK
        string title "Tiêu đề vị trí tuyển dụng"
        string department "Phòng ban"
        string seniority "Junior | Mid | Senior | Lead"
        string description "Mô tả công việc"
        array requiredSkills "Kỹ năng bắt buộc (Must-have)"
        array preferredSkills "Kỹ năng ưu tiên (Nice-to-have)"
        number minYearsExp "Số năm kinh nghiệm tối thiểu"
        string status "draft | open | closed"
        ObjectId createdBy FK "Tham chiếu Users"
        date createdAt
        date updatedAt
    }

    MATCH_SCORES {
        ObjectId _id PK
        ObjectId jobId FK "Tham chiếu Jobs"
        ObjectId cvId FK "Tham chiếu Cvs"
        number totalScore "Điểm tổng hợp 0 - 100%"
        object breakdown "skillScore, experienceScore, domainScore"
        object skillAnalysis "matchedSkills, missingSkills"
        string rationale "Giải trình điểm số từ AI"
        date createdAt
    }

    INTERVIEWS {
        ObjectId _id PK
        ObjectId applicationId FK "Tham chiếu Applications"
        ObjectId candidateId FK "Tham chiếu Candidates"
        ObjectId jobId FK "Tham chiếu Jobs"
        array questions "Danh sách câu hỏi 4 nhóm kèm contextFromCV và rubric 1-3-5"
        string status "GENERATED | REVIEWED | EXPORTED"
        ObjectId createdBy FK "Tham chiếu Users (tùy chọn)"
        date createdAt
        date updatedAt
    }

    ASSESSMENTS {
        ObjectId _id PK
        ObjectId interviewId FK "Tham chiếu Interviews"
        string testType "coding_challenge | architecture_case"
        string promptContent "Đề bài và yêu cầu"
        object evaluationCriteria "Tiêu chí chấm điểm"
        number scoreAchieved "Điểm đạt được"
        date createdAt
    }
```
