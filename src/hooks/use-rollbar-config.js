'use client';

import { useRollbar } from './use-rollbar';

export function useRollbarConfiguration(config) {
  const rollbar = useRollbar();
  rollbar.configure(config);
}
