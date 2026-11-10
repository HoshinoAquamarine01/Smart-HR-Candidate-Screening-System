import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { ParseJdDto } from './dto/parse-jd.dto';
import type { JobStatus } from './interfaces/job-criteria.interface';

@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Create a new job with automatic AI criteria parsing & embedding
   * POST /api/v1/jobs
   */
  @Post()
  async create(@Body() dto: CreateJobDto, @Req() req: any) {
    const userId = req.user?.id || req.user?._id;
    return this.jobsService.create(dto, userId);
  }

  /**
   * Preview AI extracted criteria from raw JD without saving
   * POST /api/v1/jobs/parse-jd
   */
  @Post('parse-jd')
  async parseJd(@Body() dto: ParseJdDto) {
    return this.jobsService.parseJd(dto);
  }

  /**
   * List jobs with pagination, search, filtering
   * GET /api/v1/jobs
   */
  @Get()
  async findAll(@Query() query: QueryJobDto) {
    return this.jobsService.findAll(query);
  }

  /**
   * Get single job details + applicant stats
   * GET /api/v1/jobs/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  /**
   * Update job
   * PUT /api/v1/jobs/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.jobsService.update(id, dto, userId);
  }

  /**
   * Quick status change (DRAFT, PUBLISHED, CLOSED)
   * PATCH /api/v1/jobs/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: JobStatus,
  ) {
    return this.jobsService.updateStatus(id, status);
  }

  /**
   * Delete or archive job
   * DELETE /api/v1/jobs/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}

