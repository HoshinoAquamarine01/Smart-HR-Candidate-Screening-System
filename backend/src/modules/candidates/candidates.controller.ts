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
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { QueryCandidateDto } from './dto/query-candidate.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';

@Controller('api/v1/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}


  @Get()
  async findAll(@Query() query: QueryCandidateDto) {
    return this.candidatesService.findAll(query);
  }


  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  
  @Post()
  async create(@Body() dto: CreateCandidateDto) {
    return this.candidatesService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(id, dto);
  }


  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateStatusDto,
  ) {
    return this.candidatesService.updateStatus(id, dto);
  }


  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
