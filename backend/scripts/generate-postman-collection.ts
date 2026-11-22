import * as fs from 'fs';
import * as path from 'path';

function buildPostmanCollection() {
  const collection = {
    info: {
      _postman_id: "8c7f3910-449e-4a67-b50a-9d9369d67182",
      name: "Smart HR & Automated Candidate Screening System API",
      description: "Bộ sưu tập API hoàn chỉnh cho nền tảng Smart HR: Xác thực JWT, Quản lý JD, Bóc tách CV, Chấm điểm Matching AI, Quản lý ứng viên 360°, Kéo thả Kanban, Sinh câu hỏi phỏng vấn thích ứng RAG, và Báo cáo Dashboard.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [
      {
        name: "01. Authentication & Users",
        item: [
          {
            name: "Register User (Recruiter)",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "{{recruiterEmail}}",
                  password: "{{recruiterPassword}}",
                  fullName: "Nguyễn Văn Hoàng",
                  role: "RECRUITER",
                  department: "Talent Acquisition"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/auth/register",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "auth", "register"]
              }
            }
          },
          {
            name: "Login & Auto-Capture Token",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "pm.test('Status code is 200 or 201', function () {",
                    "    pm.expect(pm.response.code).to.be.oneOf([200, 201]);",
                    "});",
                    "",
                    "var jsonData = pm.response.json();",
                    "var token = jsonData.access_token || (jsonData.data && jsonData.data.access_token);",
                    "if (token) {",
                    "    pm.environment.set('jwtToken', token);",
                    "    console.log('✅ Captured and stored jwtToken into environment successfully!');",
                    "} else {",
                    "    console.warn('⚠️ No access_token found in response body');",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "{{recruiterEmail}}",
                  password: "{{recruiterPassword}}"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/auth/login",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "auth", "login"]
              }
            }
          },
          {
            name: "Get Current Profile (Bearer Auth)",
            request: {
              auth: {
                type: "bearer",
                bearer: [{ key: "token", value: "{{jwtToken}}", type: "string" }]
              },
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/auth/profile",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "auth", "profile"]
              }
            }
          },
          {
            name: "Get User By Email",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/users/{{recruiterEmail}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "users", "{{recruiterEmail}}"]
              }
            }
          }
        ]
      },
      {
        name: "02. Jobs & Criteria Management",
        item: [
          {
            name: "Create Job with AI Extraction",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "if (pm.response.code === 201 || pm.response.code === 200) {",
                    "    var res = pm.response.json();",
                    "    var id = res._id || (res.data && res.data._id);",
                    "    if (id) {",
                    "        pm.environment.set('jobId', id);",
                    "        console.log('✅ Captured jobId:', id);",
                    "    }",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  title: "Senior Backend Engineer (NestJS / TypeScript)",
                  department: "Platform Engineering",
                  location: "Hà Nội / Hybrid",
                  employmentType: "FULL_TIME",
                  rawDescription: "Tuyển dụng Senior Backend Engineer từ 4 năm kinh nghiệm. Yêu cầu thành thạo: NestJS, Node.js, TypeScript, MongoDB, RESTful API. Ưu tiên: Docker, Kubernetes, Microservices, Redis, AWS. Trách nhiệm: Thiết kế kiến trúc backend chịu tải cao, tối ưu hóa cơ sở dữ liệu.",
                  autoExtract: true,
                  status: "PUBLISHED"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/jobs",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "jobs"]
              }
            }
          },
          {
            name: "Preview Parse Raw JD (No DB save)",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  title: "DevOps Engineer",
                  rawDescription: "Yêu cầu tối thiểu 3 năm kinh nghiệm với Docker, Kubernetes, CI/CD pipeline, Terraform, AWS và Linux administration."
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/jobs/parse-jd",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "jobs", "parse-jd"]
              }
            }
          },
          {
            name: "List Jobs (Pagination & Filter)",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/jobs?page=1&limit=10&status=PUBLISHED",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "jobs"],
                query: [
                  { key: "page", value: "1" },
                  { key: "limit", value: "10" },
                  { key: "status", value: "PUBLISHED" }
                ]
              }
            }
          },
          {
            name: "Get Job Detail & Funnel Stats",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/jobs/{{jobId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "jobs", "{{jobId}}"]
              }
            }
          },
          {
            name: "Update Job Status",
            request: {
              method: "PATCH",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({ status: "PUBLISHED" }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/jobs/{{jobId}}/status",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "jobs", "{{jobId}}", "status"]
              }
            }
          },
          {
            name: "Delete or Soft-Close Job",
            request: {
              method: "DELETE",
              url: {
                raw: "{{baseUrl}}/api/v1/jobs/{{jobId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "jobs", "{{jobId}}"]
              }
            }
          }
        ]
      },
      {
        name: "03. CV Upload & Extraction",
        item: [
          {
            name: "Upload CV File (Multipart)",
            request: {
              auth: {
                type: "bearer",
                bearer: [{ key: "token", value: "{{jwtToken}}", type: "string" }]
              },
              method: "POST",
              body: {
                mode: "formdata",
                formdata: [
                  {
                    key: "file",
                    type: "file",
                    src: ""
                  }
                ]
              },
              url: {
                raw: "{{baseUrl}}/api/v1/cv/upload",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "cv", "upload"]
              }
            }
          },
          {
            name: "Get Parsed CV By ID",
            request: {
              auth: {
                type: "bearer",
                bearer: [{ key: "token", value: "{{jwtToken}}", type: "string" }]
              },
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/cv/{{cvId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "cv", "{{cvId}}"]
              }
            }
          },
          {
            name: "Re-extract CV",
            request: {
              auth: {
                type: "bearer",
                bearer: [{ key: "token", value: "{{jwtToken}}", type: "string" }]
              },
              method: "POST",
              url: {
                raw: "{{baseUrl}}/api/v1/cv/{{cvId}}/extract",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "cv", "{{cvId}}", "extract"]
              }
            }
          },
          {
            name: "Download Original CV File",
            request: {
              auth: {
                type: "bearer",
                bearer: [{ key: "token", value: "{{jwtToken}}", type: "string" }]
              },
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/cv/{{cvId}}/file",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "cv", "{{cvId}}", "file"]
              }
            }
          }
        ]
      },
      {
        name: "04. Candidate Screening & Matching",
        item: [
          {
            name: "Match Single CV vs JD (Hybrid Scoring)",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  cvId: "{{cvId}}",
                  jobId: "{{jobId}}"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/screening/match",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "screening", "match"]
              }
            }
          },
          {
            name: "Rank Candidates For Job",
            request: {
              method: "POST",
              url: {
                raw: "{{baseUrl}}/api/v1/screening/rank/{{jobId}}?limit=20",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "screening", "rank", "{{jobId}}"],
                query: [{ key: "limit", value: "20" }]
              }
            }
          },
          {
            name: "Lookup Skill Taxonomy",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/screening/taxonomy/lookup?skill=k8s",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "screening", "taxonomy", "lookup"],
                query: [{ key: "skill", value: "k8s" }]
              }
            }
          }
        ]
      },
      {
        name: "05. Candidates 360° Management",
        item: [
          {
            name: "List Candidates (Filters & Search)",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/candidates?page=1&limit=10&skill=NestJS&minScore=70",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "candidates"],
                query: [
                  { key: "page", value: "1" },
                  { key: "limit", value: "10" },
                  { key: "skill", value: "NestJS" },
                  { key: "minScore", value: "70" }
                ]
              }
            }
          },
          {
            name: "Get Candidate 360° Profile",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/candidates/{{candidateId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "candidates", "{{candidateId}}"]
              }
            }
          },
          {
            name: "Create or Deduplicate Candidate",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "if (pm.response.code === 201 || pm.response.code === 200) {",
                    "    var res = pm.response.json();",
                    "    var id = res._id || (res.data && res.data._id);",
                    "    if (id) {",
                    "        pm.environment.set('candidateId', id);",
                    "        console.log('✅ Captured candidateId:', id);",
                    "    }",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  fullName: "Trần Bảo Nam",
                  email: "{{candidateEmail}}",
                  phone: "0912345678",
                  location: "Hà Nội",
                  currentTitle: "Lead Software Architect",
                  summary: "5+ năm kinh nghiệm phát triển microservices bằng NestJS và MongoDB."
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/candidates",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "candidates"]
              }
            }
          },
          {
            name: "Update Candidate & Anonymize",
            request: {
              method: "PUT",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  location: "Đà Nẵng / Remote",
                  anonymized: true
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/candidates/{{candidateId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "candidates", "{{candidateId}}"]
              }
            }
          },
          {
            name: "Update Candidate Pipeline Status",
            request: {
              method: "PATCH",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  status: "INTERVIEW",
                  jobId: "{{jobId}}",
                  note: "Ứng viên vượt qua vòng sàng lọc kỹ thuật"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/candidates/{{candidateId}}/status",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "candidates", "{{candidateId}}", "status"]
              }
            }
          },
          {
            name: "Delete Candidate Profile",
            request: {
              method: "DELETE",
              url: {
                raw: "{{baseUrl}}/api/v1/candidates/{{candidateId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "candidates", "{{candidateId}}"]
              }
            }
          }
        ]
      },
      {
        name: "06. Applications & Kanban Workflow",
        item: [
          {
            name: "Get Kanban Board (7 Columns)",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/applications/kanban?jobId={{jobId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "applications", "kanban"],
                query: [{ key: "jobId", value: "{{jobId}}" }]
              }
            }
          },
          {
            name: "Query Applications List",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/applications?page=1&limit=10&status=SHORTLISTED",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "applications"],
                query: [
                  { key: "page", value: "1" },
                  { key: "limit", value: "10" },
                  { key: "status", value: "SHORTLISTED" }
                ]
              }
            }
          },
          {
            name: "Submit New Application",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "if (pm.response.code === 201 || pm.response.code === 200) {",
                    "    var res = pm.response.json();",
                    "    var id = res._id || (res.data && res.data._id);",
                    "    if (id) {",
                    "        pm.environment.set('applicationId', id);",
                    "        console.log('✅ Captured applicationId:', id);",
                    "    }",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  candidateId: "{{candidateId}}",
                  jobId: "{{jobId}}",
                  cvId: "{{cvId}}"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/applications",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "applications"]
              }
            }
          },
          {
            name: "Get Application 360° Detail",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/applications/{{applicationId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "applications", "{{applicationId}}"]
              }
            }
          },
          {
            name: "Kanban Drag-and-Drop Status Update [FR-CAND-03]",
            request: {
              method: "PATCH",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  status: "OFFER",
                  note: "Ứng viên trả lời phỏng vấn xuất sắc, gửi thư mời nhận việc",
                  decidedBy: "HR Manager",
                  offerDetails: {
                    salaryGross: 45000000,
                    startDate: "2026-12-01",
                    probationMonths: 2
                  }
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/applications/{{applicationId}}/status",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "applications", "{{applicationId}}", "status"]
              }
            }
          },
          {
            name: "Delete Application & Cleanup",
            request: {
              method: "DELETE",
              url: {
                raw: "{{baseUrl}}/api/v1/applications/{{applicationId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "applications", "{{applicationId}}"]
              }
            }
          }
        ]
      },
      {
        name: "07. AI Interview Generation (RAG)",
        item: [
          {
            name: "Generate Tailored RAG Interview Questions [FR-INT-01]",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "if (pm.response.code === 201 || pm.response.code === 200) {",
                    "    var res = pm.response.json();",
                    "    var id = res._id || (res.data && res.data._id);",
                    "    if (id) {",
                    "        pm.environment.set('interviewId', id);",
                    "        console.log('✅ Captured interviewId:', id);",
                    "    }",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  applicationId: "{{applicationId}}",
                  targetQuestionCount: 5,
                  includeRubrics: true
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/interviews/generate",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "interviews", "generate"]
              }
            }
          },
          {
            name: "Get Interview Questions By ID",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/interviews/{{interviewId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "interviews", "{{interviewId}}"]
              }
            }
          },
          {
            name: "Human-in-the-loop Update Questions [FR-INT-02]",
            request: {
              method: "PUT",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  notes: "Ứng viên trả lời rất tự tin về kiến trúc microservices và Kafka",
                  overallRating: 9
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/interviews/{{interviewId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "interviews", "{{interviewId}}"]
              }
            }
          },
          {
            name: "Export Interview Sheet [FR-INT-03]",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  format: "markdown"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/v1/interviews/{{interviewId}}/export",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "interviews", "{{interviewId}}", "export"]
              }
            }
          },
          {
            name: "Search Domain Question Bank Templates",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/interviews/question-bank/templates?skills=NestJS,Docker&category=TECHNICAL_DEEP_DIVE&limit=5",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "interviews", "question-bank", "templates"],
                query: [
                  { key: "skills", value: "NestJS,Docker" },
                  { key: "category", value: "TECHNICAL_DEEP_DIVE" },
                  { key: "limit", value: "5" }
                ]
              }
            }
          }
        ]
      },
      {
        name: "08. Recruitment Analytics & Dashboard",
        item: [
          {
            name: "Get Dashboard Overview [FR-REP-01]",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/analytics/dashboard",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "analytics", "dashboard"]
              }
            }
          },
          {
            name: "Get Dashboard Filtered By Job ID",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/analytics/dashboard?jobId={{jobId}}",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "analytics", "dashboard"],
                query: [{ key: "jobId", value: "{{jobId}}" }]
              }
            }
          }
        ]
      },
      {
        name: "09. AI Engine Status & Health",
        item: [
          {
            name: "Get AI Providers Availability Status",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/api/v1/ai/status",
                host: ["{{baseUrl}}"],
                path: ["api", "v1", "ai", "status"]
              }
            }
          }
        ]
      }
    ]
  };

  const outDir = path.resolve(__dirname, '../../docs/postman');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFilePath = path.join(outDir, 'Smart_HR_APIs.postman_collection.json');
  fs.writeFileSync(outFilePath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`✅ Postman Collection v2.1 generated successfully at: ${outFilePath}`);
}

buildPostmanCollection();
