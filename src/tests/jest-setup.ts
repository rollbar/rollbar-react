import '@testing-library/jest-dom'
import 'regenerator-runtime'

// Let propType errors cause test failure.
const originalConsoleError = console.error
console.error = (message: string) => {
  if (/(Failed prop type)/.test(message)) throw new Error(message)
  originalConsoleError(message)
}
