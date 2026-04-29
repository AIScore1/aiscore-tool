'use client';
import { useState } from 'react';
import { ImprovementForm } from './ImprovementForm';
import { ImprovementProgress } from './ImprovementProgress';
import { ImprovementDashboard } from './ImprovementDashboard';
import { BusinessProfile, ImprovementResult } from '@/lib/types';

type Phase = 'form' | 'progress' | 'dashboard';

export function ImproveTab() {
  const [phase, setPhase] = useState<Phase>('form');
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImprovementResult | null>(null);

  const start = async (profile: BusinessProfile) => {
    setPhase('progress');
    setPercent(0);
    setMessage('Starting...');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      if (!res.body) {
        setError('No response from server');
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.type === 'progress') {
              setPercent(data.percent ?? 0);
              setMessage(data.message ?? '');
            } else if (data.type === 'done') {
              setResult(data.data);
              setPhase('dashboard');
            } else if (data.type === 'error') {
              setError(data.error || 'Unknown error');
            }
          } catch {}
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    }
  };

  if (phase === 'form') return <ImprovementForm onSubmit={start} />;
  if (phase === 'progress')
    return (
      <ImprovementProgress
        percent={percent}
        message={message}
        error={error}
        onCancel={() => setPhase('form')}
      />
    );
  if (phase === 'dashboard' && result)
    return <ImprovementDashboard result={result} onNew={() => setPhase('form')} />;
  return null;
}
