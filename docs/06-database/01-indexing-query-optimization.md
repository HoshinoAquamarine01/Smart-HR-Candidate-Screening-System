# ⚡ Chiến Lược Đánh Chỉ Mục & Tối Ưu Truy Vấn (Indexing & Optimization)

> **Dự án**: Smart HR & Candidate Screening System  
> **Cơ sở dữ liệu**: MongoDB Atlas / Local MongoDB

---

## 1. Danh Sách Chỉ Mục (Database Indexes Strategy)

Nhằm đảm bảo thời gian truy vấn $< 50\text{ms}$ khi quy mô dữ liệu đạt hàng triệu hồ sơ:

### Collection: `users`
- `{ email: 1 }`: **Unique Index**. Đảm bảo không trùng lặp tài khoản và tăng tốc đăng nhập bằng email.

### Collection: `candidates`
- `{ email: 1 }`: **Sparse Index**. Phục vụ kiểm tra trùng lặp (Deduplication) khi tải lên CV mới.
- `{ fullName: "text", summary: "text" }`: **Text Index**. Hỗ trợ tìm kiếm từ khóa toàn văn bản trong kho ứng viên.

### Collection: `cvs`
- `{ candidateId: 1 }`: **Single Field Index**. Truy xuất toàn bộ lịch sử các bản CV thuộc về một ứng viên.
- `{ uploadedBy: 1, createdAt: -1 }`: **Compound Index**. Hỗ trợ lọc danh sách CV do một Recruiter tải lên theo thứ tự thời gian mới nhất.
- `{ "parsedData.profile.skills.technicalSkills": 1 }`: **Multikey Index**. Tìm kiếm nhanh các ứng viên sở hữu kỹ năng kỹ thuật cụ thể (ví dụ: tìm tất cả ứng viên biết "NestJS").

### Collection: `match_scores`
- `{ jobId: 1, totalScore: -1 }`: **Compound Index**. Cực kỳ quan trọng để sắp xếp bảng xếp hạng ứng viên (Leaderboard) theo điểm số giảm dần cho từng vị trí tuyển dụng.
- `{ cvId: 1, jobId: 1 }`: **Unique Compound Index**. Ngăn chặn việc tạo bản ghi chấm điểm trùng lặp cho cùng một cặp CV và JD.

---

## 2. Các Kỹ Thuật Tối Ưu Hiệu Năng (Performance Optimization)

1. **Projection Query**: Chỉ `select` những trường cần thiết khi hiển thị danh sách (ví dụ: không load toàn bộ `parsedData.ocrMetadata.rawText` vốn có thể dài hàng chục KB khi chỉ cần hiển thị `fullName`, `currentTitle` và `totalScore`).
2. **Lean Queries**: Sử dụng `.lean()` trong Mongoose khi thực hiện các truy vấn chỉ đọc (read-only), giảm tải việc khởi tạo Mongoose Document wrappers không cần thiết, tăng tốc độ truy vấn lên đến 3 lần.
3. **Buffer Streaming cho File Tải Xuống**: Tận dụng stream I/O qua `fs.createReadStream` thay vì đọc toàn bộ file vào RAM bằng `fs.readFileSync`.
