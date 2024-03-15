'use client';

import { useEffect } from 'react';
import { rollbarInstance } from '@/rollbar';
import { ResetPage } from '@/components/ResetPage';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    rollbarInstance.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <ResetPage reset={reset} />;
      </body>
    </html>
  );
}
