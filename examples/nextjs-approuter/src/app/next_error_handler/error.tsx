'use client';

import { useEffect } from 'react';
import { ResetPage } from '@/components/ResetPage';
import { useRollbar } from '@rollbar/react';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.log('NextErrorHandler error', error);

  const rollbar = useRollbar();
  useEffect(() => {
    console.log('NextErrorHandler useEffect', rollbar);
    rollbar.error(error);
  }, [error, rollbar]);

  return <ResetPage reset={reset} />;
}
