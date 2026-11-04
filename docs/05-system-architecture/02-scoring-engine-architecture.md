# ⚖️ Kiến Trúc Động Cơ Chấm Điểm So Khớp (Scoring Engine Architecture)

> **Dự án**: Smart HR & Candidate Screening System  

---

## 1. Công Thức Đánh Giá Đa Chiều (Multi-Dimensional Scoring Model)

Điểm tương thích tổng hợp giữa ứng viên và Mô tả công việc ($S_{\text{total}}$) được tính toán trên thang điểm **0 – 100%** theo công thức trọng số đa trụ cột (được hoàn thiện trong nghiên cứu Tuần 11):

$$S_{\text{total}} = w_1 \cdot S_{\text{semantic}} + w_2 \cdot S_{\text{skill}} + w_3 \cdot S_{\text{exp}} + w_4 \cdot S_{\text{edu}}$$

Trong đó:
- **Điều kiện ràng buộc**: $w_1 + w_2 + w_3 + w_4 = 1$.
- **$S_{\text{semantic}}$ (Semantic Score)**: Mức độ tương đồng ngữ nghĩa tổng thể giữa CV và JD thông qua mô hình Vector Embedding và **Cosine Similarity**:
  $$\text{Cosine Similarity}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \times \|\vec{B}\|}$$
- **$S_{\text{skill}}$ (Skill Fit Score)**: Mức độ đáp ứng kỹ năng kỹ thuật, phân loại theo **Required Skills** ($a_r = 3.0$) và **Preferred Skills** ($a_p = 1.0$) với mức độ đáp ứng $m_i \in \{0, 0.5, 1.0\}$:
  $$S_{\text{skill}} = \left( \frac{\sum_{i=1}^n a_i \times m_i}{\sum_{i=1}^n a_i} \right) \times 100$$
- **$S_{\text{exp}}$ (Experience Score)**: Mức độ phù hợp về số năm kinh nghiệm làm việc thực tế so với yêu cầu vị trí.
- **$S_{\text{edu}}$ (Education Score)**: Mức độ đáp ứng về bằng cấp, chuyên ngành đào tạo (CNTT, Khoa học máy tính) và chứng chỉ liên quan.

### Bảng Trọng Số Đề Xuất Theo Cấp Bậc (Preset Weights)

| Cấp bậc tuyển dụng | $w_1$ (Semantic) | $w_2$ (Skill) | $w_3$ (Experience) | $w_4$ (Education) |
| :--- | :---: | :---: | :---: | :---: |
| **Intern / Fresher** | 0.25 | **0.45** | 0.05 | **0.25** |
| **Junior / Middle** | 0.25 | **0.45** | 0.25 | 0.05 |
| **Senior / Lead** | 0.20 | 0.35 | **0.40** | 0.05 |

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
    "semanticScore": 85,
    "skillScore": 92,
    "experienceScore": 85,
    "educationScore": 90
  },
  "weightsApplied": {
    "semantic": 0.25,
    "skill": 0.45,
    "experience": 0.25,
    "education": 0.05
  },
  "skillAnalysis": {
    "matchedSkills": ["TypeScript", "NestJS", "MongoDB", "Docker", "Git"],
    "partialSkills": ["PostgreSQL"],
    "missingRequired": [],
    "missingPreferred": ["Kubernetes", "RabbitMQ"]
  },
  "rationale": "Ứng viên có nền tảng kỹ thuật backend vững chắc với hơn 4 năm kinh nghiệm thực tế về NestJS và MongoDB, đáp ứng trọn vẹn yêu cầu chính của vị trí Senior Backend Developer. Điểm cần đào sâu khi phỏng vấn là kinh nghiệm vận hành cụm phân tán quy mô lớn với Kubernetes."
}
```
