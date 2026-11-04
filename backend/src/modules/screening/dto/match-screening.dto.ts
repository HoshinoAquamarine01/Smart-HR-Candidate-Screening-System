export class ScoringWeightsDto {
  semantic?: number;
  skill?: number;
  experience?: number;
  education?: number;
}

export class MatchScreeningDto {
  /**
   * MongoDB ObjectId của CV đã tải lên (Tùy chọn nếu truyền trực tiếp payload)
   */
  cvId?: string;

  /**
   * MongoDB ObjectId của vị trí tuyển dụng Jobs
   */
  jobId?: string;

  /**
   * Nội dung văn bản thô hoặc tóm tắt của Job Description
   */
  jobDescriptionText?: string;

  /**
   * Dữ liệu profile ứng viên bóc tách chuẩn hóa (StandardCvProfile)
   */
  candidateProfileData?: any;

  /**
   * Cấp bậc tuyển dụng mong đợi để tự động áp dụng bộ trọng số tối ưu
   */
  targetLevel?: 'INTERN' | 'FRESHER' | 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD';

  /**
   * Danh sách kỹ năng bắt buộc (Required Skills)
   */
  requiredSkills?: string[];

  /**
   * Danh sách kỹ năng ưu tiên / điểm cộng (Preferred Skills)
   */
  preferredSkills?: string[];

  /**
   * Số năm kinh nghiệm tối thiểu yêu cầu trong JD
   */
  requiredYearsOfExperience?: number;

  /**
   * Trình độ học vấn yêu cầu (vd: 'Bachelor', 'Master', 'Doctorate', 'College')
   */
  requiredDegree?: string;

  /**
   * Chuyên ngành yêu cầu (vd: 'Information Technology', 'Computer Science')
   */
  requiredFieldOfStudy?: string;

  /**
   * Bộ trọng số tùy chỉnh (Nếu không truyền sẽ dùng preset theo targetLevel)
   */
  weights?: ScoringWeightsDto;
}
