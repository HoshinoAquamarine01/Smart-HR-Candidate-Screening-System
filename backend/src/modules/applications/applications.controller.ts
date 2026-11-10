import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('api/v1/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * Get Kanban board structure grouped by candidate status columns
   * GET /api/v1/applications/kanban?jobId=...
   */
  @Get('kanban')
  async getKanbanBoard(@Query('jobId') jobId?: string) {
    return this.applicationsService.getKanbanBoard(jobId);
  }

  /**
   * List applications with filters and pagination
   * GET /api/v1/applications
   */
  @Get()
  async findAll(@Query() query: QueryApplicationDto) {
    return this.applicationsService.findAll(query);
  }

  /**
   * Get single application details with populated candidate, job, CV & screening result
   * GET /api/v1/applications/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  /**
   * Submit/create new job application
   * POST /api/v1/applications
   */
  @Post()
  async create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  /**
   * Update application status for Kanban drag-and-drop transitions ([FR-CAND-03])
   * PATCH /api/v1/applications/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, dto);
  }

  /**
   * Delete application and cascade cleanup
   * DELETE /api/v1/applications/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }
}

