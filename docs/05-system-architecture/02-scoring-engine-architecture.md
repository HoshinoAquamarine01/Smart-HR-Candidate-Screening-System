# ⚖️ Kiến Trúc Động Cơ Chấm Điểm So Khớp (Scoring Engine Architecture)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Công Thức Đánh Giá Đa Chiều (Multi-Dimensional Scoring Model)

Điểm tương thích tổng hợp giữa ứng viên và Mô tả công việc ($S_{\text{total}}$) được tính toán trên thang điểm **0 – 100%** theo công thức trọng số:

$$S_{\text{total}} = w_{\text{skill}} \cdot S_{\text{skill}} + w_{\text{exp}} \cdot S_{\text{exp}} + w_{\text{domain}} \cdot S_{\text{domain}}$$

Trong đó:
- **Trọng số Kỹ năng ($w_{\text{skill}} = 0.45$)**: Kỹ năng kỹ thuật và công cụ bắt buộc.
- **Trọng số Kinh nghiệm ($w_{\text{exp}} = 0.35$)**: Số năm kinh nghiệm làm việc thực tế và cấp bậc tương đương.
- **Trọng số Nghiệp vụ & Học vấn ($w_{\text{domain}} = 0.20$)**: Miền kiến thức chuyên ngành và bằng cấp.

---

## 2. Chi Tiết Các Chiều Chấm Điểm

### A. Chiều Kỹ Năng (Skill Fit Score - $S_{\text{skill}}$)
- Danh mục kỹ năng trong JD được phân thành 2 nhóm:
  - **Bắt buộc (Must-have skills)**: Chiếm 75% trọng số kỹ năng.
  - **Ưu tiên (Nice-to-have skills)**: Chiếm 25% trọng số kỹ năng.
- Sử dụng bảng từ điển đồng nghĩa (Synonym Matrix) và so khớp ngữ nghĩa qua Text Embeddings:
  - Ví dụ: "NestJS" được tự động tính điểm tương thích cao với yêu cầu "Node.js Framework".
  - "PostgreSQL" tương thích với yêu cầu "Relational Database / SQL".

### B. Chiều Kinh Nghiệm (Experience Score - $S_{\text{exp}}$)
- So sánh giữa $Y_{\text{candidate}}$ (Số năm kinh nghiệm bóc tách từ CV) và $Y_{\text{required}}$ (Số năm yêu cầu trong JD):
  - Nếu $Y_{\text{candidate}} \ge Y_{\text{required}}$: Đạt điểm tối đa 100%.
  - Nếu $Y_{\text{candidate}} < Y_{\text{required}}$: Tính điểm phạt tuyến tính hoặc phi tuyến dựa trên tỷ lệ thiếu hụt:
    $$S_{\text{exp}} = \max\left(30, \frac{Y_{\text{candidate}}}{Y_{\text{required}}} \times 100\right)$$
- Phân tích độ ổn định công tác (Job tenure) và quy mô dự án từng đảm nhiệm.

### C. Chiều Nghiệp Vụ & Học Vấn (Domain Fit - $S_{\text{domain}}$)
- Ứng viên từng làm việc trong cùng lĩnh vực của công ty tuyển dụng (ví dụ: Fintech, E-commerce, Edtech, Healthtech) sẽ được cộng điểm ưu thế.
- Đánh giá mức độ phù hợp của bằng cấp chuyên môn (Đại học Bách Khoa, CNTT) hoặc các chứng chỉ uy tín (AWS, PMP, Scrum Master).

---

## 3. Đầu Ra Của Động Cơ Chấm Điểm (Scoring Output JSON)

```json
{
  "totalMatchScore": 88,
  "breakdown": {
    "skillScore": 92,
    "experienceScore": 85,
    "domainScore": 80
  },
  "skillAnalysis": {
    "matchedSkills": ["TypeScript", "NestJS", "MongoDB", "Docker", "Git"],
    "missingMustHave": [],
    "missingNiceToHave": ["Kubernetes", "RabbitMQ"]
  },
  "rationale": "Ứng viên có nền tảng kỹ thuật backend vững chắc với hơn 4 năm kinh nghiệm thực tế về NestJS và MongoDB, đáp ứng trọn vẹn yêu cầu chính của vị trí Senior Backend Developer. Điểm cần đào sâu khi phỏng vấn là kinh nghiệm vận hành cụm phân tán quy mô lớn với Kubernetes."
}
```
