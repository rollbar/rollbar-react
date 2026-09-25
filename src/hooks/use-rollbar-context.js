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
  const [order] = useState(nextContextOrder);
  const useEffectOfType = isLayout ? useLayoutEffect : useEffect;
  useEffectOfType(() => {
    setContext(rollbar, order, ctx);
  }, [ctx]);
  useEffectOfType(() => () => removeContext(rollbar, order), []);
}
