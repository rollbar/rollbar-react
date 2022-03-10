import { Routes, Route, Link } from 'react-router-dom'
import { Provider as RollbarProvider, ErrorBoundary, RollbarContext, useRollbar } from '@rollbar/react'

import './App.css';

const rollbarConfig = {
  accessToken: process.env.REACT_APP_PUBLIC_ROLLBAR_TOKEN,
  hostSafeList: [
    'localhost:3000',
    'localhost:4000',
  ],
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
};

function App() {
  return (
    <RollbarProvider config={rollbarConfig}>
      <ErrorBoundary>
        <RollbarContext context="whole-app">
          <nav>
            <ul>
              <li>
                <Link to="/a">A</Link>
              </li>
              <li>
                <Link to="/b">B</Link>
              </li>
            </ul>
          </nav>
          <Router />
        </RollbarContext>
      </ErrorBoundary>
    </RollbarProvider>
  );
}

export default App;

function Router() {
  return (
    <Routes>
      <Route path="a" element={<RouteA />} />
      <Route path="b" element={<RouteB />} />
    </Routes>
  );
}

function RouteA() {
  const rollbar = useRollbar();

  return <div>
    <h1>A</h1>
    <button onClick={() => rollbar.info('hello, example')}>send message</button>
  </div>;
}

function RouteB() {
  return <div>
    <h1>B</h1>
    <button onClick={() => {
        throw new Error('uncaught example');
    }}>throw uncaught error</button>
  </div>;
}
