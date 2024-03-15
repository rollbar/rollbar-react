'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { rollbarInstance } from '@/rollbar';
import { ResetPage } from '@/components/ResetPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    rollbarInstance.error(error);
  }, [error]);

  return <ResetPage reset={reset} />;
}
