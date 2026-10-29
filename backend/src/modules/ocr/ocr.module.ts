import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { PdfExtractorStrategy } from './strategies/pdf-extractor.strategy';
import { DocxExtractorStrategy } from './strategies/docx-extractor.strategy';
import { ImageOcrStrategy } from './strategies/image-ocr.strategy';

@Module({
  providers: [OcrService, PdfExtractorStrategy, DocxExtractorStrategy, ImageOcrStrategy],
  exports: [OcrService],
})
export class OcrModule {}
