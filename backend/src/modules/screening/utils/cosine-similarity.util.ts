
export class CosineSimilarityUtil {
  /**
   * Tính tích vô hướng và độ dài vector để ra độ tương đồng Cosine
   * @param vecA Vector số thực A
   * @param vecB Vector số thực B
   * @returns Điểm Cosine trong khoảng [-1.0, 1.0]
   */
  static calculateCosine(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
      return 0;
    }

    if (vecA.length !== vecB.length) {
      
      const minLen = Math.min(vecA.length, vecB.length);
      vecA = vecA.slice(0, minLen);
      vecB = vecB.slice(0, minLen);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i];
      const b = vecB[i];
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    
 
    return Math.max(-1.0, Math.min(1.0, similarity));
  }

 
  static toPercentageScore(cosine: number): number {
    const normalized = ((cosine + 1) / 2) * 100;
    const rounded = Math.round(normalized * 10) / 10;
    return Math.max(0, Math.min(100, rounded));
  }

 
  static generateDeterministicEmbedding(text: string, dimensions = 128): number[] {
    const vector = new Array(dimensions).fill(0);
    if (!text || text.trim() === '') {
      return vector;
    }

    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter(t => t.length > 0);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash << 5) - hash + token.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += 1;

      
      if (i < tokens.length - 1) {
        const bigram = `${token}_${tokens[i + 1]}`;
        let biHash = 0;
        for (let j = 0; j < bigram.length; j++) {
          biHash = (biHash << 5) - biHash + bigram.charCodeAt(j);
          biHash |= 0;
        }
        const biIndex = Math.abs(biHash) % dimensions;
        vector[biIndex] += 1.5;
      }
    }

    
    let sumSquares = 0;
    for (let val of vector) {
      sumSquares += val * val;
    }
    const norm = Math.sqrt(sumSquares);
    if (norm > 0) {
      for (let k = 0; k < vector.length; k++) {
        vector[k] = Math.round((vector[k] / norm) * 10000) / 10000;
      }
    }

    return vector;
  }
}

