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
  let innermost = null;
  for (const entry of stack.entries) {
    if (!innermost || entry.order > innermost.order) {
      innermost = entry;
    }
  }
  rollbar.configure({ payload: { context: innermost.context } });
}

// `entry` is `{ order, context }`, owned by the caller. Adds it, or applies
// its new `context` if it's already there.
export function setContext(rollbar, entry) {
  let stack = stacks.get(rollbar);
  if (!stack) {
    // rollbar.js has no default payload, so options.payload is undefined
    // unless the config sets it.
    stack = { base: rollbar.options.payload?.context, entries: new Set() };
    stacks.set(rollbar, stack);
  }
  stack.entries.add(entry);
  applyInnermost(rollbar, stack);
}

export function removeContext(rollbar, entry) {
  const stack = stacks.get(rollbar);
  if (!stack || !stack.entries.delete(entry)) {
    return;
  }
  if (stack.entries.size) {
    applyInnermost(rollbar, stack);
    return;
  }
  stacks.delete(rollbar);
  // configure() ignores undefined values, so restoring an unset context
  // needs ''. rollbar.js sends '' for an unset context anyway.
  rollbar.configure({ payload: { context: stack.base ?? '' } });
}
