export interface GoldenCvItem {
  id: string;
  category: 'vietnamese' | 'english' | 'edge-case';
  title: string;
  rawText: string;
  groundTruth: {
    fullName: string;
    email: string | null;
    phone: string | null;
    yearsOfExperience: number;
    expectedTechSkills: string[];
  };
}

export const GOLDEN_DATASET: GoldenCvItem[] = [
  {
    id: 'CV-VN-001',
    category: 'vietnamese',
    title: 'Senior Backend Engineer (Tiếng Việt)',
    rawText: `
      HỒ SƠ ỨNG VIÊN
      NGUYỄN VĂN AN
      Vị trí ứng tuyển: Senior Backend Engineer
      Email: an.nguyen@techcorp.vn | Số điện thoại: 0912345678
      Địa chỉ: Cầu Giấy, Hà Nội
      
      MỤC TIÊU NGHỀ NGHIỆP:
      Hơn 4 năm kinh nghiệm làm việc với hệ thống Microservices backend.

      KỸ NĂNG:
      TypeScript, Node.js, NestJS, Go, PostgreSQL, MongoDB, Redis, Docker, AWS

      KINH NGHIỆM:
      FPT Software
      Senior Backend Developer | 01/2022 - 06/2024
      Thiết kế và tối ưu microservices.

      VNG Corporation
      Junior Backend Developer | 01/2020 - 12/2021
      Phát triển API thanh toán.
    `,
    groundTruth: {
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@techcorp.vn',
      phone: '0912345678',
      yearsOfExperience: 4.5,
      expectedTechSkills: ['TypeScript', 'Node.js', 'NestJS', 'Go', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS'],
    },
  },
  {
    id: 'CV-EN-002',
    category: 'english',
    title: 'Full Stack Developer (English 2-column format)',
    rawText: `
      SARAH JENKINS
      Full Stack Software Developer
      Email: sarah.j@devmail.com | Phone: +84901234567 | San Francisco, CA
      
      SUMMARY:
      Software Engineer with expertise in building reactive user interfaces and serverless architectures.
      
      SKILLS:
      Technical: JavaScript, TypeScript, React, Next.js, Node.js, MongoDB, Tailwind CSS
      Tools: Git, Docker, Jest, Figma
      
      EXPERIENCE:
      Acme Cloud Solutions
      Full Stack Developer | 2022-01 - 2024-06
      Engineered scalable client applications.
      
      Starlight Technologies
      Web Developer | 2020-01 - 2021-12
      Developed frontend components and RESTful APIs.
    `,
    groundTruth: {
      fullName: 'Sarah Jenkins',
      email: 'sarah.j@devmail.com',
      phone: '0901234567',
      yearsOfExperience: 4.5,
      expectedTechSkills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'MongoDB', 'Tailwind CSS'],
    },
  },
  {
    id: 'CV-VN-003',
    category: 'vietnamese',
    title: 'Fresher Frontend Developer (Format có dấu chấm điện thoại & chữ hoa thường)',
    rawText: `
      TRẦN THỊ MAI
      Frontend Developer (Fresher)
      Liên hệ: mai.tran@gmail.com - 0987.654.321
      Đà Nẵng, Việt Nam
      
      KỸ NĂNG KỸ THUẬT:
      React, JavaScript, HTML, CSS, Bootstrap, Git
      
      KINH NGHIỆM:
      NextGen Tech
      Fresher Frontend Developer | 06/2023 - 12/2024
      Xây dựng giao diện thương mại điện tử bằng React và Bootstrap.
      
      HỌC VẤN:
      Đại học Bách Khoa Đà Nẵng
      Cử nhân Công nghệ Thông tin | 2019 - 2023
    `,
    groundTruth: {
      fullName: 'Trần Thị Mai',
      email: 'mai.tran@gmail.com',
      phone: '0987654321',
      yearsOfExperience: 1.5,
      expectedTechSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'Bootstrap'],
    },
  },
  {
    id: 'CV-EDGE-004',
    category: 'edge-case',
    title: 'Edge Case: 2 Công việc làm song song (Overlapping work experience deduplication)',
    rawText: `
      LÊ HOÀNG NAM
      DevOps & Cloud Engineer
      Email: nam.le@cloudexpert.io | Phone: 0933112233
      
      KINH NGHIỆM LÀM VIỆC:
      Công ty Alpha Tech
      DevOps Engineer | 01/2021 - 12/2022
      Triển khai Kubernetes và CI/CD.
      
      Công ty Beta Software (Freelance song song)
      Cloud Consultant | 06/2021 - 06/2022
      Hỗ trợ kiến trúc AWS.
      
      Công ty Gamma Global
      Senior Cloud Architect | 01/2023 - 10/2024
      Quản lý hạ tầng đám mây.
      
      KỸ NĂNG:
      Docker, Kubernetes, AWS, Terraform, Ansible, Python, Git
    `,
    groundTruth: {
      fullName: 'Lê Hoàng Nam',
      email: 'nam.le@cloudexpert.io',
      phone: '0933112233',
      // Alpha: 24 months (01/2021-12/2022), Beta overlapping (06/2021-06/2022: +0), Gamma: 01/2023-10/2024 (22 months). Total 46 months = ~3.8 years
      yearsOfExperience: 3.8,
      expectedTechSkills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Ansible', 'Python'],
    },
  },
  {
    id: 'CV-EDGE-005',
    category: 'edge-case',
    title: 'Edge Case: Nhầm chức danh làm tên ứng viên (Header Disambiguation)',
    rawText: `
      CURRICULUM VITAE
      SENIOR FULLSTACK DEVELOPER
      PHẠM MINH ĐỨC
      Email: duc.pham@innovate.com | Hotline: 0944556677
      
      TÓM TẮT:
      Hơn 3 năm kinh nghiệm lập trình hệ thống web thương mại điện tử.
      
      CHUYÊN MÔN:
      Node.js, React, TypeScript, PostgreSQL, Redis, Docker
      
      KINH NGHIỆM:
      Tiki Corporation
      Fullstack Developer | 01/2022 - 10/2024
      Phát triển giỏ hàng và thanh toán.
    `,
    groundTruth: {
      fullName: 'Phạm Minh Đức',
      email: 'duc.pham@innovate.com',
      phone: '0944556677',
      yearsOfExperience: 2.8,
      expectedTechSkills: ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker'],
    },
  },
  {
    id: 'CV-EDGE-006',
    category: 'edge-case',
    title: 'Edge Case: Chuẩn hóa từ điển công nghệ biến thể (Tech Synonym Mapping)',
    rawText: `
      VŨ QUỐC BẢO
      Software Engineer
      Email: bao.vu@devs.net | Phone: 0977889900
      
      KỸ NĂNG:
      - Ngôn ngữ: Golang, C#, C++, Python, TS, JS
      - Frameworks: ReactJS, Vue 3, NestJS, NextJS, ExpressJS
      - Cơ sở dữ liệu: Postgres, Mongo, Redis
      - Cloud: AWS Cloud, GCP, k8s, Docker
      
      KINH NGHIỆM:
      VinGroup Tech
      Backend Developer | 01/2021 - 10/2024
      Phát triển IoT backend.
    `,
    groundTruth: {
      fullName: 'Vũ Quốc Bảo',
      email: 'bao.vu@devs.net',
      phone: '0977889900',
      yearsOfExperience: 3.8,
      expectedTechSkills: ['Go', 'C#', 'C++', 'Python', 'TypeScript', 'JavaScript', 'React', 'Vue.js', 'NestJS', 'Next.js', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'GCP', 'Kubernetes', 'Docker'],
    },
  },
  {
    id: 'CV-EN-007',
    category: 'english',
    title: 'Data Engineer (English format with international phone format)',
    rawText: `
      DAVID MILLER
      Lead Data Platform Engineer
      Email: david.m@datatech.org | Phone: +84-966-123-456 | Location: Ho Chi Minh City
      
      PROFESSIONAL SUMMARY:
      Passionate Data Engineer with strong background in big data architectures and streaming pipelines.
      
      CORE COMPETENCIES:
      Python, Java, Apache Kafka, PostgreSQL, Docker, AWS, Kubernetes
      
      WORK HISTORY:
      DataFlow Systems
      Senior Data Engineer | 2021-06 - 2024-10
      Built real-time analytics pipeline processing 50M events/day.
    `,
    groundTruth: {
      fullName: 'David Miller',
      email: 'david.m@datatech.org',
      phone: '0966123456',
      yearsOfExperience: 3.4,
      expectedTechSkills: ['Python', 'Java', 'Apache Kafka', 'PostgreSQL', 'Docker', 'AWS', 'Kubernetes'],
    },
  },
  {
    id: 'CV-VN-008',
    category: 'vietnamese',
    title: 'Mobile Engineer (Flutter & React Native)',
    rawText: `
      HOÀNG ĐÌNH TRỌNG
      Mobile App Developer (Flutter & React Native)
      Email: trong.hoang@mobiledev.vn | SĐT: 0905123987
      
      KỸ NĂNG:
      Flutter, React Native, TypeScript, Firebase, SQLite, Git
      
      KINH NGHIỆM:
      AppNest Vietnam
      Mobile Developer | 03/2022 - 10/2024
      Phát triển ứng dụng tài chính và mạng xã hội.
    `,
    groundTruth: {
      fullName: 'Hoàng Đình Trọng',
      email: 'trong.hoang@mobiledev.vn',
      phone: '0905123987',
      yearsOfExperience: 2.6,
      expectedTechSkills: ['Flutter', 'React Native', 'TypeScript', 'Firebase', 'SQLite', 'Git'],
    },
  },
];
