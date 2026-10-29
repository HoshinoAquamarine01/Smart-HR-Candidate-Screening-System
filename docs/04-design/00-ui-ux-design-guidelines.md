# 🎨 Hướng Dẫn Thiết Kế UI/UX (Design System Guidelines)

> **Dự án**: Smart HR & Candidate Screening System  
> **Ngôn ngữ thiết kế**: Hiện đại, Sang trọng, Tinh gọn (Modern Dark/Light Glassmorphism)

---

## 1. Triết Lý Thiết Kế (Design Philosophy)

1. **Hiệu Năng & Tốc Độ (Speed First)**: Nhà tuyển dụng cần xử lý hàng trăm CV mỗi ngày; giao diện phải trực quan, hạn chế tối đa các bước nhấp chuột thừa.
2. **Trực Quan Hóa Dữ Liệu (Data Clarity)**: Các chỉ số chấm điểm, khoảng cách kỹ năng (Skill Gap) phải được thể hiện qua màu sắc và biểu đồ rõ ràng, không để người dùng chìm ngập trong văn bản thô.
3. **Mỹ Thuật Cao Cấp (Premium Aesthetics)**: Kết hợp hài hòa giữa bảng màu HSL hiện đại, gradient tinh tế, bo góc mềm mại (`border-radius: 12px - 16px`) và hiệu ứng hover mượt mà.

---

## 2. Bảng Màu Thiết Kế (Color Tokens)

### Theme Tối (Dark Slate Theme - Mặc định cho Recruiter Workspace)
- **Background Primary**: `#0F172A` (Slate 900 - Nền chính sâu thẳm, dịu mắt khi làm việc ban đêm)
- **Surface / Card Background**: `#1E293B` (Slate 800 - Nền thẻ card nổi bật)
- **Surface Hover**: `#334155` (Slate 700)
- **Primary Brand Accent**: `#6366F1` (Indigo 500) $\rightarrow$ `#4F46E5` (Indigo 600)
- **Secondary Accent (AI Glow)**: `#06B6D4` (Cyan 500)
- **Text Primary**: `#F8FAFC` (Slate 50 - Độ tương phản cao)
- **Text Secondary / Muted**: `#94A3B8` (Slate 400)
- **Border / Divider**: `rgba(255, 255, 255, 0.08)`

### Màu Chỉ Báo Trạng Thái (Semantic Status Colors)
- **Success / High Match ($\ge 80\%$)**: `#10B981` (Emerald 500)
- **Warning / Medium Match ($50\% - 79\%$)**: `#F59E0B` (Amber 500)
- **Danger / Low Match ($< 50\%$)**: `#EF4444` (Rose 500)
- **Info / AI Processing**: `#3B82F6` (Blue 500)

---

## 3. Hệ Thống Kiểu Chữ (Typography)

Sử dụng bộ font **Inter** hoặc **Outfit** từ Google Fonts:
- **Heading 1 (`h1`)**: 32px / Semi-bold (600) / Tracking -0.02em
- **Heading 2 (`h2`)**: 24px / Semi-bold (600) / Tracking -0.01em
- **Heading 3 (`h3`)**: 18px / Medium (500)
- **Body Text**: 14px / Regular (400) / Line-height 1.6
- **Caption / Badge**: 12px / Medium (500) / Uppercase tracking 0.05em
- **Code / Tech Stack Pill**: 13px / Fira Code hoặc JetBrains Mono

---

## 4. Các Thành Phần Giao Diện Chuẩn (Reusable Components)

1. **CV Upload Dropzone**: Khu vực kéo thả viền nét đứt có hiệu ứng phát sáng neon khi kéo file vào.
2. **Match Score Gauge**: Vòng tròn đo điểm số phần trăm với animation mượt từ 0 đến điểm thực tế.
3. **Skill Pill Tag**: Huy hiệu phân loại màu:
   - Xanh ngọc: Kỹ năng bắt buộc khớp hoàn toàn.
   - Cam đất: Kỹ năng có liên quan gián tiếp.
   - Đỏ nhạt: Kỹ năng còn thiếu trong CV.
4. **Candidate Split-View Modal**: Chia 2 nửa màn hình, bên trái là PDF viewer gốc, bên phải là thông tin bóc tách chi tiết.
