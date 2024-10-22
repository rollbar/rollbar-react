'use client';

import { useEffect } from 'react';
import { ResetPage } from '@/components/ResetPage';
import Rollbar from 'rollbar';
import { clientConfig } from '@/rollbar';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {

  useEffect(() => {
    const rollbar = new Rollbar(clientConfig)
    rollbar.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <ResetPage reset={reset} />;
      </body>
    </html>
  );
}
