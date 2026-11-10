import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Applications,
  ApplicationsDocument,
  CandidateStatus,
  AiPipelineStatus,
} from '../../schemas/applications.schema';
import { Candidates, CandidatesDocument } from '../../schemas/candidates.schema';
import { Jobs, JobsDocument } from '../../schemas/jobs.schema';
import { Cvs, CvsDocument } from '../../schemas/cvs.schema';
import {
  ScreeningResults,
  ScreeningResultsDocument,
} from '../../schemas/screening_results.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
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
  ) {}

  /**
   * Retrieves applications with multi-faceted filtering, candidate search, and match score enrichment
   */
  async findAll(query: QueryApplicationDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.jobId) {
      if (!Types.ObjectId.isValid(query.jobId)) {
        throw new BadRequestException(`Mã tin tuyển dụng không hợp lệ: ${query.jobId}`);
      }
      filter.jobId = new Types.ObjectId(query.jobId);
    }

    if (query.candidateId) {
      if (!Types.ObjectId.isValid(query.candidateId)) {
        throw new BadRequestException(`Mã ứng viên không hợp lệ: ${query.candidateId}`);
      }
      filter.candidateId = new Types.ObjectId(query.candidateId);
    }

    if (query.status) {
      filter.candidateStatus = query.status;
    }

    if (query.aiPipelineStatus) {
      filter.aiPipelineStatus = query.aiPipelineStatus;
    }

    // Filter by candidate keyword search (name, email)
    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      const matchingCandidates = await this.candidatesModel
        .find({
          $or: [{ fullName: searchRegex }, { email: searchRegex }],
        })
        .select('_id')
        .exec();

      const candidateIds = matchingCandidates.map((c) => c._id);
      if (filter.candidateId) {
        // Intersect candidateId
        if (!candidateIds.some((id) => id.toString() === filter.candidateId.toString())) {
          return { items: [], total: 0, page, limit, totalPages: 0 };
        }
      } else {
        filter.candidateId = { $in: candidateIds };
      }
    }

    const total = await this.applicationsModel.countDocuments(filter).exec();

    const rawApps = await this.applicationsModel
      .find(filter)
      .populate('candidateId', 'fullName email phone currentTitle location anonymized')
      .populate('jobId', 'title department location employmentType status')
      .populate('cvId', 'fileName fileUrl fileSize parsedData')
      .sort({ appliedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const appIds = rawApps.map((a) => a._id);
    const screeningResults = await this.screeningResultsModel
      .find({ applicationId: { $in: appIds } })
      .exec();

    const items = rawApps.map((app) => {
      const scr = screeningResults.find(
        (s) => s.applicationId?.toString() === app._id.toString(),
      );
      const cand = app.candidateId as any;
      const job = app.jobId as any;
      const cv = app.cvId as any;

      return {
        _id: app._id,
        id: app._id.toString(),
        candidateId: cand ? cand._id : app.candidateId,
        candidateName: cand ? cand.fullName : 'Chưa cập nhật',
        candidateEmail: cand ? cand.email : '',
        candidatePhone: cand ? cand.phone : '',
        candidateTitle: cand ? cand.currentTitle : '',
        jobId: job ? job._id : app.jobId,
        jobTitle: job ? job.title : 'Chưa cập nhật',
        jobDepartment: job ? job.department : '',
        cvId: cv ? cv._id : app.cvId,
        cvFileName: cv ? cv.fileName : '',
        cvFileUrl: cv ? cv.fileUrl : null,
        candidateStatus: app.candidateStatus,
        aiPipelineStatus: app.aiPipelineStatus,
        matchScore: scr ? scr.overallMatchScore : null,
        screeningScores: scr
          ? {
              skillScore: scr.skillMatchScore,
              experienceScore: scr.experienceMatchScore,
              educationScore: scr.educationMatchScore,
              certificationScore: scr.certificationMatchScore,
            }
          : null,
        recruiterDecision: app.recruiterDecision || null,
        appliedAt: app.appliedAt || (app as any).createdAt || new Date(),
        createdAt: (app as any).createdAt || new Date(),
        updatedAt: (app as any).updatedAt || new Date(),
      };
    });

    // Optional post-filter by minScore
    const filteredItems =
      typeof query.minScore === 'number'
        ? items.filter((item) => (item.matchScore || 0) >= query.minScore!)
        : items;

    return {
      items: filteredItems,
      total: typeof query.minScore === 'number' ? filteredItems.length : total,
      page,
      limit,
      totalPages: Math.ceil((typeof query.minScore === 'number' ? filteredItems.length : total) / limit),
    };
  }

  /**
   * Retrieves single application detail with populated relationships and full screening report
   */
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Mã đơn ứng tuyển không hợp lệ: ${id}`);
    }

    const application = await this.applicationsModel
      .findById(id)
      .populate('candidateId')
      .populate('jobId')
      .populate('cvId')
      .exec();

    if (!application) {
      throw new NotFoundException(`Không tìm thấy đơn ứng tuyển với mã: ${id}`);
    }

    const screeningResult = await this.screeningResultsModel
      .findOne({ applicationId: application._id })
      .exec();

    return {
      _id: application._id,
      id: application._id.toString(),
      candidate: application.candidateId,
      job: application.jobId,
      cv: application.cvId,
      candidateStatus: application.candidateStatus,
      aiPipelineStatus: application.aiPipelineStatus,
      matchScore: screeningResult ? screeningResult.overallMatchScore : null,
      screeningResult: screeningResult || null,
      recruiterDecision: application.recruiterDecision || null,
      appliedAt: application.appliedAt,
      createdAt: (application as any).createdAt || new Date(),
      updatedAt: (application as any).updatedAt || new Date(),
    };
  }

  /**
   * Creates a new application with deduplication check (candidate cannot apply twice to the same job)
   */
  async create(dto: CreateApplicationDto) {
    if (!Types.ObjectId.isValid(dto.candidateId)) {
      throw new BadRequestException(`Mã ứng viên không hợp lệ: ${dto.candidateId}`);
    }
    if (!Types.ObjectId.isValid(dto.jobId)) {
      throw new BadRequestException(`Mã tin tuyển dụng không hợp lệ: ${dto.jobId}`);
    }
    if (!Types.ObjectId.isValid(dto.cvId)) {
      throw new BadRequestException(`Mã CV không hợp lệ: ${dto.cvId}`);
    }

    // Verify entities exist
    const [candidate, job, cv] = await Promise.all([
      this.candidatesModel.findById(dto.candidateId).exec(),
      this.jobsModel.findById(dto.jobId).exec(),
      this.cvsModel.findById(dto.cvId).exec(),
    ]);

    if (!candidate) {
      throw new NotFoundException(`Không tìm thấy ứng viên: ${dto.candidateId}`);
    }
    if (!job) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng: ${dto.jobId}`);
    }
    if (!cv) {
      throw new NotFoundException(`Không tìm thấy hồ sơ CV: ${dto.cvId}`);
    }

    // Deduplication check: check if already applied
    const existing = await this.applicationsModel
      .findOne({
        candidateId: new Types.ObjectId(dto.candidateId),
        jobId: new Types.ObjectId(dto.jobId),
      })
      .exec();

    if (existing) {
      this.logger.log(
        `Application already exists for candidate ${dto.candidateId} on job ${dto.jobId}. Returning existing.`,
      );
      return existing;
    }

    const application = await this.applicationsModel.create({
      candidateId: new Types.ObjectId(dto.candidateId),
      jobId: new Types.ObjectId(dto.jobId),
      cvId: new Types.ObjectId(dto.cvId),
      candidateStatus: dto.candidateStatus || CandidateStatus.NEW,
      aiPipelineStatus: dto.aiPipelineStatus || AiPipelineStatus.UPLOADED,
      recruiterDecision: dto.recruiterDecision || {
        history: [
          {
            fromStatus: null,
            toStatus: dto.candidateStatus || CandidateStatus.NEW,
            timestamp: new Date(),
            note: 'Hồ sơ mới nộp vào hệ thống',
            decidedBy: 'System / Candidate',
          },
        ],
      },
      appliedAt: new Date(),
    });

    this.logger.log(`Created application ${application._id} for candidate ${dto.candidateId} to job ${dto.jobId}`);
    return application;
  }

  /**
   * Updates candidate status in Kanban pipeline ([FR-CAND-03])
   * Supports dragging and dropping candidate cards across Kanban columns:
   * NEW -> SCREENING -> SHORTLISTED -> INTERVIEW -> OFFER -> HIRED / REJECTED
   * Endpoint: PATCH /api/v1/applications/:id/status
   */
  async updateStatus(id: string, dto: UpdateApplicationStatusDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Mã đơn ứng tuyển không hợp lệ: ${id}`);
    }

    const application = await this.applicationsModel.findById(id).exec();
    if (!application) {
      throw new NotFoundException(`Không tìm thấy đơn ứng tuyển với mã: ${id}`);
    }

    const previousStatus = application.candidateStatus;
    const newStatus = dto.status;

    // Record decision audit trail
    const existingDecision = application.recruiterDecision || {};
    const existingHistory = Array.isArray(existingDecision.history) ? existingDecision.history : [];

    const newHistoryEntry = {
      fromStatus: previousStatus,
      toStatus: newStatus,
      timestamp: new Date(),
      note: dto.note || `Chuyển trạng thái từ ${previousStatus} sang ${newStatus}`,
      decidedBy: dto.decidedBy || 'Recruiter',
      reason: dto.reason || null,
      offerDetails: dto.offerDetails || null,
    };

    application.candidateStatus = newStatus;
    application.recruiterDecision = {
      ...existingDecision,
      currentStatus: newStatus,
      previousStatus,
      lastUpdated: new Date(),
      note: dto.note || existingDecision.note,
      decidedBy: dto.decidedBy || existingDecision.decidedBy || 'Recruiter',
      reason: dto.reason || existingDecision.reason,
      offerDetails: dto.offerDetails || existingDecision.offerDetails,
      metadata: dto.metadata || existingDecision.metadata,
      history: [...existingHistory, newHistoryEntry],
    };

    await application.save();

    this.logger.log(
      `Updated application ${id} status: ${previousStatus} -> ${newStatus} by ${dto.decidedBy || 'Recruiter'}`,
    );

    return {
      message: `Cập nhật trạng thái ứng viên thành công sang ${newStatus}`,
      applicationId: application._id,
      candidateStatus: application.candidateStatus,
      previousStatus,
      recruiterDecision: application.recruiterDecision,
      updatedAt: (application as any).updatedAt || new Date(),
    };
  }

  /**
   * Generates Kanban Board structure grouped by CandidateStatus columns
   * Ready for direct frontend rendering with drag-and-drop support
   */
  async getKanbanBoard(jobId?: string) {
    const filter: Record<string, any> = {};
    if (jobId) {
      if (!Types.ObjectId.isValid(jobId)) {
        throw new BadRequestException(`Mã tin tuyển dụng không hợp lệ: ${jobId}`);
      }
      filter.jobId = new Types.ObjectId(jobId);
    }

    const applications = await this.applicationsModel
      .find(filter)
      .populate('candidateId', 'fullName email phone currentTitle anonymized')
      .populate('jobId', 'title department')
      .populate('cvId', 'fileName fileUrl')
      .sort({ appliedAt: -1 })
      .exec();

    const appIds = applications.map((a) => a._id);
    const screeningResults = await this.screeningResultsModel
      .find({ applicationId: { $in: appIds } })
      .exec();

    const scoreMap = new Map<string, number>();
    for (const scr of screeningResults) {
      scoreMap.set(scr.applicationId.toString(), scr.overallMatchScore);
    }

    const columns: Record<string, { id: CandidateStatus; title: string; count: number; cards: any[] }> = {
      [CandidateStatus.NEW]: {
        id: CandidateStatus.NEW,
        title: 'Hồ sơ mới (New)',
        count: 0,
        cards: [],
      },
      [CandidateStatus.SCREENING]: {
        id: CandidateStatus.SCREENING,
        title: 'Đang sàng lọc (Screening)',
        count: 0,
        cards: [],
      },
      [CandidateStatus.SHORTLISTED]: {
        id: CandidateStatus.SHORTLISTED,
        title: 'Tiềm năng (Shortlisted)',
        count: 0,
        cards: [],
      },
      [CandidateStatus.INTERVIEW]: {
        id: CandidateStatus.INTERVIEW,
        title: 'Phỏng vấn (Interview)',
        count: 0,
        cards: [],
      },
      [CandidateStatus.OFFER]: {
        id: CandidateStatus.OFFER,
        title: 'Đề nghị việc làm (Offer)',
        count: 0,
        cards: [],
      },
      [CandidateStatus.HIRED]: {
        id: CandidateStatus.HIRED,
        title: 'Đã tuyển dụng (Hired)',
        count: 0,
        cards: [],
      },
      [CandidateStatus.REJECTED]: {
        id: CandidateStatus.REJECTED,
        title: 'Từ chối (Rejected)',
        count: 0,
        cards: [],
      },
    };

    for (const app of applications) {
      const colKey = app.candidateStatus as CandidateStatus;
      if (columns[colKey]) {
        const cand = app.candidateId as any;
        const job = app.jobId as any;
        const cv = app.cvId as any;
        const matchScore = scoreMap.get(app._id.toString()) ?? null;

        columns[colKey].cards.push({
          applicationId: app._id,
          candidateId: cand ? cand._id : app.candidateId,
          candidateName: cand ? cand.fullName : 'Chưa cập nhật',
          candidateEmail: cand ? cand.email : '',
          candidateTitle: cand ? cand.currentTitle : '',
          jobId: job ? job._id : app.jobId,
          jobTitle: job ? job.title : '',
          jobDepartment: job ? job.department : '',
          cvFileName: cv ? cv.fileName : '',
          matchScore,
          aiPipelineStatus: app.aiPipelineStatus,
          appliedAt: app.appliedAt || (app as any).createdAt,
          lastNote: app.recruiterDecision?.note || null,
        });
        columns[colKey].count++;
      }
    }

    return {
      jobId: jobId || null,
      totalApplications: applications.length,
      columns: Object.values(columns),
    };
  }

  /**
   * Deletes an application and cleans up associated screening result
   */
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Mã đơn ứng tuyển không hợp lệ: ${id}`);
    }

    const application = await this.applicationsModel.findByIdAndDelete(id).exec();
    if (!application) {
      throw new NotFoundException(`Không tìm thấy đơn ứng tuyển: ${id}`);
    }

    // Cascade delete screening result
    await this.screeningResultsModel.deleteMany({ applicationId: application._id }).exec();

    this.logger.log(`Deleted application ${id} and associated screening results`);
    return {
      message: 'Xóa đơn ứng tuyển thành công',
      deletedApplicationId: id,
    };
  }
}

