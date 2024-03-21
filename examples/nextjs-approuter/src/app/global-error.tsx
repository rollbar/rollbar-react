'use client';

import { useEffect } from 'react';
import { ResetPage } from '@/components/ResetPage';
import { useRollbar } from '@rollbar/react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const rollbar = useRollbar();

  useEffect(() => {
    rollbar.error(error);
  }, [error, rollbar]);

  return (
    <html>
      <body>
        <ResetPage reset={reset} />;
      </body>
    </html>
  );
}
