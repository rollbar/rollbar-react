import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, ErrorBoundary } from '@rollbar/react';

const rollbarConfig = {
  accessToken: 'e7318312f58b420fae9edd1669592723',
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: 'development',
    client: {
      javascript: {
        code_version: '1.0.0',
        source_map_enabled: true,
      }
    }
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </Provider>
  );
}

export default MyApp
