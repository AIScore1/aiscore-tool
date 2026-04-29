export function ProgressBar({ percent, color = '#29a871' }: { percent: number; color?: string }) {
  return (
    <div style={{ background: '#e5e5e7', borderRadius: 999, height: 8, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, percent))}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}
