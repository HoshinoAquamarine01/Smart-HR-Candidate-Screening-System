import { InterviewGenerationPromptContext } from '../interfaces/interview-question.interface';

export const INTERVIEW_SYSTEM_PROMPT = `
# VAI TRÒ VÀ MỤC ĐÍCH (IDENTITY & PURPOSE)
Bạn là Trưởng ban Phỏng vấn Kỹ thuật kiêm Giám đốc Đánh giá Năng lực Nhân sự (Lead Technical & Talent Interviewer) giàu kinh nghiệm.
Nhiệm vụ của bạn là xây dựng bộ câu hỏi phỏng vấn chuẩn hóa, sắc bén, công bằng và có tính cá nhân hóa cao cho ứng viên dựa trên dữ liệu trích xuất từ CV, yêu cầu công việc (JD) và kết quả phân tích khoảng cách kỹ năng (Skill Gap Analysis).

# QUY TẮC CỐT LÕI & CHỐNG ẢO GIÁC (GROUNDING & ANTI-HALLUCINATION RULES)
1. BÁM SÁT NGỮ CẢNH HỒ SƠ: Mỗi câu hỏi kỹ thuật hoặc xác minh PHẢI trích dẫn một dữ kiện cụ thể từ CV của ứng viên (tên dự án, công nghệ đã làm, thời gian, trường học) trong trường "contextFromCV". Tuyệt đối KHÔNG sáng tác ra các dự án hoặc kinh nghiệm mà ứng viên không đề cập.
2. BAO PHỦ LỖ HỔNG (GAP COVERAGE): Nếu ứng viên có kỹ năng bị thiếu hoặc chỉ đáp ứng một phần so với yêu cầu JD ("missingSkills" hoặc "partiallyMatchedSkills"), PHẢI tạo ít nhất 1 câu hỏi thuộc nhóm SKILL_GAP để đánh giá khả năng tự học và mức độ hiểu biết nền tảng của ứng viên.
3. PHÂN BỔ 4 NHÓM CÂU HỎI BẮT BUỘC (MANDATORY 4 CATEGORIES):
   - CLARIFICATION: Làm rõ các điểm chưa rõ, khoảng trống thời gian, hoặc vai trò thực tế của ứng viên trong các dự án nhóm.
   - TECHNICAL_DEEP_DIVE: Đào sâu vào chuyên môn các công nghệ trọng tâm mà ứng viên khẳng định có kinh nghiệm hoặc làm trong các dự án chính.
   - SKILL_GAP: Khảo sát các kỹ năng JD bắt buộc nhưng hồ sơ ứng viên còn thiếu hoặc thể hiện yếu.
   - BEHAVIORAL_STAR: Đánh giá hành vi theo chuẩn STAR (Situation, Task, Action, Result) về xử lý sự cố, áp lực tiến độ hoặc xung đột kỹ thuật.
4. BAREME CHẤM ĐIỂM CHI TIẾT (SAMPLE RUBRIC): Mỗi câu hỏi BẮT BUỘC phải có hướng dẫn chấm điểm 3 mức rõ ràng:
   - poor (1-2 điểm): Dấu hiệu câu trả lời kém, học vẹt, trả lời sai bản chất hoặc mơ hồ.
   - acceptable (3-4 điểm): Trả lời đúng các khái niệm chính, có kinh nghiệm thực tế cơ bản.
   - excellent (5 điểm): Trả lời xuất sắc, phân tích được trade-offs, giải pháp tối ưu và xử lý edge-cases.
5. ĐỊNH DẠNG ĐẦU RA: BẮT BUỘC trả về duy nhất một đối tượng JSON hợp lệ theo đúng cấu trúc schema, không thêm bất kỳ văn bản giải thích markdown nào bên ngoài.
`;

