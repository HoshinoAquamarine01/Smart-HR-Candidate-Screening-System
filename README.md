# ⚡ Smart HR & Candidate Screening System

> **An AI-powered recruitment automation & candidate intelligence platform.**  
> Streamlining hiring workflows by automatically extracting resume data, calculating multi-dimensional candidate-JD match scores, and generating tailored technical interview questions and assessments.

[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![AI-Powered](https://img.shields.io/badge/AI Engine-LLM / GPT--4 / Gemini-107C41?style=flat-square&logo=openai)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 🌟 Executive Summary

Traditional recruitment processes suffer from manual CV screening bottlenecks, subjective screening bias, and time-consuming technical interview preparation. 

**Smart HR & Candidate Screening System** revolutionizes talent acquisition through an end-to-end automated AI pipeline. By leveraging **Large Language Models (LLMs)** and structured document parsing, the platform transforms unstructured candidate resumes (PDF/Word) into rich candidate profiles, evaluates them against Job Descriptions (JDs) with precision scoring, and dynamically formulates adaptive interview questions and technical test assessments tailored to each applicant's unique experience profile.

---

## 🔥 Key Features

### 📄 1. Intelligent CV Parsing (PDF / DOCX)
- Extracts structured entity data from raw resumes: **Work Experience**, **Tech Stack**, **Education**, **Certifications**, **Contact Details**, and **Key Achievements**.
- Handles complex multi-column layouts, legacy formatting, and diverse document styles using robust document text extraction and LLM structured output parsing.

### 🎯 2. Semantic JD-Candidate Fit Scoring Engine
- Performs contextual semantic matching beyond simple keyword counting.
- Evaluates candidates across multiple weighted dimensions:
  - **Technical Skill Fit**: Match between required vs. candidate tech stack.
  - **Seniority & Experience Match**: Alignment on years of experience and leadership/role scope.
  - **Domain & Project Relevance**: Industry exposure and project complexity.
- Generates a normalized match score (**0–100%**) accompanied by a clear, objective rationale summary highlighting strengths and skill gaps.

### 🤖 3. Adaptive Technical Interview Question Generator
- Replaces generic interview question lists with candidate-tailored technical probing.
- Automatically formulates questions based on:
  - Gaps between candidate background and Job Description requirements.
  - Deep-dive verification of claimed high-level skills or key projects on the CV.
- Supplies HR recruiters with recommended reference answers and scoring rubrics.

### 🧪 4. Personalized Technical Test Generation
- Auto-generates customized coding challenges or technical test assessments matched specifically to the role requirements and candidate seniority.
- Ensures objective, fair, and relevant pre-screening for every candidate.

### 📊 5. HR Candidate Pipeline Dashboard
- Interactive candidate ranking list sorted by AI match scores.
- Detailed candidate view cards with instant search, skill filtering, and breakdown metrics.
- Status management tracking candidates through screening, interview, assessment, and offer stages.

---

## 🏗 System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 19 + TypeScript + Vite)"]
        UI[HR Recruiter Dashboard]
        Upload[CV & Job Description Uploader]
        Analytics[Match Score & Question Generator View]
    end

    subgraph Backend ["Backend API (NestJS + Express)"]
        API[API Gateway / Controllers]
        ParserService[CV & Document Parser Service]
        MatchingEngine[Semantic Match Scoring Engine]
        QuestionGen[AI Interview & Test Generator Service]
    end

    subgraph External ["AI & Database Layer"]
        LLM[LLM Engine - OpenAI / Gemini API]
        DB[(Database - PostgreSQL / MongoDB)]
    end

    Upload -->|Upload PDF/Word CV & JD text| API
    API --> ParserService
    ParserService -->|Extract Raw Text| LLM
    LLM -->|Structured Profile JSON| ParserService
    ParserService --> MatchingEngine
    MatchingEngine -->|Evaluate Fit Dimensions| LLM
    LLM -->|Match Score & Rationale| MatchingEngine
    MatchingEngine --> QuestionGen
    QuestionGen -->|Generate Tailored Questions & Test| LLM
    API -->|Persist Profile & Results| DB
    API -->|Deliver Results & Reports| UI
```

---

## 🛠 Tech Stack

| Layer | Technology / Tools |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Modern CSS, Lucide Icons |
| **Backend** | NestJS (Node.js framework), TypeScript, RxJS, Express |
| **AI / NLP** | OpenAI GPT API / Google Gemini API, Prompt Engineering, JSON Schema Enforcement, PDF & DOCX Parsers |
| **Database & ORM** | PostgreSQL / MongoDB, Prisma / TypeORM |
| **Dev Tools & Testing** | Jest, Supertest, ESLint, Prettier |

---

## 📂 Project Structure

```
Smart-HR-Candidate-Screening-System/
├── backend/                  # NestJS REST API Backend
│   ├── src/
│   │   ├── modules/          # Feature modules (CV parsing, JD matching, Interview gen, Candidates)
│   │   ├── common/           # DTOs, Filters, Interceptors, Pipes, Constants
│   │   ├── app.module.ts     # Root module registration
│   │   └── main.ts           # Application entrypoint & Swagger config
│   ├── test/                 # Unit & End-to-End test suites
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # React + TypeScript + Vite Frontend App
│   ├── src/
│   │   ├── components/       # UI Components (Dashboard, CV Upload, Score Cards, Interview View)
│   │   ├── services/         # API Service integrations
│   │   ├── App.tsx           # App Shell & Navigation
│   │   └── main.tsx          # DOM Mounting point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                 # Project Documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9+) or **yarn** / **pnpm**
- **LLM API Key** (OpenAI API key or Google Gemini API key)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/Smart-HR-Candidate-Screening-System.git
cd Smart-HR-Candidate-Screening-System
```

### 2. Backend Installation & Setup
```bash
cd backend
npm install

# Configure Environment Variables
cp .env.example .env
```

Set up your `.env` variables:
```env
PORT=3000
LLM_API_KEY=your_openai_or_gemini_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/smarthr_db
```

Launch NestJS backend in development mode:
```bash
npm run start:dev
```
Backend API will run at `http://localhost:3000`.

### 3. Frontend Installation & Setup
In a new terminal tab:
```bash
cd frontend
npm install
npm run dev
```
Frontend web dashboard will be available at `http://localhost:5173`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/cv/parse` | Upload & extract structured candidate data from CV file (PDF/Word) |
| `POST` | `/api/v1/screening/match` | Compute candidate-JD match score with multi-dimensional breakdown |
| `POST` | `/api/v1/interviews/generate` | Auto-generate customized technical & situational interview questions |
| `POST` | `/api/v1/assessments/create` | Generate personalized technical test assessments |
| `GET`  | `/api/v1/candidates` | List screened candidates with ranking, filter & score metrics |
| `GET`  | `/api/v1/candidates/:id` | Fetch detailed candidate profile report |

---

## 💡 Engineering Highlights & System Design

- **Deterministic Structured Output**: Utilizes JSON Schema constraints and strict system prompts to ensure LLMs output parseable, typed JSON payloads for matching and question generation.
- **Modular & Extensible Architecture**: NestJS modular design ensures clear domain boundaries, making it straightforward to add new AI providers or ATS integrations.
- **Asynchronous Task Pipeline**: Built to support queue-based background processing (BullMQ / Redis) for bulk CV document processing without blocking thread event loops.
- **Data Privacy & PII Handling**: Designed with security best practices to sanitize/mask personally identifiable information (PII) before sending payload contents to external LLM providers.

---

## 📈 Roadmap & Future Enhancements

- [ ] **OCR & Scanned CV Parsing**: Integration with OCR engines (Tesseract / AWS Textract) to process image-based CVs.
- [ ] **RAG Talent Pool Search**: Natural language query search over existing candidate database using vector embeddings.
- [ ] **ATS Integration**: Seamless export/import sync with Greenhouse, Lever, and Workday.
- [ ] **AI Video Interview Screening**: Audio/video response analysis with speech transcription and competency scoring.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author & Contact

**Your Name**  
- **Email**: `your.email@example.com`  
- **GitHub**: [@yourusername](https://github.com)  
- **LinkedIn**: [linkedin.com/in/yourprofile](https://linkedin.com)
