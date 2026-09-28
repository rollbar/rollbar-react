// window.onerror and unhandledrejection are shared by the whole page, but
// every Rollbar instance that captures them adds its own handler. With several
// Providers each building an instance from `config`, one error was reported
// once per Provider. So among the instances Providers create, only one owns
// each kind of capture at a time; the others have it turned off until the
// owner unmounts. Instances passed in with the `instance` prop aren't managed.

const CAPTURE_OPTIONS = {
  uncaught: ['captureUncaught', 'handleUncaughtExceptions'],
  rejections: ['captureUnhandledRejections', 'handleUnhandledRejections'],
};

const KINDS = Object.keys(CAPTURE_OPTIONS);

const owners = { uncaught: null, rejections: null };
const waiting = { uncaught: [], rejections: [] };

function captureOff(kind) {
  const off = {};
  CAPTURE_OPTIONS[kind].forEach((key) => {
    off[key] = false;
  });
  return off;
}

function enable(claim, kind) {
  claim.rollbar?.configure?.(claim.captures[kind]);
}

function disable(claim, kind) {
  claim.rollbar?.configure?.(captureOff(kind));
}

function takeOver(claim, kind) {
  const previous = owners[kind];
  if (previous) {
    disable(previous, kind);
  }
  owners[kind] = claim;
  waiting[kind] = waiting[kind].filter((other) => other !== claim);
  enable(claim, kind);
}

function isAncestor(other, claim) {
  for (let parent = claim.parent; parent; parent = parent.parent) {
    if (parent === other) {
      return true;
    }
  }
  return false;
}

// The outermost of `claim` and its enclosing Providers' claims that captures
// `kind` and passes `eligible`.
function outermost(claim, kind, eligible = () => true) {
  let found = claim;
  for (let parent = claim.parent; parent; parent = parent.parent) {
    if (parent.captures[kind] && eligible(parent)) {
      found = parent;
    }
  }
  return found;
}

// Call before constructing the instance, with the claim of the nearest
// enclosing Provider, if any. Returns the options to construct it with (global
// capture turned off where another instance already owns it) and a claim to
// pass to the other functions once the instance exists.
export function claimGlobalCapture(options, parent = null) {
  if (typeof window === 'undefined' || !options) {
    return { options, claim: null };
  }

  const claim = {
    rollbar: null,
    state: 'pending',
    captures: {},
    replaced: {},
    parent,
  };
  let ctorOptions = options;

  KINDS.forEach((kind) => {
    const keys = CAPTURE_OPTIONS[kind];
    if (!keys.some((key) => options[key])) {
      return;
    }
    const captures = {};
    keys.forEach((key) => {
      if (key in options) {
        captures[key] = options[key];
      }
    });
    claim.captures[kind] = captures;

    const owner = owners[kind];
    if (!owner) {
      owners[kind] = claim;
      claim.replaced[kind] = null;
    } else if (owner.state === 'unmounted') {
      // Its handler is still installed, so it has to be switched off.
      disable(owner, kind);
      owners[kind] = claim;
      claim.replaced[kind] = owner;
    } else {
      ctorOptions = { ...ctorOptions, ...captureOff(kind) };
    }
  });

  if (!Object.keys(claim.captures).length) {
    return { options, claim: null };
  }
  return { options: ctorOptions, claim };
}

export function mountGlobalCapture(claim) {
  if (!claim) {
    return;
  }
  claim.state = 'mounted';

  Object.keys(claim.captures).forEach((kind) => {
    const owner = owners[kind];
    if (owner === claim) {
      return;
    }
    // Mounting runs children before parents and earlier siblings before later
    // ones, so of the Providers rendered in this commit only an ancestor mounts
    // after this one, and it keeps capture. Any other owner still pending was
    // rendered in a pass React threw away (or hasn't committed), so it is
    // replaced like an unmounted one: by the outermost enclosing Provider
    // that captures this kind, which is mounting in this same commit.
    if (
      !owner ||
      owner.state === 'unmounted' ||
      (owner.state === 'pending' && !isAncestor(owner, claim))
    ) {
      const next = outermost(claim, kind);
      takeOver(next, kind);
      if (next === claim) {
        return;
      }
    }
    if (!waiting[kind].includes(claim)) {
      waiting[kind].push(claim);
    }
  });
}

export function unmountGlobalCapture(claim) {
  if (!claim) {
    return;
  }
  claim.state = 'unmounted';

  Object.keys(claim.captures).forEach((kind) => {
    waiting[kind] = waiting[kind].filter((other) => other !== claim);
    if (owners[kind] !== claim) {
      return;
    }
    // Providers nested inside this one unmount with it (or, under StrictMode
    // and Suspense, disappear and reappear with it), so they are skipped. Of
    // the rest, the first to mount goes to its outermost enclosing Provider
    // that is also waiting, so nested Providers keep capture with the outer one.
    const next = waiting[kind].find((other) => !isAncestor(claim, other));
    if (next) {
      takeOver(
        outermost(next, kind, (parent) => waiting[kind].includes(parent)),
        kind,
      );
    }
    // With nobody waiting, the owner keeps capturing, as an unmounted
    // Provider's instance always has. The next Provider to claim or mount
    // takes over.
  });
}

// Call instead of the others when constructing the instance fails, to give
// capture back to whichever owner the claim replaced.
export function abandonGlobalCapture(claim) {
  if (!claim) {
    return;
  }
  claim.state = 'unmounted';

  Object.keys(claim.replaced).forEach((kind) => {
    if (owners[kind] !== claim) {
      return;
    }
    const previous = claim.replaced[kind];
    owners[kind] = previous;
    if (previous) {
      enable(previous, kind);
    }
  });
}
