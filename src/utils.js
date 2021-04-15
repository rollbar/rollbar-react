import * as constants from './constants';

const VALID_LEVELS = constants.default;

export function value(val, defaultTo, ...args) {
  if (typeof val === 'function') {
    return val(...args);
  }
  return val;
}

export function wrapValue(val, defaultAs) {
  return (defaultTo, ...args) => value(val, defaultAs === undefined ? defaultTo : defaultAs, ...args);
}

export function isValidLevel(level) {
  return VALID_LEVELS[level] >= constants.LEVEL_DEBUG && VALID_LEVELS[level] <= constants.LEVEL_CRITICAL;
}
