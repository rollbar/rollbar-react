import React, { ReactElement } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Rollbar from 'rollbar';
import { ErrorBoundary } from '@rollbar/react';
import ExampleErrors from './ExampleErrors';
import ExampleClass from './ExampleClass';
import { FallbackUI } from './FallbackUI';

function App(): ReactElement {
  const rollbar = new Rollbar({
    accessToken: 'POST_CLIENT_ITEM_TOKEN',
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
  });

  return (
    <div className="App">
      <header className="App-header">
        <p>Rollbar React Example</p>
      </header>
      <ErrorBoundary
        rollbar={rollbar}
        fallbackUI={FallbackUI}
        extra={{ data: 'foo' }}
      >
        <Router>
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/away">Away</Link>
              </li>
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<ExampleErrors name="Home" />} />
            <Route path="/away" element={<ExampleErrors name="Away" />} />
          </Routes>
        </Router>
        <ExampleClass />
      </ErrorBoundary>
    </div>
  );
}

export default App;
