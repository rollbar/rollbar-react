'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { ResetPage } from '@/components/ResetPage';
import { useRollbar } from '@rollbar/react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const rollbar = useRollbar();
  useEffect(() => {
    rollbar.error(error);
  }, [error]);

  return <ResetPage reset={reset} />;
}
