import React from 'react'
import { Provider, ErrorBoundary } from '@rollbar/react'
import './App.css'

const rollbarConfig = {
  accessToken: '9343c1d69e8a4e9a9e5b7a761df7ccfe',
  environment: 'testenv',
}

function FallbackComponent() {
  return <div>An error has occured</div>
}

function TestError() {
  const a = null
  return a.hello()
}

function App() {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary fallbackUI={FallbackComponent}>
        <TestError />
      </ErrorBoundary>
    </Provider>
  )
}

export default App
