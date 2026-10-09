// The RollbarContext components and useRollbarContext hooks that are mounted
// and setting a context, per Rollbar client. The innermost one decides the
// client's context. When the last one goes away, the context from before the
// first one is restored.
const stacks = new WeakMap();

let lastOrder = 0;

// Parents render before their children, so an order number taken during the
// first render ranks nested contexts from outermost to innermost, even though
// React mounts (and runs effects for) children first. A context that mounts
// later under an existing one also ranks after it.
export function nextContextOrder() {
  lastOrder += 1;
  return lastOrder;
}

function getStack(rollbar) {
  let stack = stacks.get(rollbar);
  if (!stack) {
    // rollbar.js has no default payload, so options.payload is undefined
    // unless the config sets it.
    stack = {
      base: rollbar.options.payload?.context,
      contexts: new Map(),
      // From setRenderContext: set during render, until React has committed.
      rendering: new Map(),
      // The scope path (see ScopeContext in rollbar-context.js) of the
      // component each order belongs to, for reportWithContext.
      paths: new Map(),
    };
    stacks.set(rollbar, stack);
  }
  return stack;
}

function innermostOrder({ contexts, rendering }) {
  return Math.max(...contexts.keys(), ...rendering.keys());
}

// A component that's rendering with a new context has the old one in
// `contexts` until it updates.
function contextAt({ contexts, rendering }, order) {
  return rendering.has(order)
    ? rendering.get(order).context
    : contexts.get(order);
}

function forgetPath(stack, order) {
  if (!stack.contexts.has(order) && !stack.rendering.has(order)) {
    stack.paths.delete(order);
  }
}

function applyStack(rollbar, stack) {
  const { contexts, rendering } = stack;
  if (contexts.size || rendering.size) {
    const context = contextAt(stack, innermostOrder(stack));
    rollbar.configure({ payload: { context } });
    return;
  }
  stacks.delete(rollbar);
  // configure() ignores undefined values and there's no way to remove the key,
  // so restoring an unset context needs ''. In the browser that's sent the same
  // as an unset context. On the server it isn't: rollbar.js takes the context
  // from the request's route, and payload.context, even '', replaces it. Only
  // onRender restores on the server, since nothing mounts there; the README
  // covers this.
  rollbar.configure({ payload: { context: stack.base ?? '' } });
}

// Adds the context for `order`, or applies its new value if it's already
// there. It replaces any context setRenderContext set for `order`: the
// component has mounted or updated, so that render was committed. `path` is
// the component's scope path.
export function setContext(rollbar, order, context, path) {
  const stack = getStack(rollbar);
  stack.rendering.delete(order);
  stack.contexts.set(order, context);
  stack.paths.set(order, path);
  applyStack(rollbar, stack);
}

export function removeContext(rollbar, order) {
  const stack = stacks.get(rollbar);
  if (stack?.contexts.delete(order)) {
    forgetPath(stack, order);
    applyStack(rollbar, stack);
  }
}

// For RollbarContext's onRender: sets `context` for `order` while the
// component renders, before it has mounted or updated and called setContext.
// It's kept in the stack so that anything else applied before React finishes,
// like another context unmounting or updating in the same commit, doesn't
// replace it before the children have mounted.
//
// React can throw the render away without committing it, for example when an
// ErrorBoundary around the component catches an error from its children, and
// nothing mounts on the server. So if the component hasn't mounted or updated
// by then, a microtask removes it again, leaving whatever did. When React
// commits in the same task that it finished rendering in, that's after the
// commit. React doesn't always: a transition can yield partway through
// rendering, and React 19 can hold a commit back until a stylesheet in it has
// loaded. Then the microtask runs first, and the children mount with the
// previous context, as without onRender. ErrorBoundary doesn't rely on this;
// see reportWithContext.
export function setRenderContext(rollbar, order, context, path) {
  const stack = getStack(rollbar);
  const entry = { context };
  stack.rendering.set(order, entry);
  stack.paths.set(order, path);
  applyStack(rollbar, stack);
  Promise.resolve().then(() => {
    // Unless a later render replaced it; its own microtask removes that.
    if (stack.rendering.get(order) === entry) {
      stack.rendering.delete(order);
      forgetPath(stack, order);
      applyStack(rollbar, stack);
    }
  });
}

// For ErrorBoundary: calls `report` with the context of the nearest
// RollbarContext around the ErrorBoundary, `reportContext`, which React
// resolved while rendering it. That RollbarContext sets its context when it
// mounts or updates, which React does after the ErrorBoundary inside has
// reported, so on its first render or a change to its `context` prop the
// client still has the previous context. Under onRender, React may also have
// committed after the microtask in setRenderContext.
//
// An entry inside that RollbarContext takes precedence, the innermost one, if
// it's one of:
// - inside the ErrorBoundary. React has removed what was mounted there before
//   the ErrorBoundary reports, so that's an onRender context whose render
//   React threw away, around the child that threw.
// - a useRollbarContext that rendered before the ErrorBoundary, and whose
//   scopes are all around it: one between them. A hook doesn't provide a
//   scope, so one in an earlier sibling of the ErrorBoundary counts too, as it
//   does for the client's context, unless it's inside a sibling ErrorBoundary
//   or RollbarContext.
// Other entries can rank after the RollbarContext without being around the
// ErrorBoundary, like a sibling RollbarContext or hook created later, so the
// scope paths decide. A RollbarContext between them would be the nearest one.
//
// rollbar.js has no per-item context, so the context is applied around the
// report: rollbar.js takes the options an item is sent with when it's logged,
// and configure() replaces them rather than changing them.
export function reportWithContext(
  rollbar,
  reportContext,
  boundaryPath,
  report,
) {
  // Without a RollbarContext, the client isn't touched, as before.
  if (!reportContext) {
    report();
    return;
  }
  const scope = reportContext.order;
  const boundary = boundaryPath[boundaryPath.length - 1];
  let { context } = reportContext;
  let innermost = scope;
  const stack = stacks.get(rollbar);
  stack?.paths.forEach((path, order) => {
    if (order <= innermost || !path.includes(scope)) {
      return;
    }
    // A RollbarContext's path ends with its own order, a hook's doesn't.
    const isHook = path[path.length - 1] !== order;
    // Every scope around the hook is around the ErrorBoundary too.
    const aroundBoundary = path.every((o, i) => o === boundaryPath[i]);
    if (
      path.includes(boundary) ||
      (isHook && aroundBoundary && order < boundary)
    ) {
      innermost = order;
      context = contextAt(stack, order);
    }
  });
  const previous = rollbar.options.payload?.context;
  if (context === previous) {
    report();
    return;
  }
  rollbar.configure({ payload: { context } });
  try {
    report();
  } finally {
    // As in applyStack, configure() ignores undefined.
    rollbar.configure({ payload: { context: previous ?? '' } });
  }
}
