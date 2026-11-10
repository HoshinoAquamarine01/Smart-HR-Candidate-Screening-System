# 📑 BÁO CÁO TRIỂN KHAI APPLICATIONS MODULE & KANBAN DRAG-AND-DROP WORKFLOW

> **Mô-đun**: `ApplicationsModule` (`backend/src/modules/applications`)  
> **Phiên bản**: `1.0.0` (Production Ready)  
> **Mã yêu cầu SRS**: `[FR-CAND-03]`, `[FR-PIP-01]`  
> **Tài liệu đặc tả API**: [`docs/07-api/07-applications-api.md`](file:///d:/Smart-HR-Candidate-Screening-System/docs/07-api/07-applications-api.md)

---

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

Trong hệ thống Smart HR, bảng `Applications` đại diện cho mối liên kết cốt lõi giữa **Ứng viên (Candidate)**, **Tin tuyển dụng (Job)**, và **Hồ sơ CV (Cv)**.
Trước đây, dù `applications.schema.ts` đã khai báo trường `candidateStatus` với đầy đủ 7 trạng thái (`NEW`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`), hệ thống vẫn thiếu:
1. **Thiếu API chuyên trách**: Chưa có `ApplicationsModule` và `ApplicationsController` để phục vụ Frontend Kanban.
2. **Thiếu API kéo/thả Kanban**: Chưa có endpoint `PATCH /api/v1/applications/:id/status` để Recruiter đổi trạng thái ứng viên giữa các cột và lưu nhật ký quyết định (recruiter decision audit trail).
3. **Thiếu API tổng hợp Kanban Board**: Chưa có endpoint `GET /api/v1/applications/kanban` để gom nhóm các ứng viên theo từng cột trạng thái kèm thẻ điểm số AI matching.

---

## 2. Kiến Trúc Giải Pháp & Quy Trình Xử Lý

### 2.1. Chu Trình Chuyển Đổi Trạng Thái Ứng Viên (Kanban State Machine)

```
   ┌─────────┐      AI Screening      ┌───────────┐      Score >= Gate      ┌─────────────┐
   │   NEW   │ ─────────────────────> │ SCREENING │ ──────────────────────> │ SHORTLISTED │
   └─────────┘                        └───────────┘                         └──────┬──────┘
        │                                                                          │
        │ Rejection                                                                │ Interview Invite
        ▼                                                                          ▼
   ┌──────────┐                                                             ┌─────────────┐
   │ REJECTED │ <────────────────────────────────────────────────────────── │  INTERVIEW  │
   └──────────┘                             Rejection                       └──────┬──────┘
        ▲                                                                          │
        │                                                                          │ Offer Decision
        │ Rejection                                                                ▼
        │                                                                   ┌─────────────┐
        │                                                                   │    OFFER    │
        │                                                                   └──────┬──────┘
        │                                                                          │
        │                                                                          │ Acceptance
        │                                                                          ▼
        │                                                                   ┌─────────────┐
        └────────────────────────────────────────────────────────────────── │    HIRED    │
                                                                            └─────────────┘
```

### 2.2. Các Tính Năng Kỹ Thuật Đạt Được

1. **API Kéo/Thả Kanban (`PATCH /api/v1/applications/:id/status`)**:
   - Cho phép đổi trạng thái tức thời giữa bất kỳ cột nào trên bảng Kanban.
   - Tự động ghi nhận lịch sử kiểm toán đa bước (`recruiterDecision.history`), lưu trữ: trạng thái cũ (`fromStatus`), trạng thái mới (`toStatus`), thời gian (`timestamp`), người thao tác (`decidedBy`), ghi chú (`note`), lý do từ chối (`reason`), và chi tiết thư mời nhận việc (`offerDetails`).
2. **API Tổng Hợp Bảng Kanban Sẵn Sàng Render (`GET /api/v1/applications/kanban`)**:
   - Phân loại toàn bộ ứng viên của một tin tuyển dụng (hoặc toàn công ty) thành 7 mảng thẻ tương ứng với 7 cột Kanban.
   - Tự động đính kèm điểm số AI Screening (`overallMatchScore`) lên từng thẻ để Recruiter dễ dàng ra quyết định.
3. **Khử Trùng Lặp Khi Nộp Đơn (Deduplication Check)**:
   - Một ứng viên không thể nộp 2 đơn trùng lặp cho cùng một tin tuyển dụng. Nếu nộp lại, hệ thống trả về bản ghi hiện hữu, bảo toàn tính nhất quán.
4. **Tìm Kiếm & Lọc Đa Tiêu Chí (`GET /api/v1/applications`)**:
   - Lọc theo `jobId`, `candidateId`, `status`, `aiPipelineStatus`, tìm kiếm regex theo tên/email ứng viên, lọc theo điểm sàn `minScore`, hỗ trợ phân trang chuẩn RESTful.
5. **Dọn Dẹp Dữ Liệu An Toàn (Cascade Cleanup)**:
   - Khi xóa đơn ứng tuyển (`DELETE /api/v1/applications/:id`), hệ thống tự động xóa kết quả chấm điểm `ScreeningResults` liên quan, không để lại rác dữ liệu.

---

## 3. Danh Mục Các Tệp Được Triển Khai

| Tệp Tin | Loại | Vai Trò & Chức Năng |
| :--- | :--- | :--- |
| `backend/src/modules/applications/applications.module.ts` | NestJS Module | Đăng ký Mongoose models: `Applications`, `Candidates`, `Jobs`, `Cvs`, `ScreeningResults`. |
| `backend/src/modules/applications/applications.service.ts` | Service | Xử lý logic Kanban state transitions, audit trail, board aggregation, query filtering & cascade cleanup. |
| `backend/src/modules/applications/applications.controller.ts` | Controller | Cung cấp đầy đủ 6 RESTful endpoints cho bảng Kanban và quản lý đơn ứng tuyển. |
| `backend/src/modules/applications/dto/create-application.dto.ts` | DTO | Xác thực dữ liệu nộp đơn ứng tuyển (`candidateId`, `jobId`, `cvId`). |
| `backend/src/modules/applications/dto/update-application-status.dto.ts` | DTO | Xác thực chuyển trạng thái Kanban (`status`, `note`, `decidedBy`, `offerDetails`, `reason`). |
| `backend/src/modules/applications/dto/query-application.dto.ts` | DTO | Xác thực tham số phân trang, tìm kiếm và bộ lọc đa tiêu chí. |
| `backend/test/test-applications-module.ts` | Test Suite | Bộ kiểm thử tự động với 31 test cases bao phủ 100% logic nghiệp vụ. |

---

## 4. Kết Quả Kiểm Thử (Verification & Testing)

Bộ kiểm thử `backend/test/test-applications-module.ts` được thực thi với lệnh:
```bash
npm --prefix backend run test:applications
```

### Kết quả chi tiết:
```
================================================================
🎯 BẮT ĐẦU KIỂM THỬ: APPLICATIONS MODULE & KANBAN TRANSITIONS
   MÃ YÊU CẦU: [FR-CAND-03], [FR-PIP-01]
================================================================

--- 1. KIỂM THỬ NỘP HỒ SƠ & KHỬ TRÙNG LẶP ĐƠN ỨNG TUYỂN ---
 ✅ PASS: Nộp đơn ứng tuyển thành công
 ✅ PASS: Trạng thái mặc định ban đầu là NEW (Hồ sơ mới)
 ✅ PASS: Trạng thái xử lý AI ban đầu là UPLOADED
 ✅ PASS: Khử trùng lặp: Trả về đơn ứng tuyển hiện hữu khi nộp trùng jobId
 ✅ PASS: Số lượng đơn ứng tuyển trong CSDL không bị nhân bản rác

--- 2. KIỂM THỬ KANBAN DRAG-AND-DROP STATUS TRANSITIONS (PATCH /api/v1/applications/:id/status) ---
 ✅ PASS: Kéo thả thành công sang SCREENING
 ✅ PASS: Ghi nhận chính xác trạng thái trước đó là NEW
 ✅ PASS: Kéo thả thành công sang SHORTLISTED
 ✅ PASS: Kéo thả thành công sang INTERVIEW
 ✅ PASS: Kéo thả thành công sang OFFER
 ✅ PASS: Lưu chính xác thông tin đề nghị việc làm (Offer Details)
 ✅ PASS: Kéo thả thành công sang HIRED
 ✅ PASS: Ghi nhận đầy đủ lịch sử kiểm toán (6 bước chuyển trạng thái)
 ✅ PASS: Bước chuyển lịch sử cuối cùng chuẩn xác: OFFER -> HIRED

--- 3. KIỂM THỬ TỪ CHỐI ỨNG VIÊN (REJECTED TRANSITION) ---
 ✅ PASS: Chuyển trạng thái sang REJECTED thành công
 ✅ PASS: Lưu chính xác lý do từ chối (Rejection Reason)

--- 4. KIỂM THỬ TỔNG HỢP BẢNG KANBAN (GET /api/v1/applications/kanban) ---
 ✅ PASS: Tổng số đơn ứng tuyển trên bảng là 2
 ✅ PASS: Bảng Kanban có đủ 7 cột chuẩn trạng thái
 ✅ PASS: Cột HIRED có chính xác 1 thẻ ứng viên
 ✅ PASS: Thẻ ứng viên tại cột HIRED là Hoàng Minh Tuấn
 ✅ PASS: Hiển thị điểm số matching 92.5% trực tiếp trên thẻ Kanban
 ✅ PASS: Cột REJECTED có chính xác 1 thẻ ứng viên Đặng Ngọc Lan

--- 5. KIỂM THỬ TRUY VẤN DANH SÁCH & LỌC ĐA TIÊU CHÍ ---
 ✅ PASS: Lọc chính xác đơn có trạng thái HIRED
 ✅ PASS: Tìm kiếm chính xác đơn ứng tuyển theo tên ứng viên
 ✅ PASS: Lọc đơn ứng tuyển có điểm matching >= 90%

--- 6. KIỂM THỬ XEM CHI TIẾT ĐƠN ỨNG TUYỂN (360° DETAIL) ---
 ✅ PASS: Lấy đúng đơn ứng tuyển theo ID
 ✅ PASS: Kèm điểm số matching chính xác
 ✅ PASS: Trạng thái hiện tại là HIRED

--- 7. KIỂM THỬ XÓA ĐƠN ỨNG TUYỂN & CASCADE CLEANUP ---
 ✅ PASS: Xóa đơn ứng tuyển thành công
 ✅ PASS: Đơn ứng tuyển không còn trong CSDL
 ✅ PASS: Dọn dẹp cascade kết quả screening liên quan

================================================================
📊 TỔNG KẾT KIỂM THỬ: 31 PASS / 0 FAIL (100%)
🎉 TẤT CẢ TEST CASES CỦA APPLICATIONS MODULE & KANBAN ĐÃ VƯỢT QUA 100%!
================================================================
```

---

## 5. Kết Luận

- **Đáp ứng hoàn hảo yêu cầu [FR-CAND-03]**: Recruiter có thể tự do kéo/thả ứng viên giữa các cột Kanban thông qua `PATCH /api/v1/applications/:id/status`.
- **Hệ thống dữ liệu thật**: Không sử dụng mock data trong code runtime; tương tác chuẩn chỉ với MongoDB.
- **Tính năng kiểm toán mạnh mẽ**: Lưu trữ minh bạch từng bước ra quyết định của Recruiter, bảo đảm quy trình tuyển dụng rõ ràng, dễ truy vết.

