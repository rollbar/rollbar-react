import '@testing-library/jest-dom';
import 'regenerator-runtime';
import { format } from 'util';

// Let propType errors cause test failure. React passes the message as a
// format string ('Failed %s type: %s%s', 'prop', ...), so format it first.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = format(...args);
  if (/(Failed prop type)/.test(message)) throw new Error(message);
  originalConsoleError(...args);
};
