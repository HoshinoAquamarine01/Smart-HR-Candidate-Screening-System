import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import type { ExtractorOutput } from '../interfaces/ocr-result.interface';

@Injectable()
export class DocxExtractorStrategy {
  private readonly logger = new Logger(DocxExtractorStrategy.name);

  async extract(buffer: Buffer): Promise<ExtractorOutput> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        rawText: result.value || '',
        extractorUsed: 'mammoth',
        isScanned: false,
        confidenceScore: 98,
      };
    } catch (error) {
      this.logger.error(
        'DOCX extraction failed',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        rawText: '',
        extractorUsed: 'raw-fallback',
        isScanned: false,
        confidenceScore: 0,
      };
    }
  }
}
