'use client';

// EXPERIMENTAL
// NOT EXPORTED AS PART OF PUBLIC API YET
// NO TEST COVERAGE

import { useContext } from 'react';
import {
  Context,
  getRollbarFromContext,
  getRollbarConstructorFromContext,
} from '../provider';

export function useScopedConfiguration(config) {
  const ctx = useContext(Context);
  const base = getRollbarFromContext(ctx);
  const ctor = getRollbarConstructorFromContext(ctx);
  const rollbar = new ctor(base.options);
  rollbar.configure(config);
  return rollbar;
}
