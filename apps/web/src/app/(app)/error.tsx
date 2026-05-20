'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppError]', error);
  }, [error]);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 gap-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-sm rounded-[20px] p-5 flex flex-col gap-3"
        style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)' }}
      >
        <p className="text-[15px] font-bold" style={{ color: 'var(--ios-red)' }}>
          Ошибка приложения
        </p>
        <p className="text-[13px] font-mono break-all" style={{ color: 'var(--label-secondary)' }}>
          {error.message || String(error)}
        </p>
        {error.digest && (
          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>
            digest: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="h-10 px-6 rounded-[14px] font-semibold text-[14px] text-white"
        style={{ background: 'var(--ios-blue)' }}
      >
        Попробовать снова
      </button>
    </div>
  );
}
