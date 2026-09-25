// The RollbarContext components and useRollbarContext hooks that are
// currently setting a context, per Rollbar client. The innermost one decides
// the client's context. When the last one goes away, the context from before
// the first one is restored.
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

function applyInnermost(rollbar, stack) {
  const innermost = Math.max(...stack.contexts.keys());
  rollbar.configure({ payload: { context: stack.contexts.get(innermost) } });
}

// Adds the context for `order`, or applies its new value if it's already
// there.
export function setContext(rollbar, order, context) {
  let stack = stacks.get(rollbar);
  if (!stack) {
    // rollbar.js has no default payload, so options.payload is undefined
    // unless the config sets it.
    stack = { base: rollbar.options.payload?.context, contexts: new Map() };
    stacks.set(rollbar, stack);
  }
  stack.contexts.set(order, context);
  applyInnermost(rollbar, stack);
}

export function removeContext(rollbar, order) {
  const stack = stacks.get(rollbar);
  if (!stack || !stack.contexts.delete(order)) {
    return;
  }
  if (stack.contexts.size) {
    applyInnermost(rollbar, stack);
    return;
  }
  stacks.delete(rollbar);
  // configure() ignores undefined values, so restoring an unset context
  // needs ''. rollbar.js sends '' for an unset context anyway.
  rollbar.configure({ payload: { context: stack.base ?? '' } });
}
