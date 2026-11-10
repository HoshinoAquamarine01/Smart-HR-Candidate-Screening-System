import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiService } from '../ai/ai.service';
import { QuestionBankService } from './services/question-bank.service';
import {
  InterviewCategory,
  InterviewGenerationPromptContext,
  InterviewQuestionItem,
  QuestionDifficulty,
} from './interfaces/interview-question.interface';
import {
  InterviewQuestions,
  InterviewQuestionsDocument,
  QuestionStatus,
} from '../../schemas/interview_questions.schema';
import { Applications, ApplicationsDocument } from '../../schemas/applications.schema';
import { Candidates, CandidatesDocument } from '../../schemas/candidates.schema';
import { Jobs, JobsDocument } from '../../schemas/jobs.schema';
import { Cvs, CvsDocument } from '../../schemas/cvs.schema';
import {
  ScreeningResults,
  ScreeningResultsDocument,
} from '../../schemas/screening_results.schema';
import { GenerateInterviewDto } from './dto/generate-interview.dto';
import { UpdateInterviewQuestionsDto } from './dto/update-interview.dto';
import {
  buildInterviewGenerationPrompt,
  INTERVIEW_SYSTEM_PROMPT,
} from './prompts/interview-generation.prompt';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    @InjectModel(InterviewQuestions.name)
    private readonly interviewQuestionsModel: Model<InterviewQuestionsDocument>,
    @InjectModel(Applications.name)
    private readonly applicationsModel: Model<ApplicationsDocument>,
    @InjectModel(Candidates.name)
    private readonly candidatesModel: Model<CandidatesDocument>,
    @InjectModel(Jobs.name)
    private readonly jobsModel: Model<JobsDocument>,
    @InjectModel(Cvs.name)
    private readonly cvsModel: Model<CvsDocument>,
    @InjectModel(ScreeningResults.name)
    private readonly screeningResultsModel: Model<ScreeningResultsDocument>,
    private readonly aiService: AiService,
    private readonly questionBankService: QuestionBankService,
  ) {}

  /**
   * Generates tailored, grounded interview questions using RAG (CV + JD + Gap Analysis + Question Bank)
   */
  async generateQuestions(dto: GenerateInterviewDto, userId?: string) {
    this.logger.log(`Initiating AI Interview Generation with RAG. AppId: ${dto.applicationId || 'N/A'}`);

    let application: ApplicationsDocument | null = null;
    let candidate: CandidatesDocument | null = null;
    let job: JobsDocument | null = null;
    let cv: CvsDocument | null = null;
    let screeningResult: ScreeningResultsDocument | null = null;

    // 1. Resolve Application & Associated Entities
    if (dto.applicationId && Types.ObjectId.isValid(dto.applicationId)) {
      application = await this.applicationsModel.findById(dto.applicationId).exec();
    }

    const candidateIdStr = dto.candidateId || (application ? application.candidateId.toString() : null);
    const jobIdStr = dto.jobId || (application ? application.jobId.toString() : null);

    // Check cached questions if not regenerating
    if (!dto.regenerate && application) {
      const existing = await this.interviewQuestionsModel
        .findOne({ applicationId: application._id })
        .exec();
      if (existing && existing.questions && existing.questions.length > 0) {
        this.logger.log(`Returning cached interview questions for application: ${application._id}`);
        return {
          id: existing._id,
          applicationId: existing.applicationId,
          candidateId: existing.candidateId,
          jobId: existing.jobId,
          status: existing.status,
          questions: existing.questions,
          isCached: true,
          metadata: {
            totalQuestions: existing.questions.length,
            cachedAt: (existing as any).updatedAt || (existing as any).createdAt,
          },
        };
      }
    }

    if (candidateIdStr && Types.ObjectId.isValid(candidateIdStr)) {
      candidate = await this.candidatesModel.findById(candidateIdStr).exec();
      cv = await this.cvsModel.findOne({ candidateId: new Types.ObjectId(candidateIdStr) }).sort({ createdAt: -1 }).exec();
    }

    if (jobIdStr && Types.ObjectId.isValid(jobIdStr)) {
      job = await this.jobsModel.findById(jobIdStr).exec();
    }

    if (application) {
      screeningResult = await this.screeningResultsModel.findOne({ applicationId: application._id }).exec();
    } else if (candidateIdStr && jobIdStr) {
      screeningResult = await this.screeningResultsModel
        .findOne({
          candidateId: new Types.ObjectId(candidateIdStr),
          jobId: new Types.ObjectId(jobIdStr),
        })
        .exec();
    }

    // 2. Synthesize Profile & Job Context
    const candidateName = candidate ? candidate.fullName : 'Ứng viên tiềm năng';
    const currentTitle = candidate?.currentTitle || (cv?.parsedData?.personalInfo?.currentTitle as string) || '';
    const parsedData = cv?.parsedData || {};
    const totalYearsExperience =
      typeof parsedData.totalYearsExperience === 'number'
        ? parsedData.totalYearsExperience
        : (candidate as any)?.yearsOfExperience || 2;

    const candidateSkills: string[] = [
      ...((parsedData.skills?.technical as string[]) || []),
      ...((parsedData.skills?.soft as string[]) || []),
    ];

    const candidateProjects = (parsedData.projects || []).map((p: any) => ({
      title: p.title || p.name || 'Dự án phần mềm',
      description: p.description,
      technologies: p.technologies || p.techStack || [],
      role: p.role,
    }));

    const candidateWorkExperience = (parsedData.workExperience || []).map((w: any) => ({
      company: w.company || 'Doanh nghiệp',
      role: w.role || w.position || 'Software Engineer',
      startDate: w.startDate,
      endDate: w.endDate,
      responsibilities: w.responsibilities || [],
    }));

    // Job criteria
    const jobTitle = job?.title || 'Kỹ sư phần mềm';
    const department = job?.department || 'Công nghệ thông tin';
    const extractedCriteria = job?.extractedCriteria || {};
    const requiredSkills: string[] = extractedCriteria.requiredSkills || ['TypeScript', 'Node.js', 'NestJS'];
    const preferredSkills: string[] = extractedCriteria.preferredSkills || ['Docker', 'MongoDB', 'Redis'];
    const minExperienceYears: number = extractedCriteria.minExperienceYears || 1;

    // Screening gaps
    const missingSkills: string[] = [];
    const partiallyMatchedSkills: string[] = [];
    let overallMatchScore: number | undefined;

    if (screeningResult) {
      overallMatchScore = screeningResult.overallMatchScore;
      const details = screeningResult.detailedMatching || [];
      for (const item of details) {
        if (item.matchType === 'MISSING' || item.score === 0) {
          missingSkills.push(item.skill || item.name);
        } else if (item.matchType === 'RELATED' || (item.score > 0 && item.score < 1.0)) {
          partiallyMatchedSkills.push(item.skill || item.name);
        }
      }
    }

    // 3. RAG Retrieval from Domain Question Bank
    const skillsToSearch = [
      ...missingSkills,
      ...partiallyMatchedSkills,
      ...requiredSkills.slice(0, 3),
      ...(dto.focusAreas || []),
    ];

    const retrievedTemplates = await this.questionBankService.retrieveRelevantTemplates({
      skills: skillsToSearch,
      targetDifficulty: dto.targetDifficulty,
      topK: 6,
      queryText: `${jobTitle} ${dto.focusAreas ? dto.focusAreas.join(' ') : ''}`,
    });

    // 4. Construct Grounded Prompt
    const promptContext: InterviewGenerationPromptContext = {
      jobTitle,
      department,
      requiredSkills,
      preferredSkills,
      minExperienceYears,
      candidateName,
      currentTitle,
      totalYearsExperience,
      candidateSkills,
      candidateProjects,
      candidateWorkExperience,
      missingSkills,
      partiallyMatchedSkills,
      overallMatchScore,
      focusAreas: dto.focusAreas,
      retrievedTemplates,
      numQuestions: dto.numQuestions || 6,
    };

    const userPrompt = buildInterviewGenerationPrompt(promptContext);

    // 5. Generate Structured Questions via AI Service (Gemini / OpenAI / Mock fallback)
    const rawAiResult = await this.aiService.generateInterviewQuestions(
      userPrompt,
      INTERVIEW_SYSTEM_PROMPT,
      promptContext,
    );

    // 6. Normalize & Validate Questions
    const sanitizedQuestions = this.sanitizeAndValidateQuestions(
      rawAiResult.questions,
      promptContext,
    );

    // 7. Persist or Update in Database
    let savedDoc: InterviewQuestionsDocument;
    const targetApplicationId = application
      ? application._id
      : dto.applicationId && Types.ObjectId.isValid(dto.applicationId)
        ? new Types.ObjectId(dto.applicationId)
        : new Types.ObjectId();

    const targetCandidateId = candidate
      ? candidate._id
      : candidateIdStr && Types.ObjectId.isValid(candidateIdStr)
        ? new Types.ObjectId(candidateIdStr)
        : new Types.ObjectId();

    const targetJobId = job
      ? job._id
      : jobIdStr && Types.ObjectId.isValid(jobIdStr)
        ? new Types.ObjectId(jobIdStr)
        : new Types.ObjectId();

    const existingDoc = await this.interviewQuestionsModel.findOne({
      applicationId: targetApplicationId,
    }).exec();

    if (existingDoc) {
      existingDoc.questions = sanitizedQuestions;
      existingDoc.status = QuestionStatus.GENERATED;
      if (userId && Types.ObjectId.isValid(userId)) {
        existingDoc.createdBy = new Types.ObjectId(userId);
      }
      savedDoc = await existingDoc.save();
    } else {
      savedDoc = await this.interviewQuestionsModel.create({
        applicationId: targetApplicationId,
        candidateId: targetCandidateId,
        jobId: targetJobId,
        questions: sanitizedQuestions,
        status: QuestionStatus.GENERATED,
        createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      });
    }

    return {
      id: savedDoc._id,
      applicationId: savedDoc.applicationId,
      candidateId: savedDoc.candidateId,
      jobId: savedDoc.jobId,
      status: savedDoc.status,
      questions: savedDoc.questions,
      isCached: false,
      metadata: {
        totalQuestions: sanitizedQuestions.length,
        categoriesCount: this.getCategoryDistribution(sanitizedQuestions),
        retrievedTemplatesUsed: retrievedTemplates.length,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Retrieve interview questions by application ID
   */
  async getQuestionsByApplicationId(applicationId: string) {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new NotFoundException(`Invalid applicationId: ${applicationId}`);
    }
    const doc = await this.interviewQuestionsModel
      .findOne({ applicationId: new Types.ObjectId(applicationId) })
      .exec();
    if (!doc) {
      throw new NotFoundException(`No interview questions found for applicationId: ${applicationId}`);
    }
    return doc;
  }

  /**
   * Retrieve interview questions by document ID
   */
  async getQuestionsById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid interview ID: ${id}`);
    }
    const doc = await this.interviewQuestionsModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Interview question document not found: ${id}`);
    }
    return doc;
  }

  /**
   * Update questions (Human-in-the-loop: Edit, Re-order, Score, Notes)
   */
  async updateQuestions(id: string, updateDto: UpdateInterviewQuestionsDto, userId?: string) {
    const doc = await this.getQuestionsById(id);

    if (updateDto.questions) {
      doc.questions = updateDto.questions;
    }
    if (updateDto.status) {
      doc.status = updateDto.status;
    }
    if (userId && Types.ObjectId.isValid(userId)) {
      doc.createdBy = new Types.ObjectId(userId);
    }

    await doc.save();
    return {
      message: 'Interview questions updated successfully',
      id: doc._id,
      status: doc.status,
      questionsCount: doc.questions.length,
    };
  }

  /**
   * Export interview questions to Markdown, Text, or JSON format
   */
  async exportQuestions(id: string, format: 'markdown' | 'text' | 'json' = 'markdown') {
    const doc = await this.getQuestionsById(id);
    const questions: InterviewQuestionItem[] = doc.questions as any[];

    if (format === 'json') {
      return {
        id: doc._id,
        applicationId: doc.applicationId,
        status: doc.status,
        questions,
      };
    }

    if (format === 'text') {
      let output = `BỘ CÂU HỎI PHỎNG VẤN ỨNG VIÊN (ID: ${doc._id})\n`;
      output += `Trạng thái: ${doc.status} | Tổng số câu hỏi: ${questions.length}\n`;
      output += '================================================================\n\n';

      questions.forEach((q, idx) => {
        output += `[Câu ${idx + 1}] [${q.category}] [Độ khó: ${q.difficulty}]\n`;
        output += `Câu hỏi: ${q.question}\n`;
        output += `Mục đích: ${q.purpose}\n`;
        if (q.contextFromCV) output += `Ngữ cảnh CV: ${q.contextFromCV}\n`;
        output += `Điểm mong đợi:\n${q.expectedKeyPoints.map((k) => ` - ${k}`).join('\n')}\n`;
        output += `Bareme chấm điểm:\n`;
        output += ` - Kém (1-2đ): ${q.sampleRubric?.poor || 'N/A'}\n`;
        output += ` - Đạt (3-4đ): ${q.sampleRubric?.acceptable || 'N/A'}\n`;
        output += ` - Xuất sắc (5đ): ${q.sampleRubric?.excellent || 'N/A'}\n`;
        output += '----------------------------------------------------------------\n\n';
      });

      return { format: 'text', content: output };
    }

    // Default: Markdown format
    let md = `# 📋 Phiếu Phỏng Vấn Ứng Viên (AI-Generated Interview Sheet)\n\n`;
    md += `> **Mã hồ sơ**: \`${doc.applicationId}\`  \n`;
    md += `> **Trạng thái**: **${doc.status}**  \n`;
    md += `> **Tổng số câu hỏi**: ${questions.length} câu  \n\n`;
    md += `--- \n\n`;

    const categoryNames: Record<InterviewCategory, string> = {
      CLARIFICATION: '🔍 Làm Rõ & Xác Minh (Clarification)',
      TECHNICAL_DEEP_DIVE: '💻 Đào Sâu Chuyên Môn (Technical Deep-Dive)',
      SKILL_GAP: '⚠️ Khảo Sát Lỗ Hổng Kỹ Năng (Skill Gap Probing)',
      BEHAVIORAL_STAR: '🤝 Năng Lực Hành Vi (Behavioral STAR)',
    };

    questions.forEach((q, idx) => {
      md += `### ${idx + 1}. [${q.difficulty}] ${q.question}\n\n`;
      md += `* **Nhóm câu hỏi**: ${categoryNames[q.category] || q.category}\n`;
      md += `* **Mục đích đánh giá**: ${q.purpose}\n`;
      if (q.relatedSkill) {
        md += `* **Kỹ năng liên quan**: \`${q.relatedSkill}\`\n`;
      }
      if (q.contextFromCV) {
        md += `* **Dẫn chứng từ CV**: *"${q.contextFromCV}"*\n`;
      }
      md += `\n**Điểm mấu chốt cần đạt:**\n`;
      q.expectedKeyPoints.forEach((point) => {
        md += `- [ ] ${point}\n`;
      });

      md += `\n| Mức Điểm | Tiêu Chí Đánh Giá (Rubric) |\n`;
      md += `| :---: | :--- |\n`;
      md += `| **1 - 2đ** (Chưa đạt) | ${q.sampleRubric?.poor || 'Chưa đạt yêu cầu cơ bản'} |\n`;
      md += `| **3 - 4đ** (Đạt) | ${q.sampleRubric?.acceptable || 'Nắm vững kiến thức thực tế'} |\n`;
      md += `| **5đ** (Xuất sắc) | ${q.sampleRubric?.excellent || 'Có giải pháp kiến trúc và tối ưu vượt trội'} |\n\n`;
      md += `**Điểm đánh giá thực tế**: ______ / 5đ &nbsp;&nbsp;&nbsp;&nbsp; **Ghi chú**: __________________________________\n\n`;
      md += `---\n\n`;
    });

    return { format: 'markdown', content: md };
  }

  // --------------------------------------------------------------------------
  // SANITIZATION & NORMALIZATION HELPER
  // --------------------------------------------------------------------------
  private sanitizeAndValidateQuestions(
    rawQuestions: any[],
    context: InterviewGenerationPromptContext,
  ): InterviewQuestionItem[] {
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return this.generateDefaultFallbackQuestions(context);
    }

    const validCategories: InterviewCategory[] = [
      'CLARIFICATION',
      'TECHNICAL_DEEP_DIVE',
      'SKILL_GAP',
      'BEHAVIORAL_STAR',
    ];
    const validDifficulties: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

    return rawQuestions.map((q, idx) => {
      const category: InterviewCategory = validCategories.includes(q.category)
        ? q.category
        : 'TECHNICAL_DEEP_DIVE';

      const difficulty: QuestionDifficulty = validDifficulties.includes(q.difficulty)
        ? q.difficulty
        : 'MEDIUM';

      const expectedKeyPoints = Array.isArray(q.expectedKeyPoints) && q.expectedKeyPoints.length > 0
        ? q.expectedKeyPoints.map((p: any) => String(p).trim())
        : ['Nắm vững kiến thức nền tảng', 'Trình bày giải pháp thực tế có logic'];

      const sampleRubric = {
        poor: q.sampleRubric?.poor || 'Trả lời mơ hồ, sai khái niệm cơ bản hoặc không đưa ra được giải pháp.',
        acceptable: q.sampleRubric?.acceptable || 'Trả lời đúng các ý cốt lõi, có kinh nghiệm áp dụng thực tế.',
        excellent: q.sampleRubric?.excellent || 'Phân tích sâu sắc, hiểu rõ trade-offs và tối ưu giải pháp xuất sắc.',
      };

      return {
        id: q.id || `q-${idx + 1}`,
        category,
        question: String(q.question || 'Câu hỏi phỏng vấn đánh giá năng lực').trim(),
        purpose: String(q.purpose || 'Đánh giá năng lực chuyên môn và kinh nghiệm thực tế').trim(),
        difficulty,
        relatedSkill: q.relatedSkill ? String(q.relatedSkill).trim() : undefined,
        contextFromCV: q.contextFromCV ? String(q.contextFromCV).trim() : undefined,
        expectedKeyPoints,
        sampleRubric,
      };
    });
  }

  private generateDefaultFallbackQuestions(
    context: InterviewGenerationPromptContext,
  ): InterviewQuestionItem[] {
    return [
      {
        id: 'q-fb-1',
        category: 'CLARIFICATION',
        question: `Trong các dự án gần đây nhất mà bạn tham gia, vai trò và phần trách nhiệm kỹ thuật cụ thể của bạn là gì?`,
        purpose: 'Xác minh sự đóng góp thực tế trong dự án.',
        difficulty: 'MEDIUM',
        expectedKeyPoints: ['Phân định rõ ranh giới công việc', 'Nêu giải pháp kỹ thuật do mình thực hiện'],
        sampleRubric: {
          poor: 'Chỉ nói chung chung theo team.',
          acceptable: 'Nêu rõ module và tính năng mình code.',
          excellent: 'Trình bày mạch lạc từ thiết kế đến kết quả triển khai.',
        },
      },
      {
        id: 'q-fb-2',
        category: 'TECHNICAL_DEEP_DIVE',
        question: `Với vị trí ${context.jobTitle}, bạn làm thế nào để đảm bảo code sạch, có khả năng mở rộng và kiểm thử tốt?`,
        purpose: 'Đánh giá tư duy viết code và kiến trúc phần mềm.',
        difficulty: 'MEDIUM',
        expectedKeyPoints: ['Áp dụng SOLID, Clean Architecture', 'Chiến lược viết Unit/Integration Tests'],
        sampleRubric: {
          poor: 'Không quan tâm đến test hoặc cấu trúc code.',
          acceptable: 'Biết viết unit test và tổ chức module hợp lý.',
          excellent: 'Hiểu sâu về TDD, CI/CD pipeline và maintainability.',
        },
      },
    ];
  }

  private getCategoryDistribution(questions: InterviewQuestionItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      counts[q.category] = (counts[q.category] || 0) + 1;
    }
    return counts;
  }
}
