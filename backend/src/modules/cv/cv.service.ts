import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cvs, CvsDocument } from '../../schemas/cvs.schema';
import { Candidates, CandidatesDocument } from '../../schemas/candidates.schema';
import { OcrService } from '../ocr/ocr.service';
import { AiService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    @InjectModel(Cvs.name)
    private readonly cvModel: Model<CvsDocument>,
    @InjectModel(Candidates.name)
    private readonly candidateModel: Model<CandidatesDocument>,
    private readonly ocrService: OcrService,
    private readonly aiService: AiService,
  ) {}

  async uploadCv(file: Express.Multer.File, user: any) {
    if (!file) {
      throw new BadRequestException('CV file is required');
    }

    // 1. OCR text extraction
    const ocr = await this.ocrService.extractText(file.path, file.mimetype, file.buffer);
    const extractedText = ocr.cleanedText || ocr.rawText;

    // 2. LLM semantic extraction
    let extractionResult: any = null;
    try {
      if (extractedText && extractedText.trim().length >= 30) {
        extractionResult = await this.aiService.extractCvStructuredData(extractedText);
      }
    } catch (err: any) {
      this.logger.warn(`LLM extraction warning during upload: ${err.message}`);
    }

    const profile = extractionResult?.profile;
    const defaultName = path.basename(file.originalname, path.extname(file.originalname));

    // 3. Candidate synchronization (find existing candidate by email if present, or create new)
    let candidate: CandidatesDocument | null = null;
    const email = profile?.personalInfo?.email;

    if (email && email.trim() !== '') {
      candidate = await this.candidateModel.findOne({ email: email.trim() }).exec();
      if (candidate) {
        // Update existing candidate info
        candidate.fullName = profile?.personalInfo?.fullName || candidate.fullName;
        candidate.phone = profile?.personalInfo?.phone || candidate.phone;
        candidate.location = profile?.personalInfo?.location || candidate.location;
        candidate.currentTitle = profile?.personalInfo?.currentTitle || candidate.currentTitle;
        candidate.summary = profile?.summary || candidate.summary;
        await candidate.save();
      }
    }

    if (!candidate) {
      candidate = await this.candidateModel.create({
        fullName: profile?.personalInfo?.fullName || defaultName || 'Unknown Candidate',
        email: email || undefined,
        phone: profile?.personalInfo?.phone || undefined,
        location: profile?.personalInfo?.location || undefined,
        currentTitle: profile?.personalInfo?.currentTitle || undefined,
        summary: profile?.summary || (extractedText ? extractedText.slice(0, 500) : 'CV Uploaded'),
      });
    }

    // 4. Save CV record with structured parsedData
    const uploaderId = user?._id ? new Types.ObjectId(user._id) : new Types.ObjectId();
    const cv = await this.cvModel.create({
      candidateId: candidate._id,
      fileUrl: `/uploads/cvs/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      parsedData: {
        profile: profile || null,
        ocrMetadata: {
          rawText: ocr.rawText,
          cleanedText: ocr.cleanedText,
          characterCount: ocr.characterCount,
          wordCount: ocr.wordCount,
          extractorUsed: ocr.extractorUsed,
          isScanned: ocr.isScanned,
          confidenceScore: ocr.confidenceScore,
          extractedLength: ocr.characterCount,
        },
        extractionMetadata: extractionResult?.extractionMetadata || null,
      },
      uploadedBy: uploaderId,
    });

    return {
      message: 'CV uploaded & extracted successfully',
      data: {
        id: cv._id,
        candidateId: candidate._id,
        fileName: cv.fileName,
        fileUrl: cv.fileUrl,
        fileSize: cv.fileSize,
        mimeType: cv.mimeType,
        parsedData: cv.parsedData,
        uploadedBy: cv.uploadedBy,
        createdAt: (cv as any).createdAt,
      },
    };
  }

  async reExtractCv(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid CV ID');
    }
    const cv = await this.cvModel.findById(id).exec();
    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    // 1. Get cleaned text from stored ocrMetadata or re-read file
    let text =
      cv.parsedData?.ocrMetadata?.cleanedText ||
      cv.parsedData?.cleanedText ||
      cv.parsedData?.ocrMetadata?.rawText ||
      cv.parsedData?.rawText;

    if (!text || text.trim().length === 0) {
      const filename = path.basename(cv.fileUrl);
      const filePath = path.join(process.cwd(), 'uploads', 'cvs', filename);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('CV file does not exist on server for OCR extraction');
      }
      const ocr = await this.ocrService.extractText(filePath, cv.mimeType);
      text = ocr.cleanedText || ocr.rawText;
      if (!cv.parsedData) {
        cv.parsedData = {};
      }
      cv.parsedData.ocrMetadata = {
        rawText: ocr.rawText,
        cleanedText: ocr.cleanedText,
        characterCount: ocr.characterCount,
        wordCount: ocr.wordCount,
        extractorUsed: ocr.extractorUsed,
        isScanned: ocr.isScanned,
        confidenceScore: ocr.confidenceScore,
        extractedLength: ocr.characterCount,
      };
    }

    // 2. Perform LLM Extraction
    const extractionResult = await this.aiService.extractCvStructuredData(text);
    const profile = extractionResult.profile;

    // 3. Update parsedData
    cv.parsedData = {
      ...cv.parsedData,
      profile,
      extractionMetadata: extractionResult.extractionMetadata,
    };
    cv.markModified('parsedData');
    await cv.save();

    // 4. Sync candidate profile
    if (cv.candidateId) {
      const updatePayload: Record<string, any> = {};
      if (profile.personalInfo.fullName) updatePayload.fullName = profile.personalInfo.fullName;
      if (profile.personalInfo.email) updatePayload.email = profile.personalInfo.email;
      if (profile.personalInfo.phone) updatePayload.phone = profile.personalInfo.phone;
      if (profile.personalInfo.location) updatePayload.location = profile.personalInfo.location;
      if (profile.personalInfo.currentTitle) updatePayload.currentTitle = profile.personalInfo.currentTitle;
      if (profile.summary) updatePayload.summary = profile.summary;

      if (Object.keys(updatePayload).length > 0) {
        await this.candidateModel.findByIdAndUpdate(cv.candidateId, { $set: updatePayload });
      }
    }

    return {
      statusCode: 200,
      message: 'CV re-extracted and synchronized successfully',
      data: {
        id: cv._id,
        candidateId: cv.candidateId,
        profile: cv.parsedData.profile,
        extractionMetadata: cv.parsedData.extractionMetadata,
      },
    };
  }

  async getCvById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid CV ID');
    }
    const cv = await this.cvModel.findById(id).populate('candidateId').exec();
    if (!cv) {
      throw new NotFoundException('CV not found');
    }
    return {
      statusCode: 200,
      data: cv,
    };
  }

  async getCvFile(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid CV ID');
    }
    const cv = await this.cvModel.findById(id).exec();
    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const filename = path.basename(cv.fileUrl);
    const filePath = path.join(process.cwd(), 'uploads', 'cvs', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('CV file does not exist on server');
    }

    return {
      stream: fs.createReadStream(filePath),
      fileName: cv.fileName,
      mimeType: cv.mimeType,
    };
  }
}
