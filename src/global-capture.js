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
  enable(claim, kind);
}

// Call before constructing the instance. Returns the options to construct it
// with (global capture turned off where another instance already owns it) and
// a claim to pass to the other functions once the instance exists.
export function claimGlobalCapture(options) {
  if (typeof window === 'undefined' || !options) {
    return { options, claim: null };
  }

  const claim = { rollbar: null, state: 'pending', captures: {} };
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
    } else if (owner.state === 'unmounted') {
      // Its handler is still installed, so it has to be switched off.
      disable(owner, kind);
      owners[kind] = claim;
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
    // A pending owner may be an ancestor Provider that mounts later in this
    // same commit, so only an owner that has already unmounted is replaced.
    if (!owner || owner.state === 'unmounted') {
      takeOver(claim, kind);
    } else if (!waiting[kind].includes(claim)) {
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
    const next = waiting[kind].shift();
    if (next) {
      takeOver(next, kind);
    }
    // With nobody waiting, the owner keeps capturing, as an unmounted
    // Provider's instance always has. The next Provider to claim takes over.
  });
}
