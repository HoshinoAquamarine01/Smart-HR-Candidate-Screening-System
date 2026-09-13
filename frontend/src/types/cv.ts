export interface CvParseRequest {
  file?: File;
  rawText?: string;
}

export interface CvParseResponse {
  success: boolean;
  profile?: any;
  error?: string;
}
