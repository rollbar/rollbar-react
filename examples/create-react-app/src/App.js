import { React, useState, useMemo } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import {
  Provider as RollbarProvider,
  ErrorBoundary,
  RollbarContext,
  useRollbar,
} from '@rollbar/react'

import './App.css'

const rollbarConfig = {
  accessToken: process.env.REACT_APP_PUBLIC_ROLLBAR_TOKEN,
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
}

function App() {
  return (
    <RollbarProvider config={rollbarConfig}>
      <ErrorBoundary
        level="critical"
        errorMessage="example error boundary message"
        fallbackUI={() => (
          <p style={{ color: 'red' }}>Oops, there was an error.</p>
        )}
        extra={{ more: 'data' }}
        callback={() => console.log('an exception was sent to rollbar')}
      >
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
      </ErrorBoundary>
    </RollbarProvider>
  )
}

export default App

function Router() {
  return (
    <Routes>
      <Route path="a" element={<RouteA />} />
      <Route path="b" element={<RouteB />} />
    </Routes>
  )
}

function RouteA() {
  const rollbar = useRollbar()

  const [message, setMessage] = useState('example')

  const fullMessage = useMemo(() => `Hello, ${message}!`, [message])

  return (
    <RollbarContext context="/a-context">
      <h1>A</h1>
      <p>Message: {fullMessage}</p>
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <br />
      <button onClick={() => rollbar.info(`Hello, ${message}.`)}>
        send message
      </button>
    </RollbarContext>
  )
}

function RouteB() {
  const [errorState, setErrorState] = useState({ error: false })

  const updateErrorState = () => {
    // Use an error state and throw inside render,
    // because React won't send errors within event handlers
    // to the error boundary component.
    setErrorState({
      error: true,
    })
  }

  if (errorState.error) {
    // This uncaught error will be handled by the ErrorBoundary.
    throw new Error('uncaught test error')
  }

  return (
    <RollbarContext context="/b-context">
      <h1>B</h1>
      <button id="uncaught-error" onClick={updateErrorState}>
        Throw Uncaught Error
      </button>
    </RollbarContext>
  )
}
