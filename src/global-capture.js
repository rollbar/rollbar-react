// window.onerror and unhandledrejection are shared by the whole page, but
// every Rollbar instance that captures them adds its own handler, and
// rollbar.js only filters duplicates within one instance. With several
// Providers each building an instance from `config`, one error was reported
// once per Provider.
//
// So each instance a Provider creates decides, when its handler runs, whether
// it is the one to report. Of the instances reporting to the same access token
// that capture that kind of error, that is the one whose Provider was created
// first among those mounted. While none is mounted, it is the one created
// last among those that have mounted before, or failing that among those that
// haven't mounted yet (or never will, like StrictMode's extra construction).
// The decision is made from the instances' current options every time, so
// options changed with `configure` are respected and nothing about it depends
// on the order Providers mounted or unmounted in. The app's options are left
// alone. Instances passed in with the `instance` prop aren't managed.

const KINDS = {
  uncaught: {
    handler: 'handleUncaughtException',
    options: ['captureUncaught', 'handleUncaughtExceptions'],
  },
  rejections: {
    handler: 'handleUnhandledRejection',
    options: ['captureUnhandledRejections', 'handleUnhandledRejections'],
  },
};

// Claims that are mounted or whose instance captures something. Window
// already keeps the latter instances alive through their handlers.
let claims = [];
// Managed instance → { handlers: its own handlers, latest: its newest claim }.
const managed = new WeakMap();
let created = 0;

function captures(claim, kind) {
  const options = claim.rollbar.options || {};
  return (
    options.enabled !== false && KINDS[kind].options.some((key) => options[key])
  );
}

function capturesAny(claim) {
  return Object.keys(KINDS).some((kind) => captures(claim, kind));
}

function project(claim) {
  return claim.rollbar.options?.accessToken;
}

function register(claim) {
  if (!claims.includes(claim)) {
    claims.push(claim);
  }
}

// The claim whose instance reports `kind` for the project `self` reports to.
function reporter(self, kind) {
  const candidates = claims
    .concat(self)
    .filter(
      (claim) => captures(claim, kind) && project(claim) === project(self),
    );
  const mounted = candidates.filter((claim) => claim.mounted);
  if (mounted.length) {
    return mounted.reduce((a, b) => (b.seq < a.seq ? b : a));
  }
  const unmounted = candidates.filter((claim) => claim.hasMounted);
  return (unmounted.length ? unmounted : candidates).reduce(
    (a, b) => (!a || b.seq > a.seq ? b : a),
    null,
  );
}

// In Chrome, rollbar.js can't see an anonymous (cross-origin) error in
// onerror. Every instance counts it there, and whichever instance set
// Error.prepareStackTrace last reports it from there with `_isAnonymous` set.
// Mirrors the check in rollbar.js's handleUncaughtException.
function isAnonymousProbe(rollbar, url, error) {
  return (
    rollbar.options?.inspectAnonymousErrors &&
    rollbar.isChrome &&
    error === null &&
    url === ''
  );
}

function gate(rollbar, record, kind) {
  const original = rollbar[KINDS[kind].handler];
  record.handlers[kind] = original;
  rollbar[KINDS[kind].handler] = function (...args) {
    if (kind === 'uncaught') {
      const [, url, , , error] = args;
      if (isAnonymousProbe(rollbar, url, error)) {
        return original.apply(rollbar, args);
      }
      if (error?._isAnonymous) {
        // Only this instance received it, so hand it to the reporter.
        const chosen = reporter(record.latest, kind);
        const target = chosen ? chosen.rollbar : rollbar;
        return managed.get(target).handlers[kind].apply(target, args);
      }
    }
    const chosen = reporter(record.latest, kind);
    if (chosen && chosen.rollbar !== rollbar) {
      return undefined;
    }
    return original.apply(rollbar, args);
  };
}

// Call once a Provider has created `rollbar` from its config. Returns a claim
// to pass to the other functions.
export function manageGlobalCapture(rollbar) {
  if (typeof window === 'undefined' || !rollbar) {
    return null;
  }
  let record = managed.get(rollbar);
  if (!record) {
    record = { handlers: {}, latest: null };
    Object.keys(KINDS).forEach((kind) => {
      if (typeof rollbar[KINDS[kind].handler] === 'function') {
        gate(rollbar, record, kind);
      }
    });
    managed.set(rollbar, record);
  }
  const claim = { rollbar, seq: created++, mounted: false, hasMounted: false };
  record.latest = claim;
  if (capturesAny(claim)) {
    register(claim);
  }
  return claim;
}

export function mountGlobalCapture(claim) {
  if (!claim) {
    return;
  }
  claim.mounted = true;
  claim.hasMounted = true;
  register(claim);
}

export function unmountGlobalCapture(claim) {
  if (!claim) {
    return;
  }
  claim.mounted = false;
  // Other unmounted claims for the same instance (a shared one, say) would
  // decide nothing this one doesn't.
  claims = claims.filter(
    (other) =>
      other === claim || other.mounted || other.rollbar !== claim.rollbar,
  );
  if (!capturesAny(claim)) {
    claims = claims.filter((other) => other !== claim);
  }
}
