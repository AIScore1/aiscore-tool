'use client';
import { useState } from 'react';
import { AuditForm } from './AuditForm';
import { AuditProgress } from './AuditProgress';
import { AuditReport } from './AuditReport';
import { AuditReport as AuditReportType } from '@/lib/types';

type Phase = 'form' | 'progress' | 'report';

export function AuditTab() {
  const [phase, setPhase] = useState<Phase>('form');
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReportType | null>(null);

  const start = async (input: {
    url: string;
    businessName: string;
    businessType: string;
    sector: string;
    location: string;
    services: string[];
  }) => {
    setPhase('progress');
    setPercent(0);
    setMessage('Starting audit...');
    setError(null);
    setReport(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
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
              setReport(data.data);
              setPhase('report');
            } else if (data.type === 'error') {
              setError(data.error || 'Unknown error');
            }
          } catch {}
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audit failed');
    }
  };

  if (phase === 'form') return <AuditForm onSubmit={start} />;
  if (phase === 'progress')
    return (
      <AuditProgress
        percent={percent}
        message={message}
        error={error}
        onCancel={() => setPhase('form')}
      />
    );
  if (phase === 'report' && report)
    return <AuditReport report={report} onNew={() => setPhase('form')} />;
  return null;
}
