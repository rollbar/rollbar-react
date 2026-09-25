'use client';

import invariant from 'tiny-invariant';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useRollbar } from './use-rollbar';
import { nextContextOrder, removeContext, setContext } from '../context-stack';

// Simple version does its job
// export function useRollbarContext(context) {
//   useRollbarConfiguration({ payload: { context }});
// }

// Complex version will set the context when part of the tree and reset back to original context when removed
export function useRollbarContext(ctx = '', isLayout = false) {
  invariant(typeof ctx === 'string', '`ctx` must be a string');
  const rollbar = useRollbar();
  // Where this component sits among nested contexts; see context-stack.js.
  const [entry] = useState(() => ({ order: nextContextOrder(), context: ctx }));
  const useEffectOfType = isLayout ? useLayoutEffect : useEffect;
  useEffectOfType(() => {
    entry.context = ctx;
    setContext(rollbar, entry);
  }, [ctx]);
  useEffectOfType(() => () => removeContext(rollbar, entry), []);
}
