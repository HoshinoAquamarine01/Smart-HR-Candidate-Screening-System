export class TextSanitizerUtil {
  private static readonly WORD_REGEX =
    /[A-Za-z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]+/g;

  private static readonly ALPHANUMERIC_REGEX = /[a-zA-Z0-9À-ỹđĐ]/g;

  static sanitize(rawText: string): string {
    if (!rawText) {
      return '';
    }

    let text = rawText
      .replace(/\uFEFF/g, '')
      .replace(/[\u200B\u200C\u200D]/g, '')
      .replace(/\0/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    text = text.replace(/[\u00A0\u3000]/g, ' ');
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    text = text
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/g, ''))
      .join('\n');

    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  }

  static countWords(text: string): number {
    if (!text) {
      return 0;
    }
    return text.match(TextSanitizerUtil.WORD_REGEX)?.length ?? 0;
  }

  static isScannedPDF(rawText: string): boolean {
    const text = rawText ?? '';
    const alphanumericCount = text.match(TextSanitizerUtil.ALPHANUMERIC_REGEX)?.length ?? 0;

    if (alphanumericCount < 50) {
      return true;
    }

    if (text.length === 0) {
      return true;
    }

    const ratio = alphanumericCount / text.length;
    return ratio < 0.35;
  }
}
