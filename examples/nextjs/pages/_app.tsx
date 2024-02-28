import React from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Provider, ErrorBoundary } from '@rollbar/react';

const rollbarConfig = {
  accessToken: process.env.NEXT_PUBLIC_ROLLBAR_TOKEN,
  hostSafeList: ['localhost:3000', 'localhost:4000'],
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: 'development',
    client: {
      javascript: {
        code_version: '1.0.0',
        source_map_enabled: true,
      },
    },
  },
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary
        level="critical"
        errorMessage="example error boundary message"
        fallbackUI={() => (
          <p style={{ color: 'red' }}>Oops, there was an error.</p>
        )}
        extra={{ more: 'data' }}
        callback={() => console.log('an exception was sent to rollbar')}
      >
        <Component {...pageProps} />
      </ErrorBoundary>
    </Provider>
  );
}

export default MyApp;
