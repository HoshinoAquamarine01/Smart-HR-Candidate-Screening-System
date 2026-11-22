/**
 * Automated Verification Test Suite for Swagger/OpenAPI 3.0 & Postman Collection v2.1
 * Verifies API schema completeness, route tagging, security schemes, and Postman automation.
 */

import * as fs from 'fs';
import * as path from 'path';

async function runSwaggerAndPostmanTests() {
  console.log('================================================================');
  console.log('🎯 BẮT ĐẦU KIỂM THỬ: SWAGGER OPENAPI 3.0 & POSTMAN COLLECTION');
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

  // --------------------------------------------------------------------------
  // TEST SUITE 1: SWAGGER OPENAPI 3.0 SPECIFICATION INTEGRITY
  // --------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ TÍNH TOÀN VẸN CỦA SWAGGER OPENAPI 3.0 SPEC ---');
  const swaggerPath = path.resolve(__dirname, '../../docs/swagger/swagger.json');
  assert(fs.existsSync(swaggerPath), 'Tệp docs/swagger/swagger.json tồn tại trên đĩa');

  const swaggerContent = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));
  assert(swaggerContent.openapi?.startsWith('3.'), `Định dạng chuẩn OpenAPI 3.0 (openapi: ${swaggerContent.openapi})`);
  assert(swaggerContent.info?.title.includes('Smart HR'), 'Tiêu đề API đúng định danh Smart HR');
  assert(swaggerContent.info?.version === '1.0.0', 'Phiên bản API là 1.0.0');

  // Security Schemes
  const securitySchemes = swaggerContent.components?.securitySchemes;
  assert(!!securitySchemes?.['JWT-auth'], 'Cấu hình bảo mật JWT Bearer Auth (JWT-auth) có trong components');
  assert(securitySchemes?.['JWT-auth']?.scheme === 'bearer', 'Cơ chế xác thực là Bearer Token');

  // Verify Required Tags
  const expectedTags = [
    'Authentication',
    'Users',
    'Jobs',
    'CV & Extraction',
    'Candidate Screening & Matching',
    'Candidates',
    'Applications & Kanban',
    'AI Interview Generation',
    'Recruitment Analytics'
  ];
  const presentTags = (swaggerContent.tags || []).map((t: any) => t.name);
  for (const tag of expectedTags) {
    assert(presentTags.includes(tag), `Tag '${tag}' được định nghĩa trong Swagger Spec`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: CORE RESTFUL PATHS & OPERATIONS IN SWAGGER
  // --------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ CÁC ĐƯỜNG DẪN CORE RESTFUL TRONG SWAGGER SPEC ---');
  const paths = swaggerContent.paths || {};
  const criticalEndpoints = [
    { path: '/api/v1/auth/register', method: 'post' },
    { path: '/api/v1/auth/login', method: 'post' },
    { path: '/api/v1/auth/profile', method: 'get' },
    { path: '/api/v1/jobs', method: 'get' },
    { path: '/api/v1/jobs', method: 'post' },
    { path: '/api/v1/jobs/{id}', method: 'get' },
    { path: '/api/v1/jobs/{id}/status', method: 'patch' },
    { path: '/api/v1/cv/upload', method: 'post' },
    { path: '/api/v1/cv/{id}', method: 'get' },
    { path: '/api/v1/screening/match', method: 'post' },
    { path: '/api/v1/screening/rank/{jobId}', method: 'post' },
    { path: '/api/v1/candidates', method: 'get' },
    { path: '/api/v1/candidates/{id}', method: 'get' },
    { path: '/api/v1/candidates/{id}/status', method: 'patch' },
    { path: '/api/v1/applications/kanban', method: 'get' },
    { path: '/api/v1/applications', method: 'get' },
    { path: '/api/v1/applications/{id}', method: 'get' },
    { path: '/api/v1/applications/{id}/status', method: 'patch' },
    { path: '/api/v1/interviews/generate', method: 'post' },
    { path: '/api/v1/interviews/{id}', method: 'get' },
    { path: '/api/v1/interviews/{id}/export', method: 'post' },
    { path: '/api/v1/analytics/dashboard', method: 'get' }
  ];

  for (const ep of criticalEndpoints) {
    const op = paths[ep.path]?.[ep.method];
    assert(!!op, `Endpoint [${ep.method.toUpperCase()}] ${ep.path} có đầy đủ thông số mô tả`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: POSTMAN ENVIRONMENT SPECIFICATION
  // --------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ CẤU HÌNH POSTMAN ENVIRONMENT ---');
  const envPath = path.resolve(__dirname, '../../docs/postman/Smart_HR_Environment.postman_environment.json');
  assert(fs.existsSync(envPath), 'Tệp docs/postman/Smart_HR_Environment.postman_environment.json tồn tại');

  const envContent = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  const envKeys = (envContent.values || []).map((v: any) => v.key);
  const requiredEnvKeys = [
    'baseUrl',
    'jwtToken',
    'recruiterEmail',
    'recruiterPassword',
    'jobId',
    'candidateId',
    'applicationId',
    'cvId',
    'interviewId'
  ];

  for (const k of requiredEnvKeys) {
    assert(envKeys.includes(k), `Biến môi trường '${k}' có trong Postman Environment`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: POSTMAN COLLECTION V2.1 STRUCTURE & TEST SCRIPTS
  // --------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ POSTMAN COLLECTION V2.1 & AUTO-TOKEN CAPTURE ---');
  const colPath = path.resolve(__dirname, '../../docs/postman/Smart_HR_APIs.postman_collection.json');
  assert(fs.existsSync(colPath), 'Tệp docs/postman/Smart_HR_APIs.postman_collection.json tồn tại');

  const colContent = JSON.parse(fs.readFileSync(colPath, 'utf-8'));
  assert(colContent.info?.schema.includes('collection.json'), 'Định dạng chuẩn Postman Collection Schema v2.1');
  assert(colContent.item?.length >= 8, `Bộ sưu tập có đủ ${colContent.item?.length} thư mục phân hệ (>= 8)`);

  // Verify login auto-token capture script
  const authFolder = colContent.item.find((f: any) => f.name.includes('Authentication'));
  assert(!!authFolder, 'Thư mục 01. Authentication & Users có trong collection');

  const loginReq = authFolder?.item?.find((i: any) => i.name.includes('Login'));
  assert(!!loginReq, 'Request Login có trong thư mục Authentication');

  const testScript = loginReq?.event?.find((e: any) => e.listen === 'test')?.script?.exec?.join('\n') || '';
  assert(testScript.includes('pm.environment.set(\'jwtToken\', token)'), 'Script tự động lưu jwtToken vào biến môi trường hoạt động');

  // Verify Kanban Drag & Drop Request
  const appsFolder = colContent.item.find((f: any) => f.name.includes('Applications'));
  assert(!!appsFolder, 'Thư mục 06. Applications & Kanban Workflow có trong collection');

  const kanbanUpdateReq = appsFolder?.item?.find((i: any) => i.name.includes('Kanban Drag-and-Drop'));
  assert(!!kanbanUpdateReq, 'Endpoint kéo thả Kanban (PATCH /status) có trong collection');
  assert(kanbanUpdateReq.request?.method === 'PATCH', 'Phương thức HTTP của Kanban Drag-and-Drop là PATCH');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${testPassed} PASS / ${testFailed} FAIL`);
  if (testFailed === 0) {
    console.log('🎉 TẤT CẢ TEST CASES SWAGGER VÀ POSTMAN COLLECTION ĐÃ ĐẠT 100%!');
  } else {
    console.log('⚠️ CÓ TEST CASE BỊ LỖI, VUI LÒNG KIỂM TRA LẠI LOG CHI TIẾT Ở TRÊN!');
  }
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runSwaggerAndPostmanTests().catch((err) => {
  console.error('Fatal test error in Swagger/Postman Test Suite:', err);
  process.exit(1);
});
