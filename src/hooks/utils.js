import { useRef } from 'react';

// EXPERIMENTAL (NOT IN USE): wrap the instance of rollbar to prevent modification
export function useWrappedRollbar(rollbar) {
  const rb = useRef(rollbar);
  return {
    log: (...args) => rb.current.log(...args),
    debug: (...args) => rb.current.debug(...args),
    info: (...args) => rb.current.info(...args),
    warn: (...args) => rb.current.warn(...args),
    error: (...args) => rb.current.error(...args),
    critical: (...args) => rb.current.critical(...args),
    captureEvent: (...args) => rb.current.captureEvent(...args),
  }
}