export function buildInterviewGenerationPrompt(context: InterviewGenerationPromptContext): string {
  const projectsSummary = context.candidateProjects && context.candidateProjects.length > 0
    ? context.candidateProjects
        .map(
          (p, idx) =>
            `  ${idx + 1}. Dự án: ${p.title} | Vai trò: ${p.role || 'Thành viên'} | Công nghệ: ${(p.technologies || []).join(', ')}${
              p.description ? ` | Mô tả: ${p.description.slice(0, 150)}` : ''
            }`,
        )
        .join('\n')
    : '  (Không có dự án chi tiết)';

  const experienceSummary = context.candidateWorkExperience && context.candidateWorkExperience.length > 0
    ? context.candidateWorkExperience
        .map(
          (w, idx) =>
            `  ${idx + 1}. Công ty: ${w.company} | Vị trí: ${w.role} | Thời gian: ${w.startDate || '?'} - ${w.endDate || 'Hiện tại'}${
              w.responsibilities ? ` | Trách nhiệm chính: ${w.responsibilities.slice(0, 2).join('; ')}` : ''
            }`,
        )
        .join('\n')
    : '  (Không có lịch sử công tác chi tiết)';

  const templatesFormatted = context.retrievedTemplates && context.retrievedTemplates.length > 0
    ? context.retrievedTemplates
        .map(
          (t, idx) =>
            `  [Mẫu ${idx + 1}] Nhóm: ${t.category} | Kỹ năng: ${t.skillOrCompetency} | Độ khó: ${t.difficulty}\n` +
            `  - Mẫu câu hỏi: "${t.templateQuestion}"\n` +
            `  - Mục đích: ${t.purpose}\n` +
            `  - Tiêu chí mong đợi: ${t.expectedCriteria.join('; ')}`,
        )
        .join('\n\n')
    : '  (Không có mẫu truy xuất)';

  return `
=== THÔNG TIN VỊ TRÍ TUYỂN DỤNG (JOB CRITERIA) ===
- Vị trí tuyển dụng: ${context.jobTitle}
- Phòng ban: ${context.department || 'Phát triển Sản phẩm & Công nghệ'}
- Kỹ năng bắt buộc (Required Skills): ${context.requiredSkills.join(', ') || 'Không nêu'}
- Kỹ năng ưu tiên (Preferred Skills): ${context.preferredSkills.join(', ') || 'Không nêu'}
- Số năm kinh nghiệm tối thiểu: ${context.minExperienceYears} năm

=== HỒ SƠ ỨNG VIÊN (CANDIDATE PROFILE) ===
- Họ và tên: ${context.candidateName}
- Chức danh hiện tại: ${context.currentTitle || 'Chuyên viên kỹ thuật'}
- Tổng số năm kinh nghiệm: ${context.totalYearsExperience} năm
- Kỹ năng chuyên môn trích xuất từ CV: ${context.candidateSkills.join(', ') || 'Không rõ'}
- Lịch sử công tác:
${experienceSummary}
- Các dự án tiêu biểu:
${projectsSummary}

=== KẾT QUẢ ĐỐI SOÁT & KHOẢNG TRỐNG KỸ NĂNG (SCREENING GAP ANALYSIS) ===
- Kỹ năng còn thiếu hoặc chưa tìm thấy (Missing Skills): ${context.missingSkills.join(', ') || 'Không có (đáp ứng đủ)'}
- Kỹ năng chỉ đáp ứng một phần (Partially Matched): ${context.partiallyMatchedSkills.join(', ') || 'Không có'}
- Điểm đối khớp tổng quan ban đầu: ${context.overallMatchScore ? `${context.overallMatchScore}%` : 'Chưa chấm'}
${context.focusAreas && context.focusAreas.length > 0 ? `- Lĩnh vực trọng tâm người dùng yêu cầu: ${context.focusAreas.join(', ')}` : ''}

=== NGÂN HÀNG CÂU HỎI MẪU & BAREME TRUY XUẤT TỪ HỆ THỐNG RAG (RETRIEVED KNOWLEDGE TEMPLATES) ===
${templatesFormatted}

=== YÊU CẦU TẠO BỘ CÂU HỎI ===
Hãy tạo đúng ${context.numQuestions || 6} câu hỏi phỏng vấn trải đều cả 4 nhóm:
1. CLARIFICATION (Ít nhất 1 câu)
2. TECHNICAL_DEEP_DIVE (Ít nhất 2 câu - Đào sâu vào dự án và kỹ năng ứng viên)
3. SKILL_GAP (Ít nhất 1 câu nếu có kỹ năng thiếu; nếu không có kỹ năng thiếu thì hỏi về Preferred Skill)
4. BEHAVIORAL_STAR (Ít nhất 1-2 câu tình huống giải quyết vấn đề theo chuẩn STAR)

Định dạng trả về BẮT BUỘC là JSON tuân thủ đúng định dạng:
{
  "questions": [
    {
      "id": "q-1",
      "category": "TECHNICAL_DEEP_DIVE",
      "question": "Nội dung câu hỏi phỏng vấn cụ thể, sắc bén",
      "purpose": "Mục đích đánh giá của câu hỏi này",
      "difficulty": "MEDIUM",
      "relatedSkill": "Tên kỹ năng liên quan (ví dụ: NestJS, React, Docker)",
      "contextFromCV": "Dẫn chứng cụ thể từ CV (ví dụ: Trong dự án E-commerce bạn có làm module giỏ hàng...)",
      "expectedKeyPoints": [
        "Điểm mấu chốt 1 ứng viên cần trả lời",
        "Điểm mấu chốt 2 ứng viên cần trả lời"
      ],
      "sampleRubric": {
        "poor": "Mô tả câu trả lời kém (1-2 điểm)",
        "acceptable": "Mô tả câu trả lời đạt yêu cầu (3-4 điểm)",
        "excellent": "Mô tả câu trả lời xuất sắc (5 điểm)"
      }
    }
  ]
}
`;
}

