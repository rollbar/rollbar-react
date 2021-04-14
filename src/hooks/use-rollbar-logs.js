// EXPERIMENTAL
// NOT EXPORTED AS PART OF PUBLIC API YET
// NO TEST COVERAGE

import { useEffect, useLayoutEffect } from 'react';
import invariant from 'tiny-invariant';
import VALID_LEVELS, { LEVEL_DEBUG, LEVEL_INFO, LEVEL_WARN, LEVEL_ERROR, LEVEL_CRITICAL } from '../constants';
import { useRollbar } from './use-rollbar';

const LOG = 'log';

function useRollbarNotify(type, isLayout, ...args) {
  invariant(type === LOG || VALID_LEVELS[type] >= LEVEL_DEBUG && VALID_LEVELS[type] <= LEVEL_CRITICAL, `cannot notify rollbar using method '${type}'`);
  const rollbar = useRollbar();
  (isLayout ? useLayoutEffect : useEffect)(() => {
    rollbar[type](...args);
  }, args)
}

export function useRollbarLog(isLayout, ...args) {
  useRollbarNotify(LOG, isLayout, ...args);
}

export function useRollbarDebug(isLayout, ...args) {
  useRollbarNotify(LEVEL_DEBUG, isLayout, ...args);
}

export function useRollbarInfo(isLayout, ...args) {
  useRollbarNotify(LEVEL_INFO, isLayout, ...args);
}

export function useRollbarWarn(isLayout, ...args) {
  useRollbarNotify(LEVEL_WARN, isLayout, ...args);
}

export function useRollbarError(isLayout, ...args) {
  useRollbarNotify(LEVEL_ERROR, isLayout, ...args);
}

export function useRollbarCritical(isLayout, ...args) {
  useRollbarNotify(LEVEL_ERROR, isLayout, ...args);
}
