# 📊 Giám Sát Hệ Thống & Ghi Nhật Ký (Monitoring & Logging)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Chiến Lược Ghi Nhật Ký (Logging Architecture)

Hệ thống sử dụng cơ chế ghi log phân cấp chuẩn của NestJS (`LoggerService`), phân chia theo các cấp độ:
- **`LOG` (Info)**: Ghi nhận các sự kiện nghiệp vụ thông thường (Upload CV mới, khởi chạy extraction, đồng bộ candidate).
- **`WARN` (Warning)**: Cảnh báo sự cố có thể tự khắc phục (Gemini API lỗi chuyển sang OpenAI fallback, CV có độ dài ngắn).
- **`ERROR` (Error)**: Lỗi nghiêm trọng ảnh hưởng đến luồng chính (Không thể kết nối CSDL, cả 3 LLM providers đều lỗi).

### Định Dạng Log Chuẩn (Structured JSON Format):
```json
{
  "timestamp": "2026-10-25T08:50:12.345Z",
  "level": "INFO",
  "context": "CvService",
  "message": "CV uploaded & extracted successfully",
  "cvId": "671b5a20e4b02540c1123456",
  "candidateId": "671b5a20e4b02540c1123457",
  "latencyMs": 1240,
  "extractorModel": "gemini-2.0-flash"
}
```

---

## 2. Các Chỉ Số Cần Giám Sát (Key Health Metrics)

| Nhóm Chỉ Số | Tên Chỉ Số | Ngưỡng Cảnh Báo (Alert Threshold) | Hành Động Khắc Phục |
| :--- | :--- | :--- | :--- |
| **Hạ Tầng** | CPU Usage | $> 80\%$ duy trì trong 5 phút | Tự động nhân bản thêm instance qua Docker Replica |
| **Bộ Nhớ** | RAM Memory Usage | $> 85\%$ | Kiểm tra rò rỉ bộ nhớ Buffer khi xử lý PDF lớn |
| **API Latency** | P95 Response Time | $> 3.5\text{ giây}$ | Kiểm tra độ trễ mạng tới Google Gemini API |
| **Tỷ Lệ Lỗi** | HTTP 5xx Error Rate | $> 1\%$ tổng số requests | Kiểm tra kết nối MongoDB hoặc hết quota LLM |
| **AI Quota** | Gemini/OpenAI 429 Status | Phát sinh $> 5$ lỗi liên tiếp | Chuyển luồng sang Fallback Provider hoặc tăng hạn ngạch |
