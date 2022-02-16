import invariant from 'tiny-invariant';
import { useEffect, useLayoutEffect } from 'react';
import { useRollbar } from './use-rollbar';
import { useRollbarConfiguration } from './use-rollbar-config';

// Simple version does its job
// export function useRollbarContext(context) {
//   useRollbarConfiguration({ payload: { context }});
// }

// Complex version will set the context when part of the tree and reset back to original context when removed
export function useRollbarContext(ctx = '', isLayout = false) {
  invariant(typeof ctx === 'string', '`ctx` must be a string');
  const rollbar = useRollbar();
  (isLayout ? useLayoutEffect : useEffect)(() => {
    const origCtx = rollbar.options.payload.context;
    rollbar.configure({ payload: { context: ctx }});
    return () => {
      rollbar.configure({ payload: { context: origCtx }});
    };
  }, [ctx]);
}
