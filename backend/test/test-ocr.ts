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

function buildPdfWithText(text: string): Buffer {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 18 Tf 50 700 Td (${escaped}) Tj ET`;
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

function buildSampleDocx(): Buffer {
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
    <w:p><w:r><w:t>Nguyen Van A Software Engineer NestJS React</w:t></w:r></w:p>
  </w:body>
</w:document>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`,
  });
}

async function runOcrTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG: OCR TEXT EXTRACTION');
  console.log('====================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      testPassed++;
    } else {
      console.log(` ❌ FAIL: ${testName}`);
      testFailed++;
    }
  }

  const imageOcr = new ImageOcrStrategy();
  const ocrService = new OcrService(
    new PdfExtractorStrategy(imageOcr),
    new DocxExtractorStrategy(),
    imageOcr,
  );

  const fixturesDir = path.join(process.cwd(), 'test', 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  try {
    // ---------------------------------------------------------
    // TEST CASE 1: TextSanitizerUtil
    // ---------------------------------------------------------
    const dirty =
      '\uFEFF  Hello\u00A0World  \r\n\r\n\r\n\nSoftware\tEngineer  \nKỹ năng NestJS';
    const cleaned = TextSanitizerUtil.sanitize(dirty);
    const wordCount = TextSanitizerUtil.countWords(cleaned);

    assert(!cleaned.includes('\uFEFF') && !cleaned.includes('\u00A0'), '1.1 Loại bỏ BOM và non-breaking space');
    assert(!cleaned.includes('\r') && !cleaned.includes('\n\n\n'), '1.2 Chuẩn hóa xuống dòng, không còn 3+ newline');
    assert(wordCount >= 5, `1.3 Đếm đúng số từ (actual=${wordCount})`);
    assert(
      TextSanitizerUtil.isScannedPDF('*** ###') === true &&
        TextSanitizerUtil.isScannedPDF('A'.repeat(80)) === false,
      '1.4 Phát hiện scanned PDF theo độ dài / tỷ lệ alphanumeric',
    );

    // ---------------------------------------------------------
    // TEST CASE 2: PDF kỹ thuật số
    // ---------------------------------------------------------
    const pdfPath = path.join(fixturesDir, 'sample-cv.pdf');
    const pdfBuffer = buildPdfWithText('Senior Software Engineer CV Nguyen Van A NestJS MongoDB');
    fs.writeFileSync(pdfPath, pdfBuffer);

    const pdfResult = await ocrService.extractText(pdfPath, 'application/pdf', pdfBuffer);
    assert(
      pdfResult.extractorUsed === 'pdf-parse' && pdfResult.characterCount > 0,
      `2.1 PDF native -> pdf-parse & characterCount > 0 (extractor=${pdfResult.extractorUsed}, chars=${pdfResult.characterCount})`,
    );

    // ---------------------------------------------------------
    // TEST CASE 3: DOCX
    // ---------------------------------------------------------
    const docxPath = path.join(fixturesDir, 'sample-cv.docx');
    const docxBuffer = buildSampleDocx();
    fs.writeFileSync(docxPath, docxBuffer);

    const docxResult = await ocrService.extractText(
      docxPath,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      docxBuffer,
    );
    assert(
      docxResult.extractorUsed === 'mammoth' && docxResult.cleanedText.toLowerCase().includes('nguyen'),
      `3.1 DOCX -> mammoth (extractor=${docxResult.extractorUsed})`,
    );

    // ---------------------------------------------------------
    // TEST CASE 4: Ảnh PNG
    // ---------------------------------------------------------
    const pngPath = path.join(fixturesDir, 'sample-cv.png');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
      'base64',
    );
    fs.writeFileSync(pngPath, pngBuffer);

    const pngResult = await ocrService.extractText(pngPath, 'image/png', pngBuffer);
    assert(
      pngResult.extractorUsed === 'image-ocr' && pngResult.isScanned === true,
      `4.1 PNG -> image-ocr & isScanned=true (extractor=${pngResult.extractorUsed})`,
    );

    // ---------------------------------------------------------
    // TEST CASE 5: Error handling
    // ---------------------------------------------------------
    const missing = await ocrService.extractText(
      path.join(fixturesDir, 'does-not-exist.pdf'),
      'application/pdf',
    );
    assert(
      missing.extractorUsed === 'raw-fallback' && missing.confidenceScore === 0,
      '5.1 File không tồn tại -> raw-fallback, không crash',
    );

    const xyzPath = path.join(fixturesDir, 'unknown.xyz');
    fs.writeFileSync(xyzPath, 'not a cv');
    const unknown = await ocrService.extractText(xyzPath, 'application/octet-stream');
    assert(
      unknown.extractorUsed === 'raw-fallback' && unknown.confidenceScore === 0,
      '5.2 Format .xyz -> raw-fallback, không crash',
    );
  } catch (err: any) {
    assert(false, `Ngoại lệ không được bắt: ${err?.message || err}`);
  } finally {
    await imageOcr.onModuleDestroy();
  }

  console.log('\n====================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ OCR: ${testPassed}/${testPassed + testFailed} PASSED`);
  console.log('====================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runOcrTests().catch((err) => {
  console.error('Lỗi khi chạy test OCR:', err);
  process.exit(1);
});
