import { Controller, Post, Body } from '@nestjs/common';
import { CvService } from './cv.service';
import { ParseCvDto } from './dto/parse-cv.dto';

@Controller('api/v1/cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('parse')
  async parseCv(@Body() parseCvDto: ParseCvDto) {
    return this.cvService.parseCv(parseCvDto);
  }
}
