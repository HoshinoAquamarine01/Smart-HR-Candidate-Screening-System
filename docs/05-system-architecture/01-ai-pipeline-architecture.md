# 🤖 Kiến Trúc Đường Ống Xử Lý AI (AI Pipeline Architecture)

> **Dự án**: Smart HR & Candidate Screening System  
> **Tài liệu chi tiết**: [LLM_CV_EXTRACTION_PLAN.md](file:///d:/Smart-HR-Candidate-Screening-System/docs/LLM_CV_EXTRACTION_PLAN.md)

---

## 1. Luồng Xử Lý Tuần Tự (End-to-End Pipeline)

```mermaid
flowchart TD
    A[Tệp CV Tải Lên: PDF / DOCX / Image] --> B[OcrService.extractText]
    
    subgraph Step1 ["Giai đoạn 1: Bóc tách & Làm sạch OCR"]
        B --> C{Xác định loại tệp}
        C -->|PDF Text| D[PdfExtractorStrategy - pdf-parse]
        C -->|Word DOCX| E[DocxExtractorStrategy - mammoth]
        C -->|Ảnh / Scanned| F[ImageOcrStrategy - tesseract.js]
        D --> G[TextSanitizerUtil]
        E --> G
        F --> G
        G -->|cleanedText| H[Văn bản làm sạch & chuẩn hóa]
    end

    subgraph Step2 ["Giai đoạn 2: LLM Structured Extraction"]
        H --> I[AiService.extractCvStructuredData]
        I --> J{Kiểm tra độ dài >= 30 ký tự}
        J -->|Quá ngắn| K[Ném BadRequestException - Tiết kiệm token]
        J -->|Hợp lệ| L{Thử GeminiProvider}
        L -->|Thành công| M[Google Gemini 2.0 Flash + responseSchema]
        L -->|Lỗi / Quota 429| N{Thử OpenAiProvider}
        N -->|Thành công| O[OpenAI GPT-4o-mini + zodResponseFormat]
        N -->|Lỗi / Chưa có Key| P[MockAiProvider - Heuristic Extraction]
        M --> Q[StandardCvProfile JSON]
        O --> Q
        P --> Q
    end

    subgraph Step3 ["Giai đoạn 3: Đồng bộ & Lưu Trữ"]
        Q --> R[CvService: candidateModel sync]
        R -->|Deduplication| S[(Candidates Collection)]
        Q --> T[CvService: cvModel create]
        T -->|parsedData & metadata| U[(Cvs Collection)]
    end

    subgraph Step4 ["Giai đoạn 4: Hybrid Matching & Scoring (Tuần 11)"]
        U --> V[MatchingEngineService]
        JD[(Jobs Collection)] --> V
        V --> W[Semantic Vector Cosine Similarity]
        V --> X[4-Tier Skill Taxonomy: Exact/Alias/Fuzzy/Related]
        V --> Y[Hard Gate Penalty: -20% nếu thiếu >50% kỹ năng]
        W & X & Y --> Z[(ScreeningResults Collection)]
    end

    subgraph Step5 ["Giai đoạn 5: RAG AI Interview Generation (Tuần 12)"]
        Z -->|Bóc tách missingSkills & gaps| AA[InterviewsService RAG Pipeline]
        U -->|Dự án & contextFromCV| AA
        JD -->|Tiêu chí vị trí| AA
        QB[(Domain Question Bank)] -->|Semantic Vector Cosine Search| AA
        AA --> AB[Prompt Builder: Fabric Identity & STAR Schema]
        AB --> AC{AiService: Gemini 2.0 Flash / OpenAI Fallback}
        AC --> AD[(InterviewQuestions Collection: 4 Nhóm & Rubric 1-3-5)]
    end
```

---

## 2. Cơ Chế Ép Chuẩn Cấu Trúc (Schema Enforcement Mechanism)

Để đảm bảo kết quả trích xuất luôn trả về đúng 100% đối tượng JavaScript hợp lệ và không bị vỡ định dạng:

1. **Google Gemini**:
   - Sử dụng tham số `responseMimeType: 'application/json'`.
   - Cung cấp `responseSchema: CV_EXTRACTION_GEMINI_SCHEMA` trong cấu hình gọi API `@google/genai`. Mô hình được ràng buộc trực tiếp ở mức token sampling để chỉ sinh các token thuộc schema.
2. **OpenAI Structured Outputs**:
   - Sử dụng helper `zodResponseFormat(CandidateProfileZodSchema, 'candidate_cv_profile')`.
   - Kích hoạt chế độ kiểm soát chặt chẽ với cơ chế Finite State Automaton (FSA), triệt tiêu hoàn toàn hallucinated keys.
3. **Mock Heuristic Provider**:
   - Sử dụng Regular Expression thông minh để bóc tách email, số điện thoại Việt Nam (+84, 0x), tên ứng viên và nhận diện các từ khóa kỹ thuật phổ biến (Node.js, NestJS, TypeScript, React, Docker, AWS), trả về đúng cấu trúc `StandardCvProfile` ngay cả khi hoàn toàn mất kết nối internet.
