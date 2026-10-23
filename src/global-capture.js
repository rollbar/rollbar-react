// window.onerror and unhandledrejection are shared by the whole page, but
// every Rollbar instance that captures them adds its own handler. With several
// Providers each building an instance from `config`, one error was reported
// once per Provider. So among the instances Providers create, only one owns
// each kind of capture at a time; the others have it turned off until the
// owner unmounts or opts out. Instances passed in with the `instance` prop
// aren't managed.
//
// The app can change the capture options at any time through `configure`
// (directly or with useRollbarConfiguration), so each managed instance's
// `configure` is wrapped: capture options passed to it are recorded as what
// that Provider wants, and applied only while it owns that kind of capture.

const CAPTURE_OPTIONS = {
  uncaught: ['captureUncaught', 'handleUncaughtExceptions'],
  rejections: ['captureUnhandledRejections', 'handleUnhandledRejections'],
};

const KINDS = Object.keys(CAPTURE_OPTIONS);

const owners = { uncaught: null, rejections: null };
// Mounted claims, in the order they mounted.
const mounted = [];

function captureOff(kind) {
  const off = {};
  CAPTURE_OPTIONS[kind].forEach((key) => {
    off[key] = false;
  });
  return off;
}

// Records the capture options in `options` as what `claim` wants. Returns the
// kinds they belong to.
function request(claim, options) {
  return KINDS.filter((kind) => {
    const keys = CAPTURE_OPTIONS[kind].filter((key) => key in options);
    keys.forEach((key) => {
      claim.requested[kind][key] = options[key];
    });
    return keys.length > 0;
  });
}

function wants(claim, kind) {
  return CAPTURE_OPTIONS[kind].some((key) => claim.requested[kind][key]);
}

// These bypass the wrapper, so they don't count as the app's requests.
function enable(claim, kind) {
  claim.configure?.(claim.requested[kind]);
}

function disable(claim, kind) {
  claim.configure?.(captureOff(kind));
}

function takeOver(claim, kind) {
  const previous = owners[kind];
  if (previous && previous !== claim) {
    disable(previous, kind);
  }
  owners[kind] = claim;
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

// The outermost of `claim` and its enclosing Providers' claims that wants
// `kind` and passes `eligible`.
function outermost(claim, kind, eligible = () => true) {
  let found = claim;
  for (let parent = claim.parent; parent; parent = parent.parent) {
    if (wants(parent, kind) && eligible(parent)) {
      found = parent;
    }
  }
  return found;
}

// Gives `kind` from its owner `claim` to the first other mounted Provider that
// wants it and that `skip` doesn't exclude, or to the outermost such Provider
// around it, so nested Providers keep capture with the outer one. Returns
// false if there is none.
function handOff(claim, kind, skip = () => false) {
  const eligible = (other) =>
    other !== claim &&
    mounted.includes(other) &&
    wants(other, kind) &&
    !skip(other);
  const next = mounted.find(eligible);
  if (!next) {
    return false;
  }
  takeOver(outermost(next, kind, eligible), kind);
  return true;
}

// After the app changed what `claim` wants for `kind`.
function reconcile(claim, kind) {
  const owner = owners[kind];
  if (owner === claim) {
    if (wants(claim, kind)) {
      enable(claim, kind);
    } else if (!handOff(claim, kind)) {
      disable(claim, kind);
      owners[kind] = null;
    }
    return;
  }
  // Otherwise it stays off unless nobody else captures this kind.
  if (
    wants(claim, kind) &&
    claim.state !== 'unmounted' &&
    (!owner || owner.state === 'unmounted')
  ) {
    takeOver(claim, kind);
  }
}

// Call before constructing the instance, with the claim of the nearest
// enclosing Provider, if any. Returns the options to construct it with (global
// capture turned off where another instance already owns it) and a claim to
// pass to the other functions.
export function claimGlobalCapture(options, parent = null) {
  if (typeof window === 'undefined' || !options) {
    return { options, claim: null };
  }

  const claim = {
    configure: null,
    state: 'pending',
    requested: { uncaught: {}, rejections: {} },
    replaced: {},
    parent,
  };
  let ctorOptions = options;

  request(claim, options).forEach((kind) => {
    if (!wants(claim, kind)) {
      return;
    }
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

  return { options: ctorOptions, claim };
}

// Call once the instance is constructed.
export function manageGlobalCapture(claim, rollbar) {
  if (!claim) {
    return;
  }
  const configure = rollbar?.configure;
  if (typeof configure !== 'function') {
    return;
  }
  claim.configure = (options) => configure.call(rollbar, options);

  rollbar.configure = (options, ...rest) => {
    if (!options) {
      return configure.call(rollbar, options, ...rest);
    }
    const kinds = request(claim, options);
    const others = { ...options };
    kinds.forEach((kind) => {
      CAPTURE_OPTIONS[kind].forEach((key) => {
        delete others[key];
      });
    });
    const result = configure.call(rollbar, others, ...rest);
    kinds.forEach((kind) => reconcile(claim, kind));
    return result;
  };
}

export function mountGlobalCapture(claim) {
  if (!claim) {
    return;
  }
  claim.state = 'mounted';
  if (!mounted.includes(claim)) {
    mounted.push(claim);
  }

  KINDS.forEach((kind) => {
    const owner = owners[kind];
    if (owner === claim || !wants(claim, kind)) {
      return;
    }
    // Mounting runs children before parents and earlier siblings before later
    // ones, so of the Providers rendered in this commit only an ancestor mounts
    // after this one, and it keeps capture. Any other owner still pending was
    // rendered in a pass React threw away (or hasn't committed), so it is
    // replaced like an unmounted one: by the outermost enclosing Provider
    // that wants this kind, which is mounting in this same commit.
    if (
      !owner ||
      owner.state === 'unmounted' ||
      (owner.state === 'pending' && !isAncestor(owner, claim))
    ) {
      takeOver(outermost(claim, kind), kind);
    }
  });
}

export function unmountGlobalCapture(claim) {
  if (!claim) {
    return;
  }
  claim.state = 'unmounted';
  const index = mounted.indexOf(claim);
  if (index !== -1) {
    mounted.splice(index, 1);
  }

  KINDS.forEach((kind) => {
    if (owners[kind] !== claim) {
      return;
    }
    // Providers nested inside this one unmount with it (or, under StrictMode
    // and Suspense, disappear and reappear with it), so they are skipped.
    handOff(claim, kind, (other) => isAncestor(claim, other));
    // With nobody to hand to, the owner keeps capturing, as an unmounted
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
