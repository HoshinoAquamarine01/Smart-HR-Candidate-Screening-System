import { useState } from 'react';
import { cvService } from '../services/cvService';

export function useCvParser() {
  const [parsing, setParsing] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const parseCv = async (file: File) => {
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await cvService.parseCv(formData);
      setResult(res);
    } finally {
      setParsing(false);
    }
  };

  return { parseCv, parsing, result };
}
