'use client';

import { ErrorBoundary } from '@rollbar/react';

import { ResetPage } from '@/components/ResetPage';

export default function RollbarErrorBoundary() {
  return (
    <ErrorBoundary fallbackUI={() => <ResetPage reset={() => { location.reload()}} />}>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          throw new Error('Something broke');
        }}
      >
        Click for Error with Rollbar Error Boundary
      </button>
    </ErrorBoundary>
  );
}
