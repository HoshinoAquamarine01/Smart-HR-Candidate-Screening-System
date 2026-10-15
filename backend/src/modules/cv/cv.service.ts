import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cvs, CvsDocument } from '../../schemas/cvs.schema';
import { Candidates, CandidatesDocument } from '../../schemas/candidates.schema';
import { OcrService } from '../ocr/ocr.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CvService {
  constructor(
    @InjectModel(Cvs.name)
    private readonly cvModel: Model<CvsDocument>,
    @InjectModel(Candidates.name)
    private readonly candidateModel: Model<CandidatesDocument>,
    private readonly ocrService: OcrService,
  ) {}

  async uploadCv(file: Express.Multer.File, user: any) {
    if (!file) {
      throw new BadRequestException('CV file is required');
    }

    const ocr = await this.ocrService.extractText(file.path, file.mimetype, file.buffer);
    const extractedText = ocr.cleanedText || ocr.rawText;

    const defaultName = path.basename(file.originalname, path.extname(file.originalname));
    const candidate = await this.candidateModel.create({
      fullName: defaultName || 'Unknown Candidate',
      summary: extractedText ? extractedText.slice(0, 500) : 'CV Uploaded',
    });

    const uploaderId = user?._id ? new Types.ObjectId(user._id) : new Types.ObjectId();
    const cv = await this.cvModel.create({
      candidateId: candidate._id,
      fileUrl: `/uploads/cvs/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      parsedData: {
        rawText: ocr.rawText,
        cleanedText: ocr.cleanedText,
        characterCount: ocr.characterCount,
        wordCount: ocr.wordCount,
        extractorUsed: ocr.extractorUsed,
        isScanned: ocr.isScanned,
        confidenceScore: ocr.confidenceScore,
        extractedLength: ocr.characterCount,
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
