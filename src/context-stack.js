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
    stack = { base: rollbar.options.payload?.context, contexts: new Map() };
    stacks.set(rollbar, stack);
  }
  return stack;
}

function applyStack(rollbar, stack) {
  if (stack.contexts.size) {
    const innermost = Math.max(...stack.contexts.keys());
    rollbar.configure({ payload: { context: stack.contexts.get(innermost) } });
    return;
  }
  stacks.delete(rollbar);
  // configure() ignores undefined values, so restoring an unset context
  // needs ''. rollbar.js sends '' for an unset context anyway.
  rollbar.configure({ payload: { context: stack.base ?? '' } });
}

// Adds the context for `order`, or applies its new value if it's already
// there.
export function setContext(rollbar, order, context) {
  const stack = getStack(rollbar);
  stack.contexts.set(order, context);
  applyStack(rollbar, stack);
}

export function removeContext(rollbar, order) {
  const stack = stacks.get(rollbar);
  if (stack?.contexts.delete(order)) {
    applyStack(rollbar, stack);
  }
}

// For RollbarContext's onRender: sets `context` while the component renders,
// before it has mounted and been added with setContext. React can throw that
// render away without mounting anything, for example when an ErrorBoundary
// around the component catches an error from its children, and nothing mounts
// on the server. So a microtask applies the context of whatever is mounted
// again. React commits in the same task that it finishes rendering in, and an
// ErrorBoundary reports during the commit, so the microtask runs after both.
// If a transition yields partway through rendering, the microtask runs then,
// but when a child throws, React renders again from the start, synchronously,
// before it commits.
export function setRenderContext(rollbar, context) {
  // Taken before the context changes, so that it's the one restored if
  // nothing is mounted.
  const stack = getStack(rollbar);
  rollbar.configure({ payload: { context } });
  Promise.resolve().then(() => {
    if (stacks.get(rollbar) === stack) {
      applyStack(rollbar, stack);
    }
  });
}
