import type { ReactElement } from 'react';

export interface LoadingSkeletonProps {
  rows?: number;
  height?: number;
}

export function LoadingSkeleton({ rows = 4, height = 48 }: LoadingSkeletonProps): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', margin: '12px 0' }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height,
            backgroundColor: 'var(--bg-muted)',
            borderRadius: 8,
            width: '100%',
            opacity: 0.65,
          }}
        />
      ))}
    </div>
  );
}
