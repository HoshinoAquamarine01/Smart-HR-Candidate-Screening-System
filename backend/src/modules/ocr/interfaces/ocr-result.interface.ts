export type ExtractorUsed =
  | 'pdf-parse'
  | 'mammoth'
  | 'image-ocr'
  | 'raw-fallback';

export interface OcrResult {

  rawText: string;

  
  cleanedText: string;

  
  characterCount: number;


  wordCount: number;

 
  extractorUsed: ExtractorUsed;

 
  isScanned: boolean;

 
  confidenceScore: number;
}

export interface ExtractorOutput {
  rawText: string;
  extractorUsed: ExtractorUsed;
  isScanned: boolean;
  confidenceScore: number;
}
