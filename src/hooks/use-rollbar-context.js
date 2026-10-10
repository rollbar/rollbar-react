'use client';

import invariant from 'tiny-invariant';
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useRollbar } from './use-rollbar';
import {
  clearHookRender,
  nextContextOrder,
  removeContext,
  setContext,
  setHookRender,
} from '../context-stack';
import { ScopeContext } from '../rollbar-context';

// Before React 19, useLayoutEffect warns when rendering on the server, where
// no effects run anyway.
const useClientLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

function useEffectOfType(isLayout, effect, deps) {
  (isLayout ? useClientLayoutEffect : useEffect)(effect, deps);
}

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
  // The RollbarContexts and ErrorBoundaries around this hook; see
  // reportWithContext in context-stack.js.
  const path = useContext(ScopeContext);
  // The context this hook has set, once it has.
  const appliedRef = useRef();
  // For an ErrorBoundary that catches an error thrown while this renders, by
  // this component or one inside it: React removes the component, and the
  // entry below, before the ErrorBoundary reports. It doesn't change the
  // client's context; see setHookRender in context-stack.js.
  setHookRender(rollbar, order, ctx, path);
  useClientLayoutEffect(() => clearHookRender(rollbar, order));
  // Removed in a layout effect cleanup, whatever `isLayout` is. When React
  // removes a component, it runs its layout cleanups during the commit, but
  // its passive ones only after it, so after an ErrorBoundary elsewhere in the
  // tree has reported an error thrown in that commit, like the next page's.
  // The ErrorBoundary gets the context of a hook that rendered with the error
  // from setHookRender above.
  useClientLayoutEffect(() => {
    // React 18 and later also run layout cleanups when Suspense hides a tree
    // that was showing, and run only layout effects again when it shows it.
    if (appliedRef.current !== undefined) {
      setContext(rollbar, order, appliedRef.current, path);
    }
    return () => removeContext(rollbar, order);
  }, []);
  useEffectOfType(
    isLayout,
    () => {
      appliedRef.current = ctx;
      setContext(rollbar, order, ctx, path);
    },
    [ctx],
  );
}
