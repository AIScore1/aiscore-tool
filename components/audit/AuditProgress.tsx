'use client';
import { ProgressBar } from '../ui/ProgressBar';

interface Props {
  percent: number;
  message: string;
  error: string | null;
  onCancel: () => void;
}

export function AuditProgress({ percent, message, error, onCancel }: Props) {
  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Running audit</h2>
      <ProgressBar percent={percent} />
      <div className="mt-3 text-sm text-brand-gray-dark">{message}</div>
      <div className="mt-1 text-xs text-brand-gray-dark">{percent}% complete</div>
      {error ? (
        <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
      ) : null}
      <button onClick={onCancel} className="btn-secondary mt-6">
        Back
      </button>
    </div>
  );
}
