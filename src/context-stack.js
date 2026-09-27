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
    };
    stacks.set(rollbar, stack);
  }
  return stack;
}

function applyStack(rollbar, stack) {
  const { contexts, rendering } = stack;
  if (contexts.size || rendering.size) {
    const innermost = Math.max(...contexts.keys(), ...rendering.keys());
    // A component that's rendering with a new context has the old one in
    // `contexts` until it updates.
    const context = rendering.has(innermost)
      ? rendering.get(innermost).context
      : contexts.get(innermost);
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
// component has mounted or updated, so that render was committed.
export function setContext(rollbar, order, context) {
  const stack = getStack(rollbar);
  stack.rendering.delete(order);
  stack.contexts.set(order, context);
  applyStack(rollbar, stack);
}

export function removeContext(rollbar, order) {
  const stack = stacks.get(rollbar);
  if (stack?.contexts.delete(order)) {
    applyStack(rollbar, stack);
  }
}

// For RollbarContext's onRender: sets `context` for `order` while the
// component renders, before it has mounted or updated and called setContext.
// It's kept in the stack so that anything else applied before React finishes,
// like another context unmounting or updating in the same commit, doesn't
// replace it before an ErrorBoundary inside reports.
//
// React can throw the render away without committing it, for example when an
// ErrorBoundary around the component catches an error from its children, and
// nothing mounts on the server. So if the component hasn't mounted or updated
// by then, a microtask removes it again, leaving whatever did. React commits
// in the same task that it finishes rendering in, and an ErrorBoundary
// reports during the commit, so the microtask runs after both. If a
// transition yields partway through rendering, the microtask runs then, but
// when a child throws, React renders again from the start, synchronously,
// before it commits.
export function setRenderContext(rollbar, order, context) {
  const stack = getStack(rollbar);
  const entry = { context };
  stack.rendering.set(order, entry);
  applyStack(rollbar, stack);
  Promise.resolve().then(() => {
    // Unless a later render replaced it; its own microtask removes that.
    if (stack.rendering.get(order) === entry) {
      stack.rendering.delete(order);
      applyStack(rollbar, stack);
    }
  });
}
