import { scoreColor, shortGrade } from '@/lib/scoring';

export function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      style={{
        background: scoreColor(score),
        color: '#fff',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {shortGrade(score)}
    </span>
  );
}
