import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCandidateDto extends PaginationDto {
  status?: string;
  minScore?: number;
  skill?: string;
}
