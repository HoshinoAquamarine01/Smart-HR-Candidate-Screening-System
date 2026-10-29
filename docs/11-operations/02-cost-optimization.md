# 💰 Tối Ưu Chi Phí Vận Hành & Token AI (Cost Optimization Guide)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Phân Tích Cơ Cấu Chi Phí AI Token

Chi phí gọi API mô hình ngôn ngữ lớn (LLM) là một trong những khoản chi phí vận hành biến đổi lớn nhất nếu không được kiểm soát chặt chẽ.

| Nhà Cung Cấp | Mô Hình | Chi Phí Input / 1M Tokens | Chi Phí Output / 1M Tokens | Chi Phí Ước Tính / 1,000 CVs |
| :--- | :--- | :--- | :--- | :--- |
| **Google Cloud** | **Gemini 2.0 Flash** | **$0.075** | **$0.30** | **~$0.40 USD** |
| **OpenAI** | **GPT-4o-mini** | $0.15 | $0.60 | ~$0.90 USD |
| **OpenAI** | **GPT-4o (Full)** | $2.50 | $10.00 | ~$14.50 USD |

👉 **Chiến lược thông minh**: Ưu tiên 99% lưu lượng vào **Gemini 2.0 Flash**, chỉ dùng GPT-4o-mini làm dự phòng khẩn cấp, giúp tiết kiệm tới **97% chi phí** so với việc dùng các mô hình lớn truyền thống.

---

## 2. Các Kỹ Thuật Tiết Kiệm Token Trong Mã Nguồn

1. **Khử Nhiễu Văn Bản Trước Khi Gửi (Pre-sanitizing)**:
   - Loại bỏ các ký tự xuống dòng thừa (`\n\n\n+` $\rightarrow$ `\n\n`).
   - Loại bỏ các chuỗi ký tự điều khiển Unicode không mang giá trị ngữ nghĩa.
   - Giúp giảm trung bình từ 15% đến 25% số lượng input tokens cho mỗi CV.
2. **Kiểm Tra Độ Dài Ngưỡng (Validation Guard)**:
   - Bỏ qua lệnh gọi LLM nếu văn bản ngắn hơn 30 ký tự hoặc chứa toàn ký tự trắng.
3. **Lưu Trữ Kết Quả Bóc Tách (Persistent Caching)**:
   - Kết quả phân tích được lưu vĩnh viễn vào `cvs.parsedData`. Khi cần hiển thị hoặc tính điểm, hệ thống đọc trực tiếp từ MongoDB thay vì gọi lại LLM.
   - Chỉ gọi lại LLM khi người dùng chủ động nhấn nút **Re-extract**.
