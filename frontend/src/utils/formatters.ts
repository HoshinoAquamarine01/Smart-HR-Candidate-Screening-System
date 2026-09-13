export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}
