import React, { ReactElement } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Rollbar from 'rollbar';
import { Provider, ErrorBoundary } from '@rollbar/react';
import ExampleErrors from './ExampleErrors';
import ExampleClass from './ExampleClass';
import { FallbackUI } from './FallbackUI';

function App(): ReactElement {
  const rollbarConfig: Rollbar.Configuration = {
    accessToken: 'POST_CLIENT_ITEM_TOKEN',
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

  // To provide your own Rollbar.js instance, pass `instance` to Provider
  // instead of `config`. One might do this if loading from a non-npm source.
  // const instance: Rollbar = new Rollbar(rollbarConfig);
  // <Provider instance={instance} >

  return (
    <Provider config={rollbarConfig} >
      <div className="App">
        <header className="App-header">
          <p>
            Rollbar React Example
          </p>
        </header>
        <ErrorBoundary fallbackUI={FallbackUI} extra={{ data: 'foo' }}>
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
              <Route path="/" element={<ExampleErrors name='Home' />} />
              <Route path="/away" element={<ExampleErrors name='Away' />} />
            </Routes>
          </Router>
          <ExampleClass />
        </ErrorBoundary>
      </div>
    </Provider>
  );
}

export default App;
