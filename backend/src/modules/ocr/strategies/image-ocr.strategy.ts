import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createWorker, type Worker } from 'tesseract.js';
import type { ExtractorOutput } from '../interfaces/ocr-result.interface';

@Injectable()
export class ImageOcrStrategy implements OnModuleDestroy {
  private readonly logger = new Logger(ImageOcrStrategy.name);
  private workerPromise: Promise<Worker> | null = null;

  async extract(image: Buffer | string): Promise<ExtractorOutput> {
    try {
      const { text, confidence } = await this.recognize(image);
      return {
        rawText: text || '',
        extractorUsed: 'image-ocr',
        isScanned: true,
        confidenceScore: this.normalizeConfidence(confidence, 80),
      };
    } catch (error) {
      this.logger.error('Image OCR failed', error instanceof Error ? error.stack : String(error));
      const geminiText = await this.tryGeminiVision(image);
      if (geminiText) {
        return {
          rawText: geminiText,
          extractorUsed: 'image-ocr',
          isScanned: true,
          confidenceScore: 75,
        };
      }
      return {
        rawText: '',
        extractorUsed: 'image-ocr',
        isScanned: true,
        confidenceScore: 0,
      };
    }
  }

  async extractFromImages(images: Array<Buffer | Uint8Array>): Promise<ExtractorOutput> {
    if (!images.length) {
      return {
        rawText: '',
        extractorUsed: 'image-ocr',
        isScanned: true,
        confidenceScore: 75,
      };
    }

    const parts: string[] = [];
    let confidenceSum = 0;
    let count = 0;

    for (const image of images) {
      const buffer = Buffer.isBuffer(image) ? image : Buffer.from(image);
      const result = await this.extract(buffer);
      if (result.rawText.trim()) {
        parts.push(result.rawText.trim());
      }
      confidenceSum += result.confidenceScore;
      count += 1;
    }

    return {
      rawText: parts.join('\n\n'),
      extractorUsed: 'image-ocr',
      isScanned: true,
      confidenceScore: count > 0 ? Math.round(confidenceSum / count) : 75,
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.workerPromise) {
      return;
    }
    try {
      const worker = await this.workerPromise;
      await worker.terminate();
    } catch {
      // Worker may not have finished initializing.
    } finally {
      this.workerPromise = null;
    }
  }

  private async getWorker(): Promise<Worker> {
    if (!this.workerPromise) {
      this.workerPromise = createWorker('vie+eng').catch((error) => {
        this.workerPromise = null;
        throw error;
      });
    }
    return this.workerPromise;
  }

  private async recognize(image: Buffer | string): Promise<{ text: string; confidence: number }> {
    const worker = await this.getWorker();
    const { data } = await worker.recognize(image);
    return {
      text: data.text || '',
      confidence: data.confidence ?? 0,
    };
  }

  private normalizeConfidence(value: number, fallback: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return fallback;
    }
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private async tryGeminiVision(image: Buffer | string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    if (!apiKey || typeof image === 'string') {
      return null;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Extract all readable text from this CV image. Preserve line breaks. Return plain text only.',
                  },
                  {
                    inline_data: {
                      mime_type: 'image/png',
                      data: image.toString('base64'),
                    },
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (error) {
      this.logger.warn(`Gemini Vision fallback skipped: ${String(error)}`);
      return null;
    }
  }
}
