import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { QueryCandidateDto } from './dto/query-candidate.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';

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
}
