import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { ExtractorOutput, OcrResult } from './interfaces/ocr-result.interface';
import { PdfExtractorStrategy } from './strategies/pdf-extractor.strategy';
import { DocxExtractorStrategy } from './strategies/docx-extractor.strategy';
import { ImageOcrStrategy } from './strategies/image-ocr.strategy';
import { TextSanitizerUtil } from './utils/text-sanitizer.util';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly pdfExtractor: PdfExtractorStrategy,
    private readonly docxExtractor: DocxExtractorStrategy,
    private readonly imageOcr: ImageOcrStrategy,
  ) {}

  async extractText(
    filePath: string,
    mimeType?: string,
    buffer?: Buffer,
  ): Promise<OcrResult> {
    try {
      const fileBuffer = this.resolveBuffer(filePath, buffer);
      if (!fileBuffer) {
        return this.toResult({
          rawText: '',
          extractorUsed: 'raw-fallback',
          isScanned: false,
          confidenceScore: 0,
        });
      }

      const kind = this.detectKind(filePath, mimeType);
      let extracted: ExtractorOutput;

      if (kind === 'pdf') {
        extracted = await this.pdfExtractor.extract(fileBuffer);
      } else if (kind === 'docx') {
        extracted = await this.docxExtractor.extract(fileBuffer);
      } else if (kind === 'image') {
        extracted = await this.imageOcr.extract(fileBuffer);
      } else {
        extracted = {
          rawText: '',
          extractorUsed: 'raw-fallback',
          isScanned: false,
          confidenceScore: 0,
        };
      }

      return this.toResult(extracted);
    } catch (error) {
      this.logger.error(
        'OCR extractText failed',
        error instanceof Error ? error.stack : String(error),
      );
      return this.toResult({
        rawText: '',
        extractorUsed: 'raw-fallback',
        isScanned: false,
        confidenceScore: 0,
      });
    }
  }

  private resolveBuffer(filePath: string, buffer?: Buffer): Buffer | null {
    if (buffer && buffer.length > 0) {
      return buffer;
    }
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath);
  }

  private detectKind(filePath: string, mimeType?: string): 'pdf' | 'docx' | 'image' | 'unknown' {
    const mime = (mimeType || '').toLowerCase();
    const ext = path.extname(filePath || '').toLowerCase();

    if (mime === 'application/pdf' || ext === '.pdf') {
      return 'pdf';
    }
    if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword' ||
      ext === '.docx' ||
      ext === '.doc'
    ) {
      return 'docx';
    }
    if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff'].includes(ext)) {
      return 'image';
    }
    return 'unknown';
  }

  private toResult(extracted: ExtractorOutput): OcrResult {
    const cleanedText = TextSanitizerUtil.sanitize(extracted.rawText);
    return {
      rawText: extracted.rawText || '',
      cleanedText,
      characterCount: cleanedText.length,
      wordCount: TextSanitizerUtil.countWords(cleanedText),
      extractorUsed: extracted.extractorUsed,
      isScanned: extracted.isScanned,
      confidenceScore: extracted.confidenceScore,
    };
  }
}
