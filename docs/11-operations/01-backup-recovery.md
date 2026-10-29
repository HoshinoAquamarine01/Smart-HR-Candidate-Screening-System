# 💾 Kế Hoạch Sao Lưu & Khôi Phục Dữ Liệu (Backup & Disaster Recovery)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Chiến Lược Sao Lưu (Backup Strategy)

Hệ thống lưu trữ 2 loại tài nguyên quan trọng cần sao lưu định kỳ:
1. **Dữ liệu Cơ sở dữ liệu (MongoDB)**: Chứa toàn bộ tài khoản, ứng viên, kết quả bóc tách JSON profile, điểm số đánh giá.
2. **Tệp nhị phân CV (File Uploads)**: Chứa các tệp vật lý PDF, Word trong thư mục `/uploads/cvs` hoặc bucket MinIO S3.

---

## 2. Kịch Bản Sao Lưu Cơ Sở Dữ Liệu Tự Động (Cron Script)

Sử dụng công cụ `mongodump` để tạo bản sao lưu nén hàng ngày vào lúc 02:00 sáng:

```bash
#!/bin/bash
# backup-mongodb.sh
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/smart-hr/mongo"
mkdir -p "$BACKUP_DIR"

# Xuất dữ liệu MongoDB sang tệp nén tar.gz
mongodump --uri="mongodb://localhost:27017/SMART-HR" --archive="$BACKUP_DIR/smart_hr_$TIMESTAMP.archive.gz" --gzip

# Xóa các bản sao lưu cũ hơn 30 ngày để tiết kiệm dung lượng
find "$BACKUP_DIR" -type f -name "*.archive.gz" -mtime +30 -delete

echo "Sao lưu hoàn tất: smart_hr_$TIMESTAMP.archive.gz"
```

---

## 3. Quy Trình Khôi Phục Dữ Liệu Khi Gặp Sự Cố (Restore Procedure)

Khi máy chủ gặp thảm họa hỏng hóc hoặc mất mát dữ liệu:

```bash
# 1. Dừng ứng dụng Backend để tránh xung đột ghi
systemctl stop smart-hr-backend

# 2. Khôi phục CSDL từ bản sao lưu gần nhất
mongorestore --uri="mongodb://localhost:27017/SMART-HR" --archive="/var/backups/smart-hr/mongo/smart_hr_LATEST.archive.gz" --gzip --drop

# 3. Đồng bộ lại tệp CV từ bản backup S3/Rsync vào /uploads/cvs

# 4. Khởi động lại dịch vụ
systemctl start smart-hr-backend
```
