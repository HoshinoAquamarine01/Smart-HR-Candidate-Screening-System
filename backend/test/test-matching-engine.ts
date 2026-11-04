import { CosineSimilarityUtil } from '../src/modules/screening/utils/cosine-similarity.util';
import { SkillTaxonomyService } from '../src/modules/screening/services/skill-taxonomy.service';
import { MatchingEngineService } from '../src/modules/screening/services/matching-engine.service';
import { MatchScreeningDto } from '../src/modules/screening/dto/match-screening.dto';

async function runMatchingEngineTests() {
  console.log('================================================================');
  console.log('🎯 BẮT ĐẦU KIỂM THỬ: MATCHING ENGINE & HYBRID SCORING (TUẦN 11)');
  console.log('================================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      testPassed++;
    } else {
      console.log(` ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      testFailed++;
    }
  }

  const skillTaxonomy = new SkillTaxonomyService();
  const matchingEngine = new MatchingEngineService(skillTaxonomy);

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Cosine Similarity & Deterministic Embeddings
  // --------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ COSINE SIMILARITY & EMBEDDING ---');
  {
    const vecA = [1, 2, 3, 4];
    const vecB = [1, 2, 3, 4];
    const cosIdentical = CosineSimilarityUtil.calculateCosine(vecA, vecB);
    assert(Math.abs(cosIdentical - 1.0) < 0.001, 'Hai vector đồng nhất có Cosine = 1.0 (100 điểm)');

    const vecOrthogonalA = [1, 0];
    const vecOrthogonalB = [0, 1];
    const cosOrtho = CosineSimilarityUtil.calculateCosine(vecOrthogonalA, vecOrthogonalB);
    assert(Math.abs(cosOrtho - 0.0) < 0.001, 'Hai vector trực giao có Cosine = 0.0 (50 điểm)');

    const vecOppositeA = [1, 2];
    const vecOppositeB = [-1, -2];
    const cosOpp = CosineSimilarityUtil.calculateCosine(vecOppositeA, vecOppositeB);
    assert(Math.abs(cosOpp - (-1.0)) < 0.001, 'Hai vector ngược chiều có Cosine = -1.0 (0 điểm)');

    // Text embedding test
    const cvBackend = 'Senior Backend Developer proficient in NestJS, TypeScript, MongoDB, Docker, Microservices';
    const jdBackend = 'Looking for Senior Backend Engineer with strong skills in TypeScript, NestJS and Cloud';
    const jdChef = 'Executive Chef specializing in Italian pasta, pizza baking and restaurant kitchen leadership';

    const vCV = CosineSimilarityUtil.generateDeterministicEmbedding(cvBackend);
    const vJD = CosineSimilarityUtil.generateDeterministicEmbedding(jdBackend);
    const vChef = CosineSimilarityUtil.generateDeterministicEmbedding(jdChef);

    const scoreBackend = CosineSimilarityUtil.toPercentageScore(CosineSimilarityUtil.calculateCosine(vCV, vJD));
    const scoreChef = CosineSimilarityUtil.toPercentageScore(CosineSimilarityUtil.calculateCosine(vCV, vChef));

    console.log(`  ℹ️ Semantic Score CV Backend vs JD Backend: ${scoreBackend}%`);
    console.log(`  ℹ️ Semantic Score CV Backend vs JD Chef: ${scoreChef}%`);

    assert(scoreBackend > scoreChef, 'Điểm tương đồng ngữ nghĩa CV Backend vs JD Backend phải cao hơn JD Chef');
    assert(scoreBackend >= 60, 'CV Backend và JD Backend đạt độ tương đồng ngữ nghĩa cao (>= 60%)');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Skill Taxonomy & Normalization
  // --------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ SKILL TAXONOMY & NORMALIZATION ---');
  {
    // Exact match
    const exact = skillTaxonomy.evaluateSkillMatch(['Docker', 'React', 'Node.js'], 'Docker');
    assert(exact.matchType === 'EXACT' && exact.matchScore === 1.0, 'Khớp hoàn toàn (Exact Match) "Docker" = 1.0');

    // Alias matches
    const alias1 = skillTaxonomy.evaluateSkillMatch(['reactjs', 'express'], 'React');
    assert(alias1.matchType === 'ALIAS' && alias1.matchScore === 1.0, 'Khớp Alias "reactjs" -> "React" = 1.0');

    const alias2 = skillTaxonomy.evaluateSkillMatch(['k8s'], 'Kubernetes');
    assert(alias2.matchType === 'ALIAS' && alias2.matchScore === 1.0, 'Khớp Alias "k8s" -> "Kubernetes" = 1.0');

    const alias3 = skillTaxonomy.evaluateSkillMatch(['postgres'], 'PostgreSQL');
    assert(alias3.matchType === 'ALIAS' && alias3.matchScore === 1.0, 'Khớp Alias "postgres" -> "PostgreSQL" = 1.0');

    const alias4 = skillTaxonomy.evaluateSkillMatch(['golang'], 'Go');
    assert(alias4.matchType === 'ALIAS' && alias4.matchScore === 1.0, 'Khớp Alias "golang" -> "Go" = 1.0');

    // Fuzzy match (chống gõ sai)
    const fuzzy = skillTaxonomy.evaluateSkillMatch(['dockr', 'typscript'], 'Docker');
    assert(fuzzy.matchType === 'FUZZY' && fuzzy.matchScore === 1.0, 'Khớp Fuzzy (gõ sai chính tả "dockr" -> "Docker") = 1.0');

    // Related match (0.5 điểm)
    const related = skillTaxonomy.evaluateSkillMatch(['MySQL'], 'PostgreSQL');
    assert(related.matchType === 'RELATED' && related.matchScore === 0.5, 'Khớp Related (ứng viên có "MySQL", JD cần "PostgreSQL") = 0.5');

    // Vector Semantic match cho kỹ năng mới / ngoài từ điển ([FR-AI-04a])
    // Giả lập 2 vector embedding kỹ năng mới có độ tương đồng ngữ nghĩa cao ~0.85 (như Gemini text-embedding-004 trả về)
    const vLangChain = [0.8, 0.5, 0.3, 0.1];
    const vLlamaIndex = [0.75, 0.55, 0.35, 0.05];
    const vBaking = [-0.8, -0.5, 0.1, 0.0];

    const testVectorMap = new Map<string, number[]>([
      ['LangChain', vLangChain],
      ['LlamaIndex', vLlamaIndex],
      ['Baking', vBaking],
    ]);

    // LangChain vs LlamaIndex (cả 2 đều là LLM framework ngoài từ điển)
    const semanticRes = skillTaxonomy.evaluateSkillMatch(['LangChain'], 'LlamaIndex', testVectorMap);
    console.log(`  ℹ️ Novel Skills Semantic Match: "${semanticRes.matchedCandidateSkill}" vs "${semanticRes.requiredSkill}" -> Score: ${semanticRes.matchScore}, Type: ${semanticRes.matchType}`);
    assert(semanticRes.matchType === 'SEMANTIC' && semanticRes.matchScore >= 0.8, 'Kỹ năng mới ngoài từ điển ("LangChain" vs "LlamaIndex") tự động khớp ngữ nghĩa bằng Vector Embedding');

    // Kỹ năng hoàn toàn không liên quan qua vector
    const unrelatedVectorRes = skillTaxonomy.evaluateSkillMatch(['Baking'], 'LlamaIndex', testVectorMap);
    assert(unrelatedVectorRes.matchType === 'NONE' && unrelatedVectorRes.matchScore === 0.0, 'Kỹ năng không liên quan qua Vector Embedding ("Baking" vs "LlamaIndex") trả về matchScore = 0.0');

    // Missing skill
    const missing = skillTaxonomy.evaluateSkillMatch(['HTML', 'CSS'], 'Kubernetes');
    assert(missing.matchType === 'NONE' && missing.matchScore === 0.0, 'Kỹ năng không tồn tại trả về matchScore = 0.0');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Multi-Pillar Scoring Logic & Hard Gate Constraint
  // --------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ LOGIC CHẤM ĐIỂM ĐA TRỤ CỘT & HARD GATE ---');
  {
    // Hard gate test
    const candSkills = ['Figma', 'Photoshop'];
    const reqSkills = ['NestJS', 'PostgreSQL', 'Docker', 'Redis']; // 4 required
    const prefSkills = ['Git'];
    const skillRes = matchingEngine.calculateSkillScore(candSkills, reqSkills, prefSkills);

    assert(skillRes.hardGateApplied === true, 'Kích hoạt Hard Gate Penalty khi thiếu > 50% kỹ năng bắt buộc');
    assert(skillRes.missingRequired.length === 4, 'Bóc tách chính xác 4 kỹ năng bắt buộc bị thiếu');

    // Experience test
    assert(matchingEngine.calculateExperienceScore(5, 3).score === 100, 'Kinh nghiệm vượt mức yêu cầu (5/3 năm) = 100 điểm');
    assert(matchingEngine.calculateExperienceScore(2, 4).score === 50, 'Kinh nghiệm tiệm cận (2/4 năm) = 50 điểm');
    assert(matchingEngine.calculateExperienceScore(1, 5).score === 20, 'Kinh nghiệm thiếu nghiêm trọng (1/5 năm) bị phạt về mức sàn 20 điểm');

    // Education test
    const eduCS = [{ degree: 'Kỹ sư', fieldOfStudy: 'Kỹ thuật phần mềm' }];
    assert(matchingEngine.calculateEducationScore(eduCS, 'Bachelor', 'Computer Science').score === 100, 'Bằng Kỹ sư đúng chuyên ngành = 100 điểm');

    const eduNonIT = [{ degree: 'Cử nhân', fieldOfStudy: 'Kế toán' }];
    assert(matchingEngine.calculateEducationScore(eduNonIT, 'Bachelor', 'Computer Science').score === 85, 'Bằng Cử nhân khác ngành = 85 điểm');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: End-to-End Candidate Screening Match
  // --------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ END-TO-END SCREENING FIT SCORING ---');
  {
    const seniorDto: MatchScreeningDto = {
      targetLevel: 'SENIOR',
      requiredSkills: ['NestJS', 'TypeScript', 'MongoDB'],
      preferredSkills: ['Docker', 'Kubernetes'],
      requiredYearsOfExperience: 4,
      requiredDegree: 'Bachelor',
      candidateProfileData: {
        skills: {
          technicalSkills: ['NestJS', 'TypeScript', 'MongoDB', 'Docker'],
        },
        totalYearsOfExperience: 5,
        education: [
          {
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Software Engineering',
          },
        ],
        summary: 'Senior Backend Engineer with 5+ years of production experience in NestJS, TypeScript and MongoDB.',
      },
      jobDescriptionText: 'Looking for a Senior Backend Developer proficient in NestJS, TypeScript, MongoDB, and Docker containerization.',
    };

    const matchSenior = matchingEngine.evaluateCandidateFit(seniorDto);
    console.log(`  ℹ️ Senior Candidate Total Score: ${matchSenior.totalScore}/100`);
    console.log(`     - Semantic Score: ${matchSenior.breakdown.semanticScore}`);
    console.log(`     - Skill Score: ${matchSenior.breakdown.skillScore}`);
    console.log(`     - Experience Score: ${matchSenior.breakdown.experienceScore}`);
    console.log(`     - Education Score: ${matchSenior.breakdown.educationScore}`);
    console.log(`  ℹ️ Rationale Summary: ${matchSenior.rationale}`);

    assert(matchSenior.totalScore >= 88, 'Ứng viên Senior chuẩn form đạt điểm xuất sắc (>= 88%)');
    assert(matchSenior.skillAnalysis.missingRequired.length === 0, 'Đáp ứng 100% kỹ năng bắt buộc');
    assert(matchSenior.experienceAnalysis.candidateYears === 5, 'Bóc tách đúng 5 năm kinh nghiệm');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Evaluation Framework (Precision@K, Recall@K, NDCG@K)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ CHỈ SỐ ĐÁNH GIÁ (PRECISION@K, RECALL@K, NDCG@K) ---');
  {
    const predictedRanking = [
      { candidateId: 'c1', score: 95 },
      { candidateId: 'c2', score: 88 },
      { candidateId: 'c3', score: 75 },
      { candidateId: 'c4', score: 60 },
      { candidateId: 'c5', score: 40 },
    ];

    const groundTruth: Record<string, number> = {
      c1: 3, // Rất phù hợp
      c2: 2, // Phù hợp
      c3: 1, // Tạm
      c4: 0, // Kém
      c5: 0, // Kém
    };

    const metrics = matchingEngine.evaluateRankingMetrics(predictedRanking, groundTruth, 3);
    console.log(`  ℹ️ Evaluation Metrics @ K=3:`);
    console.log(`     - Precision@3: ${metrics.precisionAtK} (Kỳ vọng: 0.667)`);
    console.log(`     - Recall@3:    ${metrics.recallAtK} (Kỳ vọng: 1.000)`);
    console.log(`     - NDCG@3:      ${metrics.ndcgAtK} (Kỳ vọng: 1.000)`);

    assert(Math.abs(metrics.precisionAtK - 0.667) < 0.01, 'Precision@3 chính xác theo công thức Ground Truth');
    assert(metrics.recallAtK === 1.0, 'Recall@3 = 1.0 (thu thập trọn vẹn ứng viên phù hợp trong Top 3)');
    assert(metrics.ndcgAtK === 1.0, 'NDCG@3 = 1.0 (thứ tự xếp hạng hoàn hảo)');
  }

  console.log('\n================================================================');
  console.log(`📊 KẾT QUẢ TỔNG HỢP: ${testPassed} PASS / ${testFailed} FAIL`);
  if (testFailed === 0) {
    console.log('🎉 TẤT CẢ CÁC BÀI TEST MATCHING ENGINE ĐỀU VƯỢT QUA XUẤT SẮC!');
  } else {
    console.log('⚠️ CÓ TEST CASE BỊ THẤT BẠI!');
  }
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runMatchingEngineTests().catch((err) => {
  console.error('Fatal error during Matching Engine test execution:', err);
  process.exit(1);
});
