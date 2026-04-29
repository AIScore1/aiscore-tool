'use client';
import { scoreColor } from '@/lib/scoring';

export function ScoreGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = scoreColor(score);
  const fontSize = size === 'lg' ? 64 : size === 'md' ? 40 : 28;
  return (
    <div className="inline-block">
      <div style={{ color, fontSize, fontWeight: 600, lineHeight: 1 }}>{score}</div>
      <div className="text-xs text-brand-gray-dark uppercase tracking-wide">/ 100</div>
    </div>
  );
}
