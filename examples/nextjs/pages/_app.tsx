import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, ErrorBoundary } from '@rollbar/react';

const rollbarConfig = {
  accessToken: process.env.POST_CLIENT_ITEM_ACCESS_TOKEN,
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
