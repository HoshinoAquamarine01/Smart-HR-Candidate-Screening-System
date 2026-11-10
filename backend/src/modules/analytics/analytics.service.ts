import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Applications,
  ApplicationsDocument,
  CandidateStatus,
} from '../../schemas/applications.schema';
import { Candidates, CandidatesDocument } from '../../schemas/candidates.schema';
import { Jobs, JobsDocument } from '../../schemas/jobs.schema';
import {
  ScreeningResults,
  ScreeningResultsDocument,
} from '../../schemas/screening_results.schema';
import { Cvs, CvsDocument } from '../../schemas/cvs.schema';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

export interface StageStat {
  stage: CandidateStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface ScoreBracket {
  bracket: 'BELOW_50' | 'FROM_50_TO_75' | 'ABOVE_75';
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  color: string;
}

export interface SkillGapItem {
  skill: string;
  missingCount: number;
  percentage: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Applications.name)
    private readonly applicationsModel: Model<ApplicationsDocument>,
    @InjectModel(Candidates.name)
    private readonly candidatesModel: Model<CandidatesDocument>,
    @InjectModel(Jobs.name)
    private readonly jobsModel: Model<JobsDocument>,
    @InjectModel(ScreeningResults.name)
    private readonly screeningResultsModel: Model<ScreeningResultsDocument>,
    @InjectModel(Cvs.name)
    private readonly cvsModel: Model<CvsDocument>,
  ) {}

  
  async getDashboardOverview(query: DashboardQueryDto) {
    const appFilter: Record<string, any> = {};
    const screeningFilter: Record<string, any> = {};

    if (query.jobId) {
      if (!Types.ObjectId.isValid(query.jobId)) {
        throw new BadRequestException(`Mã tin tuyển dụng không hợp lệ: ${query.jobId}`);
      }
      const jobObjectId = new Types.ObjectId(query.jobId);
      appFilter.jobId = jobObjectId;
      screeningFilter.jobId = jobObjectId;
    }

    if (query.fromDate || query.toDate) {
      const dateFilter: Record<string, any> = {};
      if (query.fromDate) dateFilter.$gte = new Date(query.fromDate);
      if (query.toDate) dateFilter.$lte = new Date(query.toDate);
      appFilter.appliedAt = dateFilter;
    }

   
    const [applications, totalCandidates, jobs, screeningResults] = await Promise.all([
      this.applicationsModel.find(appFilter).populate('jobId', 'title department status').exec(),
      this.candidatesModel.countDocuments().exec(),
      this.jobsModel.find().select('title department status extractedCriteria').exec(),
      this.screeningResultsModel.find(screeningFilter).exec(),
    ]);

    const totalApplications = applications.length;
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === 'PUBLISHED').length;
    const totalScreened = screeningResults.length;

 
    const stageLabels: Record<CandidateStatus, string> = {
      [CandidateStatus.NEW]: 'Hồ sơ mới tiếp nhận',
      [CandidateStatus.SCREENING]: 'Đang sàng lọc AI',
      [CandidateStatus.SHORTLISTED]: 'Tiềm năng (Shortlisted)',
      [CandidateStatus.INTERVIEW]: 'Vòng phỏng vấn',
      [CandidateStatus.OFFER]: 'Đề nghị việc làm (Offer)',
      [CandidateStatus.HIRED]: 'Đã tuyển dụng (Hired)',
      [CandidateStatus.REJECTED]: 'Không phù hợp (Rejected)',
    };

    const stageCounts: Record<CandidateStatus, number> = {
      [CandidateStatus.NEW]: 0,
      [CandidateStatus.SCREENING]: 0,
      [CandidateStatus.SHORTLISTED]: 0,
      [CandidateStatus.INTERVIEW]: 0,
      [CandidateStatus.OFFER]: 0,
      [CandidateStatus.HIRED]: 0,
      [CandidateStatus.REJECTED]: 0,
    };

    for (const app of applications) {
      const st = app.candidateStatus as CandidateStatus;
      if (typeof stageCounts[st] === 'number') {
        stageCounts[st]++;
      } else {
        stageCounts[CandidateStatus.NEW]++;
      }
    }

    const stagesList: StageStat[] = Object.values(CandidateStatus).map((status) => {
      const count = stageCounts[status] || 0;
      return {
        stage: status,
        label: stageLabels[status] || status,
        count,
        percentage: totalApplications > 0 ? +((count / totalApplications) * 100).toFixed(1) : 0,
      };
    });

    const byStage: Record<string, { count: number; percentage: number; label: string }> = {};
    for (const s of stagesList) {
      byStage[s.stage] = {
        count: s.count,
        percentage: s.percentage,
        label: s.label,
      };
    }

   
    let below50 = 0;
    let from50to75 = 0;
    let above75 = 0;
    const allScores: number[] = [];

    for (const scr of screeningResults) {
      const score = typeof scr.overallMatchScore === 'number' ? scr.overallMatchScore : 0;
      allScores.push(score);

      if (score < 50) {
        below50++;
      } else if (score <= 75) {
        from50to75++;
      } else {
        above75++;
      }
    }

    const avgScore =
      allScores.length > 0
        ? +(allScores.reduce((acc, s) => acc + s, 0) / allScores.length).toFixed(1)
        : 0;

    const brackets: ScoreBracket[] = [
      {
        bracket: 'BELOW_50',
        label: 'Dưới 50% (Không phù hợp / Kém)',
        min: 0,
        max: 49.9,
        count: below50,
        percentage: totalScreened > 0 ? +((below50 / totalScreened) * 100).toFixed(1) : 0,
        color: '#EF4444', // Red
      },
      {
        bracket: 'FROM_50_TO_75',
        label: '50% - 75% (Tương thích trung bình / Tiềm năng)',
        min: 50,
        max: 75.0,
        count: from50to75,
        percentage: totalScreened > 0 ? +((from50to75 / totalScreened) * 100).toFixed(1) : 0,
        color: '#F59E0B',
      },
      {
        bracket: 'ABOVE_75',
        label: 'Trên 75% (Độ tương thích cao / Xuất sắc)',
        min: 75.1,
        max: 100,
        count: above75,
        percentage: totalScreened > 0 ? +((above75 / totalScreened) * 100).toFixed(1) : 0,
        color: '#10B981', 
      },
    ];

 
    const skillGapMap = new Map<string, number>();

    for (const scr of screeningResults) {
   
      if (Array.isArray(scr.detailedMatching)) {
        for (const item of scr.detailedMatching) {
          const isMissing =
            item.score === 0 ||
            item.matchType === 'NONE' ||
            item.matched === false ||
            item.missing === true;

          if (isMissing && item.skill && typeof item.skill === 'string') {
            const skillName = item.skill.trim();
            if (skillName.length > 0) {
              skillGapMap.set(skillName, (skillGapMap.get(skillName) || 0) + 1);
            }
          }
        }
      }

      if (Array.isArray(scr.aiRationale?.missingSkills)) {
        for (const skill of scr.aiRationale.missingSkills) {
          if (typeof skill === 'string' && skill.trim().length > 0) {
            const skillName = skill.trim();
            skillGapMap.set(skillName, (skillGapMap.get(skillName) || 0) + 1);
          }
        }
      }
    }

    const topSkillGaps: SkillGapItem[] = Array.from(skillGapMap.entries())
      .map(([skill, missingCount]) => ({
        skill,
        missingCount,
        percentage: totalScreened > 0 ? +((missingCount / totalScreened) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.missingCount - a.missingCount)
      .slice(0, 5);

  
    const jobAppMap = new Map<string, { title: string; count: number; totalScore: number; scoreCount: number }>();
    for (const app of applications) {
      const j = app.jobId as any;
      if (j && j._id) {
        const jId = j._id.toString();
        const existing = jobAppMap.get(jId) || {
          title: j.title || 'Vị trí không xác định',
          count: 0,
          totalScore: 0,
          scoreCount: 0,
        };
        existing.count++;

        const scr = screeningResults.find(
          (s) => s.applicationId?.toString() === app._id.toString(),
        );
        if (scr && typeof scr.overallMatchScore === 'number') {
          existing.totalScore += scr.overallMatchScore;
          existing.scoreCount++;
        }
        jobAppMap.set(jId, existing);
      }
    }

    const jobBreakdown = Array.from(jobAppMap.entries()).map(([jobId, data]) => ({
      jobId,
      jobTitle: data.title,
      applicantCount: data.count,
      averageScore: data.scoreCount > 0 ? +(data.totalScore / data.scoreCount).toFixed(1) : 0,
    }));

    
    const dateMap = new Map<string, number>();
    for (const app of applications) {
      const date = app.appliedAt || (app as any).createdAt;
      if (date) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    }

    const timelineTrend = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalApplications,
        totalCandidates,
        totalJobs,
        activeJobs,
        totalScreened,
        averageScore: avgScore,
      },
      pipelineDistribution: {
        total: totalApplications,
        byStage,
        stagesList,
      },
      scoreDistribution: {
        totalScreened,
        averageScore: avgScore,
        highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
        lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
        below50: {
          count: below50,
          percentage: totalScreened > 0 ? +((below50 / totalScreened) * 100).toFixed(1) : 0,
        },
        from50to75: {
          count: from50to75,
          percentage: totalScreened > 0 ? +((from50to75 / totalScreened) * 100).toFixed(1) : 0,
        },
        above75: {
          count: above75,
          percentage: totalScreened > 0 ? +((above75 / totalScreened) * 100).toFixed(1) : 0,
        },
        brackets,
      },
      topSkillGaps,
      jobBreakdown,
      timelineTrend,
    };
  }
}

