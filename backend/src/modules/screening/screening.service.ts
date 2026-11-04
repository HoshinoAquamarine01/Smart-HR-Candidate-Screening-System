import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cvs, CvsDocument } from '../../schemas/cvs.schema';
import { Jobs, JobsDocument } from '../../schemas/jobs.schema';
import {
  ScreeningResults,
  ScreeningResultsDocument,
} from '../../schemas/screening_results.schema';
import { Candidates, CandidatesDocument } from '../../schemas/candidates.schema';
import { MatchingEngineService } from './services/matching-engine.service';
import { SkillTaxonomyService } from './services/skill-taxonomy.service';
import { AiService } from '../ai/ai.service';
import { MatchScreeningDto } from './dto/match-screening.dto';
import { MatchingResultDto } from './dto/screening-result.dto';

@Injectable()
export class ScreeningService {
  private readonly logger = new Logger(ScreeningService.name);

  constructor(
    private readonly matchingEngine: MatchingEngineService,
    private readonly skillTaxonomyService: SkillTaxonomyService,
    private readonly aiService?: AiService,
    @InjectModel(Cvs.name)
    private readonly cvModel?: Model<CvsDocument>,
    @InjectModel(Jobs.name)
    private readonly jobModel?: Model<JobsDocument>,
    @InjectModel(ScreeningResults.name)
    private readonly screeningResultModel?: Model<ScreeningResultsDocument>,
    @InjectModel(Candidates.name)
    private readonly candidateModel?: Model<CandidatesDocument>,
  ) {}

  
  async matchScreening(dto: MatchScreeningDto): Promise<MatchingResultDto> {
    let profileData = dto.candidateProfileData;
    let jobCriteria = {
      requiredSkills: dto.requiredSkills || [],
      preferredSkills: dto.preferredSkills || [],
      requiredYearsOfExperience: dto.requiredYearsOfExperience || 0,
      requiredDegree: dto.requiredDegree || 'Bachelor',
      requiredFieldOfStudy: dto.requiredFieldOfStudy || 'Computer Science',
      jobDescriptionText: dto.jobDescriptionText || '',
    };

   
    if (dto.cvId && this.cvModel) {
      const cvDoc = await this.cvModel.findById(dto.cvId).exec();
      if (cvDoc && cvDoc.parsedData) {
        profileData = cvDoc.parsedData;
      }
    }

 
    if (dto.jobId && this.jobModel) {
      const jobDoc = await this.jobModel.findById(dto.jobId).exec();
      if (jobDoc) {
        const criteria = jobDoc.extractedCriteria || {};
        jobCriteria = {
          requiredSkills: criteria.requiredSkills || jobCriteria.requiredSkills,
          preferredSkills: criteria.preferredSkills || jobCriteria.preferredSkills,
          requiredYearsOfExperience: criteria.minYearsOfExperience || jobCriteria.requiredYearsOfExperience,
          requiredDegree: criteria.requiredDegree || jobCriteria.requiredDegree,
          requiredFieldOfStudy: criteria.fieldOfStudy || jobCriteria.requiredFieldOfStudy,
          jobDescriptionText: jobDoc.rawDescription || jobCriteria.jobDescriptionText,
        };
      }
    }


    const fullDto: MatchScreeningDto = {
      ...dto,
      candidateProfileData: profileData,
      requiredSkills: jobCriteria.requiredSkills,
      preferredSkills: jobCriteria.preferredSkills,
      requiredYearsOfExperience: jobCriteria.requiredYearsOfExperience,
      requiredDegree: jobCriteria.requiredDegree,
      requiredFieldOfStudy: jobCriteria.requiredFieldOfStudy,
      jobDescriptionText: jobCriteria.jobDescriptionText,
    };

    // 4. Chuẩn bị Vector Map cho các kỹ năng lạ / ngoài từ điển
    const vectorMap = new Map<string, number[]>();
    if (this.aiService) {
      const allSkills = new Set<string>([
        ...(jobCriteria.requiredSkills || []),
        ...(jobCriteria.preferredSkills || []),
        ...(profileData?.skills?.technicalSkills || []),
        ...(profileData?.skills?.toolsAndFrameworks || []),
      ]);

      for (const skill of allSkills) {
        if (!this.skillTaxonomyService.findTaxonomyEntry(skill)) {
          try {
            const vec = await this.aiService.generateEmbedding(skill);
            if (vec && vec.length > 0) {
              vectorMap.set(skill, vec);
            }
          } catch (e) {
            // Fallback safe
          }
        }
      }
    }

    const result = this.matchingEngine.evaluateCandidateFit(fullDto, vectorMap);

   
    if (dto.cvId && dto.jobId && this.screeningResultModel) {
      try {
        await this.screeningResultModel.findOneAndUpdate(
          {
            candidateId: new Types.ObjectId(dto.cvId),
            jobId: new Types.ObjectId(dto.jobId),
          },
          {
            skillMatchScore: result.breakdown.skillScore,
            experienceMatchScore: result.breakdown.experienceScore,
            educationMatchScore: result.breakdown.educationScore,
            certificationMatchScore: 100,
            overallMatchScore: result.totalScore,
            detailedMatching: result.skillAnalysis.details,
            aiRationale: { summary: result.rationale, warnings: result.warningFlags || [] },
            metadata: {
              weights: result.weightsApplied,
              semanticScore: result.breakdown.semanticScore,
            },
          },
          { upsert: true, new: true },
        );
      } catch (err: any) {
        this.logger.warn(`Could not persist screening result: ${err.message}`);
      }
    }

    return result;
  }

  async rankCandidatesForJob(
    jobId: string,
    limit: number = 20,
  ): Promise<{
    jobId: string;
    totalCandidates: number;
    rankedCandidates: (MatchingResultDto & { candidateId: string; candidateName: string })[];
  }> {
    if (!this.jobModel || !this.cvModel) {
      throw new Error('Database models are not initialized.');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }

    const cvs = await this.cvModel.find().limit(100).exec();
    const ranked: (MatchingResultDto & { candidateId: string; candidateName: string })[] = [];

    for (const cv of cvs) {
      const match = await this.matchScreening({
        cvId: cv._id.toString(),
        jobId: job._id.toString(),
        candidateProfileData: cv.parsedData,
      });

      const candName = cv.parsedData?.personalInfo?.fullName || cv.fileName || 'Ứng viên ẩn danh';

      ranked.push({
        ...match,
        candidateId: cv.candidateId ? cv.candidateId.toString() : cv._id.toString(),
        candidateName: candName,
      });
    }

 
    ranked.sort((a, b) => b.totalScore - a.totalScore);

   
    ranked.forEach((item, index) => {
      item.rankingIndex = index + 1;
    });

    return {
      jobId,
      totalCandidates: ranked.length,
      rankedCandidates: ranked.slice(0, limit),
    };
  }

 
  lookupSkill(skillName: string) {
    const entry = this.skillTaxonomyService.findTaxonomyEntry(skillName);
    return {
      searched: skillName,
      standardName: entry ? entry.standardName : this.skillTaxonomyService.normalizeSkillName(skillName),
      category: entry ? entry.category : 'general',
      aliases: entry ? entry.aliases : [],
      relatedSkills: entry ? entry.relatedSkills : [],
    };
  }
}
