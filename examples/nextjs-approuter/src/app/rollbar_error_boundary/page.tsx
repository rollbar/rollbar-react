'use client';
import { Provider as RollbarProvider, ErrorBoundary } from '@rollbar/react';

import { rollbarInstance } from '../../rollbar';

export default function RollbarErrorBoundary() {
  return (
    <RollbarProvider instance={rollbarInstance}>
      <ErrorBoundary>
        <button
          onClick={() => {
            throw new Error('Something broke');
          }}
        >
          Click for Error with Rollbar Error Boundary
        </button>
      </ErrorBoundary>
    </RollbarProvider>
  );
}
