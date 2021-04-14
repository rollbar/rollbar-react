export function value(val, defaultTo, ...args) {
  if (typeof val === 'function') {
    return val(...args);
  }
  return val;
}

export function wrapValue(val, defaultAs) {
  return (defaultTo, ...args) => value(val, defaultAs === undefined ? defaultTo : defaultAs, ...args);
}
