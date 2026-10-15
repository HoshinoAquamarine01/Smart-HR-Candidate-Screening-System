import { Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { TextSanitizerUtil } from '../utils/text-sanitizer.util';
import { ImageOcrStrategy } from './image-ocr.strategy';
import type { ExtractorOutput } from '../interfaces/ocr-result.interface';

@Injectable()
export class PdfExtractorStrategy {
  private readonly logger = new Logger(PdfExtractorStrategy.name);

  constructor(private readonly imageOcrStrategy: ImageOcrStrategy) {}

  async extract(buffer: Buffer): Promise<ExtractorOutput> {
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();
      const rawText = textResult.text || '';
      const shouldFallback =
        TextSanitizerUtil.isScannedPDF(rawText) || rawText.trim().length < 30;

      if (!shouldFallback) {
        return {
          rawText,
          extractorUsed: 'pdf-parse',
          isScanned: false,
          confidenceScore: 95,
        };
      }

      return await this.fallbackToImageOcr(parser);
    } catch (error) {
      this.logger.error(
        'PDF text extraction failed',
        error instanceof Error ? error.stack : String(error),
      );
      try {
        return await this.fallbackToImageOcr(parser);
      } catch (fallbackError) {
        this.logger.error(
          'Scanned PDF OCR fallback failed',
          fallbackError instanceof Error ? fallbackError.stack : String(fallbackError),
        );
        return {
          rawText: '',
          extractorUsed: 'raw-fallback',
          isScanned: false,
          confidenceScore: 0,
        };
      }
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  private async fallbackToImageOcr(parser: PDFParse): Promise<ExtractorOutput> {
    const screenshot = await parser.getScreenshot({
      imageBuffer: true,
      imageDataUrl: false,
      scale: 2,
      first: 5,
    });

    const images = (screenshot.pages ?? [])
      .map((page) => page.data)
      .filter((data): data is Uint8Array | Buffer => Boolean(data));

    const ocr = await this.imageOcrStrategy.extractFromImages(images);
    return {
      ...ocr,
      extractorUsed: 'image-ocr',
      isScanned: true,
      confidenceScore: ocr.confidenceScore || 75,
    };
  }
}
