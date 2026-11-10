import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Jobs, JobsDocument } from '../../schemas/jobs.schema';
import {
  Applications,
  ApplicationsDocument,
} from '../../schemas/applications.schema';
import { AiService } from '../ai/ai.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { ParseJdDto } from './dto/parse-jd.dto';
import {
  JobExtractedCriteria,
  JobStatus,
  LEVEL_SCORING_WEIGHT_PRESETS,
  SeniorityLevel,
} from './interfaces/job-criteria.interface';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectModel(Jobs.name)
    private readonly jobsModel: Model<JobsDocument>,
    @InjectModel(Applications.name)
    private readonly applicationsModel: Model<ApplicationsDocument>,
    private readonly aiService: AiService,
  ) {}

  /**
   * Creates a new job with AI-assisted criteria extraction and vector embedding
   */
  async create(dto: CreateJobDto, userId?: string) {
    this.logger.log(`Creating new Job: "${dto.title}"`);

    // 1. Extract criteria via AI if requested or not manually provided
    let extractedCriteria: JobExtractedCriteria;
    if (dto.autoExtract !== false || !dto.extractedCriteria) {
      this.logger.log('Executing AI Job Description parsing for structured criteria...');
      const aiCriteria = await this.aiService.extractJdCriteria(
        dto.rawDescription,
        dto.title,
      );
      extractedCriteria = {
        requiredSkills: dto.extractedCriteria?.requiredSkills || aiCriteria.requiredSkills || [],
        preferredSkills: dto.extractedCriteria?.preferredSkills || aiCriteria.preferredSkills || [],
        minExperienceYears:
          typeof dto.extractedCriteria?.minExperienceYears === 'number'
            ? dto.extractedCriteria.minExperienceYears
            : aiCriteria.minExperienceYears || 1,
        requiredEducation:
          dto.extractedCriteria?.requiredEducation || aiCriteria.requiredEducation || 'Đại học chuyên ngành CNTT',
        responsibilities: dto.extractedCriteria?.responsibilities || aiCriteria.responsibilities || [],
        seniorityLevel: dto.seniorityLevel || aiCriteria.seniorityLevel || 'MIDDLE',
      };
    } else {
      extractedCriteria = {
        requiredSkills: dto.extractedCriteria.requiredSkills || [],
        preferredSkills: dto.extractedCriteria.preferredSkills || [],
        minExperienceYears: dto.extractedCriteria.minExperienceYears || 1,
        requiredEducation: dto.extractedCriteria.requiredEducation || 'Đại học chuyên ngành CNTT',
        responsibilities: dto.extractedCriteria.responsibilities || [],
        seniorityLevel: dto.seniorityLevel || dto.extractedCriteria.seniorityLevel || 'MIDDLE',
      };
    }

    // 2. Determine Scoring Weights according to Seniority Level preset or custom weights
    const level: SeniorityLevel = (extractedCriteria.seniorityLevel as SeniorityLevel) || 'MIDDLE';
    const presetWeights = LEVEL_SCORING_WEIGHT_PRESETS[level] || LEVEL_SCORING_WEIGHT_PRESETS.MIDDLE;

    const scoringWeights = dto.scoringWeights || presetWeights;

    // Normalize weights to sum exactly 1.0
    const sumW =
      (scoringWeights.w_skill || 0.4) +
      (scoringWeights.w_exp || 0.25) +
      (scoringWeights.w_edu || 0.15) +
      (scoringWeights.w_semantic || 0.2);

    const normalizedWeights = {
      w_skill: Math.round(((scoringWeights.w_skill || 0.4) / sumW) * 100) / 100,
      w_exp: Math.round(((scoringWeights.w_exp || 0.25) / sumW) * 100) / 100,
      w_edu: Math.round(((scoringWeights.w_edu || 0.15) / sumW) * 100) / 100,
      w_semantic: Math.round(((scoringWeights.w_semantic || 0.2) / sumW) * 100) / 100,
    };

    // 3. Generate Vector Embedding for Job Description
    const textToEmbed = `${dto.title} ${extractedCriteria.requiredSkills.join(' ')} ${extractedCriteria.preferredSkills.join(' ')} ${dto.rawDescription.slice(0, 1500)}`;
    const embedding = await this.aiService.generateEmbedding(textToEmbed);

    // 4. Save to Database
    const createdJob = await this.jobsModel.create({
      title: dto.title.trim(),
      department: dto.department || 'Công nghệ thông tin',
      location: dto.location || 'Hà Nội / Hybrid',
      employmentType: dto.employmentType || 'FULL_TIME',
      rawDescription: dto.rawDescription,
      extractedCriteria,
      scoringWeights: normalizedWeights,
      embedding: embedding || [],
      status: dto.status || 'PUBLISHED',
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    });

    return createdJob;
  }

  /**
   * Preview AI extracted criteria from raw JD text without saving
   */
  async parseJd(dto: ParseJdDto) {
    this.logger.log(`Parsing raw JD text preview for title: "${dto.jobTitle || 'N/A'}"`);
    const criteria = await this.aiService.extractJdCriteria(dto.rawDescription, dto.jobTitle);
    const level: SeniorityLevel = criteria.seniorityLevel || 'MIDDLE';
    const suggestedWeights = LEVEL_SCORING_WEIGHT_PRESETS[level] || LEVEL_SCORING_WEIGHT_PRESETS.MIDDLE;

    return {
      extractedCriteria: criteria,
      suggestedWeights,
      previewLength: dto.rawDescription.length,
    };
  }

  /**
   * Retrieves paginated list of jobs with filtering and applicant count
   */
  async findAll(query: QueryJobDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.department) {
      filter.department = new RegExp(query.department, 'i');
    }
    if (query.employmentType) {
      filter.employmentType = query.employmentType;
    }
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { rawDescription: searchRegex }];
    }

    const [items, total] = await Promise.all([
      this.jobsModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.jobsModel.countDocuments(filter).exec(),
    ]);

    // Attach applicant count for each job
    const jobIds = items.map((j) => j._id);
    const appCounts = await this.applicationsModel.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const ac of appCounts) {
      countMap.set(ac._id.toString(), ac.count);
    }

    const enrichedItems = items.map((job) => {
      const jobObj = job.toObject();
      return {
        ...jobObj,
        applicantCount: countMap.get(job._id.toString()) || 0,
      };
    });

    return {
      items: enrichedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single job details with applicant pipeline statistics
   */
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`ID tin tuyển dụng không hợp lệ: ${id}`);
    }

    const job = await this.jobsModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID: ${id}`);
    }

    // Aggregate applicant stats
    const pipelineStats = await this.applicationsModel.aggregate([
      { $match: { jobId: new Types.ObjectId(id) } },
      { $group: { _id: '$candidateStatus', count: { $sum: 1 } } },
    ]);

    const statsByStatus: Record<string, number> = {
      NEW: 0,
      SCREENING: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    let totalApplicants = 0;

    for (const stat of pipelineStats) {
      statsByStatus[stat._id] = stat.count;
      totalApplicants += stat.count;
    }

    const jobObj = job.toObject();
    return {
      ...jobObj,
      applicantStats: {
        total: totalApplicants,
        byStatus: statsByStatus,
      },
    };
  }

  /**
   * Updates an existing job
   */
  async update(id: string, dto: UpdateJobDto, userId?: string) {
    const job = await this.jobsModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID: ${id}`);
    }

    if (dto.title) job.title = dto.title.trim();
    if (dto.department) job.department = dto.department;
    if (dto.location) job.location = dto.location;
    if (dto.employmentType) job.employmentType = dto.employmentType;
    if (dto.status) job.status = dto.status;
    if (dto.scoringWeights) job.scoringWeights = dto.scoringWeights;

    // If rawDescription is updated and re-extract requested
    if (dto.rawDescription && dto.rawDescription !== job.rawDescription) {
      job.rawDescription = dto.rawDescription;
      if (dto.reExtract !== false) {
        this.logger.log(`Re-extracting criteria for updated job: ${job._id}`);
        const aiCriteria = await this.aiService.extractJdCriteria(
          dto.rawDescription,
          job.title,
        );
        job.extractedCriteria = {
          ...job.extractedCriteria,
          ...aiCriteria,
          ...(dto.extractedCriteria || {}),
        };

        // Regenerate embedding
        const textToEmbed = `${job.title} ${(job.extractedCriteria.requiredSkills || []).join(' ')} ${job.rawDescription.slice(0, 1500)}`;
        job.embedding = await this.aiService.generateEmbedding(textToEmbed);
      }
    } else if (dto.extractedCriteria) {
      job.extractedCriteria = {
        ...job.extractedCriteria,
        ...dto.extractedCriteria,
      };
    }

    if (userId && Types.ObjectId.isValid(userId)) {
      job.createdBy = new Types.ObjectId(userId);
    }

    await job.save();
    return job;
  }

  /**
   * Quick status transition
   */
  async updateStatus(id: string, status: JobStatus) {
    const job = await this.jobsModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID: ${id}`);
    }
    job.status = status;
    await job.save();
    return {
      id: job._id,
      status: job.status,
      message: `Đã cập nhật trạng thái tin tuyển dụng sang ${status}`,
    };
  }

  /**
   * Deletes or closes a job
   */
  async remove(id: string) {
    const job = await this.jobsModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID: ${id}`);
    }

    const appCount = await this.applicationsModel.countDocuments({ jobId: new Types.ObjectId(id) }).exec();
    if (appCount > 0) {
      // Soft close if applicants exist
      job.status = 'CLOSED';
      await job.save();
      return {
        message: `Tin tuyển dụng đã có ${appCount} ứng viên nộp hồ sơ. Đã tự động chuyển trạng thái sang CLOSED thay vì xóa vĩnh viễn để bảo toàn dữ liệu.`,
        id: job._id,
        status: job.status,
        applicationsCount: appCount,
      };
    }

    await this.jobsModel.findByIdAndDelete(id).exec();
    return {
      message: 'Đã xóa tin tuyển dụng thành công',
      id,
    };
  }
}

