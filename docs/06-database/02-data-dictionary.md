# 📖 Từ Điển Dữ Liệu (Data Dictionary)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Bảng Dữ Liệu: `candidates`

| Tên Trường (Field) | Kiểu Dữ Liệu (BSON) | Ràng Buộc | Mô Tả Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key, Auto-gen | Định danh duy nhất của ứng viên |
| `fullName` | String | Required | Họ và tên đầy đủ của ứng viên |
| `email` | String | Optional, Indexed | Địa chỉ thư điện tử |
| `phone` | String | Optional | Số điện thoại liên lạc |
| `location` | String | Optional | Thành phố hoặc nơi cư trú |
| `currentTitle` | String | Optional | Chức danh chuyên môn hiện tại |
| `summary` | String | Optional | Tóm tắt năng lực hoặc mục tiêu nghề nghiệp |
| `anonymized` | Boolean | Default: `false` | Đánh dấu hồ sơ đã ẩn danh thông tin cá nhân chưa |
| `createdAt` | Date | Auto Timestamp | Thời điểm tạo hồ sơ |
| `updatedAt` | Date | Auto Timestamp | Thời điểm cập nhật hồ sơ gần nhất |

---

## 2. Bảng Dữ Liệu: `cvs`

| Tên Trường (Field) | Kiểu Dữ Liệu (BSON) | Ràng Buộc | Mô Tả Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key, Auto-gen | Định danh duy nhất của bản ghi CV |
| `candidateId` | ObjectId | Foreign Key $\rightarrow$ `candidates` | Tham chiếu tới ứng viên sở hữu CV này |
| `fileUrl` | String | Required | Đường dẫn URL tải file trên server (`/uploads/cvs/...`) |
| `fileName` | String | Required | Tên tệp tin gốc khi tải lên |
| `fileSize` | Number | Required | Kích thước tệp tin tính bằng Bytes |
| `mimeType` | String | Required | Định dạng MIME của file (PDF/DOCX/PNG/JPEG) |
| `parsedData` | Object | Default: `{}` | Cấu trúc dữ liệu chứa: `profile`, `ocrMetadata`, `extractionMetadata` |
| `parsedData.profile` | Object | Embedded Schema | Hồ sơ ứng viên chuẩn hóa bóc tách qua LLM (`StandardCvProfile`) |
| `parsedData.ocrMetadata`| Object | Embedded Schema | Dữ liệu văn bản thô, số từ, số ký tự, bộ trích xuất OCR đã dùng |
| `parsedData.extractionMetadata`| Object | Embedded Schema | Mô hình AI sử dụng, độ trễ, điểm tự tin, token tiêu hao |
| `embedding` | Array of Number | Default: `[]` | Vector biểu diễn ngữ nghĩa của hồ sơ |
| `uploadedBy` | ObjectId | Foreign Key $\rightarrow$ `users` | Tài khoản Recruiter đã tải file này lên |
| `createdAt` | Date | Auto Timestamp | Thời điểm tải lên |
