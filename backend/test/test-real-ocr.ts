import * as fs from 'fs';
import * as path from 'path';
import { OcrService } from '../src/modules/ocr/ocr.service';
import { PdfExtractorStrategy } from '../src/modules/ocr/strategies/pdf-extractor.strategy';
import { DocxExtractorStrategy } from '../src/modules/ocr/strategies/docx-extractor.strategy';
import { ImageOcrStrategy } from '../src/modules/ocr/strategies/image-ocr.strategy';
import { TextSanitizerUtil } from '../src/modules/ocr/utils/text-sanitizer.util';

function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc >>> 0;
}

function createZip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  const names = Object.keys(files);

  for (const name of names) {
    const data = Buffer.from(files[name], 'utf8');
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);

    const localFull = Buffer.concat([local, nameBuf, data]);
    locals.push(localFull);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, nameBuf]));
    offset += localFull.length;
  }

  const centralDir = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(names.length, 8);
  eocd.writeUInt16LE(names.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, eocd]);
}

function buildRealisticDocx(): Buffer {
  return createZip({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>LE HOANG NAM - FULLSTACK ENGINEER</w:t></w:r></w:p>
    <w:p><w:r><w:t>Email: lehoangnam@example.com | Phone: 0912345678</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kinh nghiem: 4 nam phat trien ung dung voi NodeJS, NestJS, ReactJS, MongoDB, PostgreSQL.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Du an: Smart HR System - Xay dung he thong loc ho so ung vien tu dong su dung AI &amp; OCR.</w:t></w:r></w:p>
  </w:body>
</w:document>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`,
  });
}

function buildRealisticPdf(customLines?: string[]): Buffer {
  const lines = customLines ?? [
    'TRAN THI MAI - SENIOR DATA SCIENTIST',
    'Email: tranmai@example.com | Phone: +84 987 654 321',
    'Education: Hanoi University of Science and Technology (GPA: 3.8/4.0)',
    'Technical Skills: Python, PyTorch, TensorFlow, Natural Language Processing, LLM, LangChain',
    'Work Experience: 5 years leading ML engineering teams and building computer vision pipelines.',
  ];

  let stream = 'BT /F1 14 Tf 50 720 Td ';
  lines.forEach((l, idx) => {
    const escaped = l.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    if (idx === 0) {
      stream += `(${escaped}) Tj `;
    } else {
      stream += `0 -25 Td (${escaped}) Tj `;
    }
  });
  stream += 'ET';

  const parts = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'utf8')];
  const offsets = [0];
  let size = chunks[0].length;
  parts.forEach((obj, i) => {
    offsets.push(size);
    const chunk = Buffer.from(`${i + 1} 0 obj\n${obj}\nendobj\n`, 'utf8');
    chunks.push(chunk);
    size += chunk.length;
  });

  let xref = `xref\n0 ${parts.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= parts.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  chunks.push(Buffer.from(xref, 'utf8'));
  chunks.push(
    Buffer.from(
      `trailer\n<< /Size ${parts.length + 1} /Root 1 0 R >>\nstartxref\n${size}\n%%EOF\n`,
      'utf8',
    ),
  );
  return Buffer.concat(chunks);
}

async function runRealOcrValidation() {
  console.log('================================================================');
  console.log('🔬 KIỂM THỬ THỰC TẾ MODULE OCR (KHÔNG MOCK DATA)');
  console.log('================================================================\n');

  const imageOcr = new ImageOcrStrategy();
  const pdfExtractor = new PdfExtractorStrategy(imageOcr);
  const docxExtractor = new DocxExtractorStrategy();
  const ocrService = new OcrService(pdfExtractor, docxExtractor, imageOcr);

  const fixturesDir = path.join(process.cwd(), 'test', 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  let passed = 0;
  let failed = 0;

  function verify(condition: boolean, title: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      if (details) {
        console.log(`   Thông tin:`, JSON.stringify(details, null, 2));
      }
      passed++;
    } else {
      console.log(`❌ [FAIL] ${title}`);
      if (details) {
        console.log(`   Chi tiết lỗi:`, JSON.stringify(details, null, 2));
      }
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. KIỂM THỬ FILE PDF THẬT (Native PDF Text Extraction)
    // -------------------------------------------------------------
    console.log('\n--- 1. Kiểm thử Native PDF (pdf-parse) ---');
    const pdfPath = path.join(fixturesDir, 'real-test-cv.pdf');
    const pdfBuf = buildRealisticPdf();
    fs.writeFileSync(pdfPath, pdfBuf);

    const startPdf = Date.now();
    const pdfRes = await ocrService.extractText(pdfPath, 'application/pdf');
    const pdfDuration = Date.now() - startPdf;

    verify(
      pdfRes.extractorUsed === 'pdf-parse' &&
        pdfRes.cleanedText.includes('TRAN THI MAI') &&
        pdfRes.cleanedText.includes('Natural Language Processing') &&
        pdfRes.characterCount > 100,
      `Trích xuất văn bản từ Native PDF thành công (${pdfDuration}ms)`,
      {
        extractor: pdfRes.extractorUsed,
        chars: pdfRes.characterCount,
        words: pdfRes.wordCount,
        confidence: pdfRes.confidenceScore,
        sampleExtracted: pdfRes.cleanedText.substring(0, 120) + '...',
      },
    );

    // -------------------------------------------------------------
    // 2. KIỂM THỬ FILE DOCX THẬT (Mammoth XML Parsing)
    // -------------------------------------------------------------
    console.log('\n--- 2. Kiểm thử DOCX (mammoth) ---');
    const docxPath = path.join(fixturesDir, 'real-test-cv.docx');
    const docxBuf = buildRealisticDocx();
    fs.writeFileSync(docxPath, docxBuf);

    const startDocx = Date.now();
    const docxRes = await ocrService.extractText(docxPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const docxDuration = Date.now() - startDocx;

    verify(
      docxRes.extractorUsed === 'mammoth' &&
        docxRes.cleanedText.includes('LE HOANG NAM') &&
        docxRes.cleanedText.includes('Smart HR System') &&
        docxRes.wordCount > 20,
      `Trích xuất văn bản từ DOCX chuẩn thành công (${docxDuration}ms)`,
      {
        extractor: docxRes.extractorUsed,
        chars: docxRes.characterCount,
        words: docxRes.wordCount,
        confidence: docxRes.confidenceScore,
        sampleExtracted: docxRes.cleanedText,
      },
    );

    // -------------------------------------------------------------
    // 3. KIỂM THỬ FILE ẢNH THẬT CHỨA CHỮ (Tesseract.js OCR Engine)
    // -------------------------------------------------------------
    console.log('\n--- 3. Kiểm thử Ảnh Thật với Tesseract.js (ImageOcrStrategy) ---');
    const imgPath = path.join(fixturesDir, 'real-cv-image.png');
    
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Ảnh thực tế ${imgPath} không tìm thấy!`);
    }

    const startImg = Date.now();
    const imgRes = await ocrService.extractText(imgPath, 'image/png');
    const imgDuration = Date.now() - startImg;

    const textUpper = imgRes.cleanedText.toUpperCase();
    const recognizedKeyword =
      textUpper.includes('TRAN') ||
      textUpper.includes('DEVELOPER') ||
      textUpper.includes('NESTJS') ||
      textUpper.includes('MONGODB');

    verify(
      imgRes.extractorUsed === 'image-ocr' &&
        imgRes.isScanned === true &&
        recognizedKeyword &&
        imgRes.characterCount > 10,
      `Tesseract.js đọc ký tự từ ảnh thật thành công (${imgDuration}ms)`,
      {
        extractor: imgRes.extractorUsed,
        isScanned: imgRes.isScanned,
        confidence: imgRes.confidenceScore,
        recognizedLength: imgRes.characterCount,
        extractedContent: imgRes.cleanedText,
      },
    );

    // -------------------------------------------------------------
    // 3.5 KIỂM THỬ SCANNED PDF FALLBACK (PDF dạng ảnh quét)
    // -------------------------------------------------------------
    console.log('\n--- 3.5 Kiểm thử Scanned PDF Fallback (PdfExtractorStrategy -> ImageOcrStrategy) ---');
    const scannedPdfPath = path.join(fixturesDir, 'scanned-cv.pdf');
    // PDF với rất ít ký tự text (<30 ký tự) mô phỏng PDF dạng ảnh quét
    const scannedPdfBuf = buildRealisticPdf(['Page 1']);
    fs.writeFileSync(scannedPdfPath, scannedPdfBuf);

    const startScannedPdf = Date.now();
    const scannedPdfRes = await ocrService.extractText(scannedPdfPath, 'application/pdf');
    const scannedPdfDuration = Date.now() - startScannedPdf;

    verify(
      scannedPdfRes.extractorUsed === 'image-ocr' && scannedPdfRes.isScanned === true,
      `Phát hiện Scanned PDF và tự động Fallback sang Image OCR thành công (${scannedPdfDuration}ms)`,
      {
        extractor: scannedPdfRes.extractorUsed,
        isScanned: scannedPdfRes.isScanned,
        confidence: scannedPdfRes.confidenceScore,
        cleanedText: scannedPdfRes.cleanedText,
      },
    );
    console.log('\n--- 4. Kiểm thử Text Sanitizer & Fallback ---');
    const messyText = '\uFEFF  Nguyễn Văn A   \r\n\r\n\r\n\r\nKỹ sư phần mềm\t\t\tSenior NestJS  ';
    const sanitized = TextSanitizerUtil.sanitize(messyText);
    const words = TextSanitizerUtil.countWords(sanitized);

    verify(
      !sanitized.includes('\uFEFF') &&
        !sanitized.includes('\r') &&
        !sanitized.includes('\n\n\n') &&
        words === 9,
      'TextSanitizerUtil làm sạch BOM, xuống dòng thừa (>2), đếm từ chuẩn tiếng Việt',
      { sanitized, wordCount: words },
    );

    const nonExistent = await ocrService.extractText(path.join(fixturesDir, 'non-existent.pdf'));
    verify(
      nonExistent.rawText === '' && nonExistent.confidenceScore === 0,
      'Xử lý an toàn khi file không tồn tại (Graceful Fallback, không crash)',
      nonExistent,
    );

  } catch (err: any) {
    verify(false, `Lỗi ngoại lệ trong quá trình kiểm thử: ${err?.message || err}`);
  } finally {
    await imageOcr.onModuleDestroy();
  }

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT: ${passed}/${passed + failed} KIỂM THỬ ĐẠT (PASS)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRealOcrValidation().catch((e) => {
  console.error('Fatal error running real OCR validation:', e);
  process.exit(1);
});
