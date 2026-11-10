import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Candidates, CandidatesDocument } from '../../schemas/candidates.schema';
import {
  Applications,
  ApplicationsDocument,
  CandidateStatus,
} from '../../schemas/applications.schema';
import { Cvs, CvsDocument } from '../../schemas/cvs.schema';
import { Jobs, JobsDocument } from '../../schemas/jobs.schema';
import {
  ScreeningResults,
  ScreeningResultsDocument,
} from '../../schemas/screening_results.schema';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { QueryCandidateDto } from './dto/query-candidate.dto';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    @InjectModel(Candidates.name)
    private readonly candidatesModel: Model<CandidatesDocument>,
    @InjectModel(Applications.name)
    private readonly applicationsModel: Model<ApplicationsDocument>,
    @InjectModel(Cvs.name)
    private readonly cvsModel: Model<CvsDocument>,
    @InjectModel(Jobs.name)
    private readonly jobsModel: Model<JobsDocument>,
    @InjectModel(ScreeningResults.name)
    private readonly screeningResultsModel: Model<ScreeningResultsDocument>,
  ) {}

 
  async findAll(query: QueryCandidateDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const candidateFilter: Record<string, any> = {};

    
    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      candidateFilter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { currentTitle: searchRegex },
      ];
    }

  
    if (query.jobId || query.status) {
      const appMatch: Record<string, any> = {};
      if (query.jobId && Types.ObjectId.isValid(query.jobId)) {
        appMatch.jobId = new Types.ObjectId(query.jobId);
      }
      if (query.status) {
        appMatch.candidateStatus = query.status;
      }

      const matchingApps = await this.applicationsModel.find(appMatch).select('candidateId').exec();
      const candidateIds = matchingApps.map((a) => a.candidateId);
      candidateFilter._id = { $in: candidateIds };
    }

   
    if (query.skill && query.skill.trim() !== '') {
      const skillRegex = new RegExp(query.skill.trim(), 'i');
      const cvsWithSkill = await this.cvsModel
        .find({
          $or: [
            { 'parsedData.skills.technical': skillRegex },
            { 'parsedData.skills.soft': skillRegex },
          ],
        })
        .select('candidateId')
        .exec();

      const candidateIdsWithSkill = cvsWithSkill.map((c) => c.candidateId);
      if (candidateFilter._id) {
     
        const existingIds: Types.ObjectId[] = candidateFilter._id.$in || [];
        const existingIdStrs = new Set(existingIds.map((id) => id.toString()));
        candidateFilter._id = {
          $in: candidateIdsWithSkill.filter((id) => existingIdStrs.has(id.toString())),
        };
      } else {
        candidateFilter._id = { $in: candidateIdsWithSkill };
      }
    }

    const [candidates, total] = await Promise.all([
      this.candidatesModel
        .find(candidateFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.candidatesModel.countDocuments(candidateFilter).exec(),
    ]);

    // 4. Enrich each candidate with latest CV, Application status & Match score
    const candidateIds = candidates.map((c) => c._id);

    const [cvsList, appsList, screeningList] = await Promise.all([
      this.cvsModel.find({ candidateId: { $in: candidateIds } }).sort({ createdAt: -1 }).exec(),
      this.applicationsModel.find({ candidateId: { $in: candidateIds } }).populate('jobId', 'title department').exec(),
      this.screeningResultsModel.find({ candidateId: { $in: candidateIds } }).exec(),
    ]);


    const cvMap = new Map<string, any>();
    for (const cv of cvsList) {
      const key = cv.candidateId.toString();
      if (!cvMap.has(key)) {
        cvMap.set(key, cv);
      }
    }

    const appMap = new Map<string, any>();
    for (const app of appsList) {
      const key = app.candidateId.toString();
      if (!appMap.has(key) || (query.jobId && app.jobId?._id?.toString() === query.jobId)) {
        appMap.set(key, app);
      }
    }

   
    const scoreMap = new Map<string, any>();
    for (const res of screeningList) {
      const key = res.candidateId.toString();
      if (!scoreMap.has(key) || (query.jobId && res.jobId?.toString() === query.jobId)) {
        scoreMap.set(key, res);
      }
    }

    const items = candidates.map((cand) => {
      const candIdStr = cand._id.toString();
      const latestCv = cvMap.get(candIdStr);
      const app = appMap.get(candIdStr);
      const screening = scoreMap.get(candIdStr);

      const parsedData = latestCv?.parsedData || {};
      const skills: string[] = [
        ...((parsedData.skills?.technical as string[]) || []),
        ...((parsedData.skills?.soft as string[]) || []),
      ];

      return {
        _id: cand._id,
        id: cand._id.toString(),
        fullName: cand.fullName,
        email: cand.email || '',
        phone: cand.phone || '',
        location: cand.location || '',
        currentTitle: cand.currentTitle || (parsedData.personalInfo?.currentTitle as string) || 'Chuyên viên kỹ thuật',
        summary: cand.summary || (parsedData.personalInfo?.summary as string) || '',
        skills: skills.length > 0 ? skills : ['JavaScript', 'TypeScript'],
        totalYearsExperience: typeof parsedData.totalYearsExperience === 'number' ? parsedData.totalYearsExperience : 2,
        status: app?.candidateStatus || CandidateStatus.NEW,
        appliedJob: app?.jobId ? { id: app.jobId._id, title: app.jobId.title, department: app.jobId.department } : null,
        matchScore: screening ? screening.overallMatchScore : null,
        screeningBreakdown: screening
          ? {
              skillScore: screening.skillMatchScore,
              expScore: screening.experienceMatchScore,
              eduScore: screening.educationMatchScore,
            }
          : null,
        cvFileUrl: latestCv?.fileUrl || null,
        createdAt: (cand as any).createdAt || new Date(),
      };
    });

   
    const filteredItems = typeof query.minScore === 'number'
      ? items.filter((item) => (item.matchScore || 0) >= query.minScore!)
      : items;

    return {
      items: filteredItems,
      total: typeof query.minScore === 'number' ? filteredItems.length : total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

 
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Mã ứng viên không hợp lệ: ${id}`);
    }

    const candidate = await this.candidatesModel.findById(id).exec();
    if (!candidate) {
      throw new NotFoundException(`Không tìm thấy ứng viên với mã: ${id}`);
    }

    const [cvs, applications, screeningResults] = await Promise.all([
      this.cvsModel.find({ candidateId: candidate._id }).sort({ createdAt: -1 }).exec(),
      this.applicationsModel.find({ candidateId: candidate._id }).populate('jobId', 'title department location employmentType').sort({ createdAt: -1 }).exec(),
      this.screeningResultsModel.find({ candidateId: candidate._id }).exec(),
    ]);

    const latestCv = cvs[0];
    const parsedData = latestCv?.parsedData || {};

    return {
      _id: candidate._id,
      id: candidate._id.toString(),
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      currentTitle: candidate.currentTitle || (parsedData.personalInfo?.currentTitle as string) || '',
      summary: candidate.summary || (parsedData.personalInfo?.summary as string) || '',
      anonymized: candidate.anonymized,
      parsedProfile: {
        totalYearsExperience: parsedData.totalYearsExperience || 0,
        skills: parsedData.skills || { technical: [], soft: [] },
        workExperience: parsedData.workExperience || [],
        projects: parsedData.projects || [],
        education: parsedData.education || [],
        certifications: parsedData.certifications || [],
      },
      cvs: cvs.map((cv) => ({
        id: cv._id,
        fileName: cv.fileName,
        fileUrl: cv.fileUrl,
        fileSize: cv.fileSize,
        uploadedAt: (cv as any).createdAt || new Date(),
      })),
      applications: applications.map((app) => {
        const score = screeningResults.find((s) => s.applicationId?.toString() === app._id.toString());
        return {
          id: app._id,
          job: app.jobId,
          candidateStatus: app.candidateStatus,
          aiPipelineStatus: app.aiPipelineStatus,
          matchScore: score ? score.overallMatchScore : null,
          screeningResults: score
            ? {
                skillMatchScore: score.skillMatchScore,
                experienceMatchScore: score.experienceMatchScore,
                educationMatchScore: score.educationMatchScore,
                detailedMatching: score.detailedMatching,
                aiRationale: score.aiRationale,
              }
            : null,
          appliedAt: (app as any).createdAt || new Date(),
        };
      }),
      createdAt: (candidate as any).createdAt || new Date(),
      updatedAt: (candidate as any).updatedAt || new Date(),
    };
  }


  async create(dto: CreateCandidateDto) {
    if (dto.email && dto.email.trim() !== '') {
      const existing = await this.candidatesModel.findOne({ email: dto.email.trim().toLowerCase() }).exec();
      if (existing) {
        this.logger.log(`Candidate with email ${dto.email} already exists. Returning existing record.`);
        return existing;
      }
    }

    const created = await this.candidatesModel.create({
      fullName: dto.fullName.trim(),
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      phone: dto.phone ? dto.phone.trim() : undefined,
      location: dto.location,
      currentTitle: dto.currentTitle,
      summary: dto.summary,
      anonymized: false,
    });

    return created;
  }


  async update(id: string, dto: UpdateCandidateDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Mã ứng viên không hợp lệ: ${id}`);
    }

    const candidate = await this.candidatesModel.findById(id).exec();
    if (!candidate) {
      throw new NotFoundException(`Không tìm thấy ứng viên: ${id}`);
    }

    if (dto.fullName) candidate.fullName = dto.fullName.trim();
    if (dto.email) candidate.email = dto.email.trim().toLowerCase();
    if (dto.phone) candidate.phone = dto.phone.trim();
    if (dto.location) candidate.location = dto.location;
    if (dto.currentTitle) candidate.currentTitle = dto.currentTitle;
    if (dto.summary) candidate.summary = dto.summary;
    if (typeof dto.anonymized === 'boolean') candidate.anonymized = dto.anonymized;

    await candidate.save();
    return candidate;
  }

  
  async updateStatus(candidateId: string, dto: UpdateCandidateStatusDto) {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException(`Mã ứng viên không hợp lệ: ${candidateId}`);
    }

    const candidate = await this.candidatesModel.findById(candidateId).exec();
    if (!candidate) {
      throw new NotFoundException(`Không tìm thấy ứng viên: ${candidateId}`);
    }

  
    const appQuery: Record<string, any> = { candidateId: candidate._id };
    if (dto.jobId && Types.ObjectId.isValid(dto.jobId)) {
      appQuery.jobId = new Types.ObjectId(dto.jobId);
    }

    let application = await this.applicationsModel.findOne(appQuery).sort({ createdAt: -1 }).exec();

    if (application) {
      application.candidateStatus = dto.status;
      await application.save();
    } else if (dto.jobId && Types.ObjectId.isValid(dto.jobId)) {

      application = await this.applicationsModel.create({
        candidateId: candidate._id,
        jobId: new Types.ObjectId(dto.jobId),
        candidateStatus: dto.status,
      });
    } else {
      throw new NotFoundException(`Ứng viên chưa có hồ sơ ứng tuyển nào để cập nhật trạng thái.`);
    }

    return {
      message: `Đã cập nhật trạng thái ứng viên thành công sang ${dto.status}`,
      candidateId: candidate._id,
      applicationId: application._id,
      status: application.candidateStatus,
    };
  }

  
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Mã ứng viên không hợp lệ: ${id}`);
    }

    const candidate = await this.candidatesModel.findById(id).exec();
    if (!candidate) {
      throw new NotFoundException(`Không tìm thấy ứng viên: ${id}`);
    }

    await Promise.all([
      this.candidatesModel.findByIdAndDelete(id).exec(),
      this.applicationsModel.deleteMany({ candidateId: new Types.ObjectId(id) }).exec(),
    ]);

    return {
      message: 'Đã xóa hồ sơ ứng viên thành công',
      id,
    };
  }
}
