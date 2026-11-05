// Drives the capture coordination directly, in the order React calls
// componentDidMount and componentWillUnmount, for cases the React 17 used by
// the component tests can't produce: StrictMode in React 18 and 19 unmounts
// and remounts every component once after it first mounts.

function load() {
  let module;
  jest.isolateModules(() => {
    module = require('../global-capture');
  });
  return module;
}

// A stand-in for an instance a Provider creates from `options`, recording
// which global errors it reported.
function instance(options) {
  const rollbar = {
    options: { accessToken: 'A', captureUncaught: true, ...options },
    reports: [],
    configure(changes) {
      this.options = { ...this.options, ...changes };
    },
    handleUncaughtException(message) {
      if (this.options.captureUncaught) this.reports.push(message);
    },
  };
  return rollbar;
}

function provider(capture, options, rollbar = instance(options)) {
  const claim = capture.manageGlobalCapture(rollbar);
  return {
    rollbar,
    mount: () => capture.mountGlobalCapture(claim),
    unmount: () => capture.unmountGlobalCapture(claim),
  };
}

// Calls every instance's handler, as the chained window.onerror does.
function throwUncaught(...providers) {
  [...new Set(providers.map((p) => p.rollbar))]
    .reverse()
    .forEach((rollbar) =>
      rollbar.handleUncaughtException('boom', 'app.js', 1, 1, new Error()),
    );
}

const reported = (...providers) =>
  providers.map((p) => p.rollbar.reports.length);

describe('global capture coordination', () => {
  it('keeps capture with the outer Provider under React 19 StrictMode', () => {
    const capture = load();
    const outer = provider(capture);
    const inner = provider(capture);

    inner.mount();
    outer.mount();
    // Unmounts parents first, then remounts children first.
    outer.unmount();
    inner.unmount();
    inner.mount();
    outer.mount();
    throwUncaught(outer, inner);

    expect(reported(outer, inner)).toEqual([1, 0]);
  });

  it('keeps capture with the outer Provider under React 18 StrictMode', () => {
    const capture = load();
    const outer = provider(capture);
    const inner = provider(capture);

    inner.mount();
    outer.mount();
    // Unmounts and remounts children first.
    inner.unmount();
    outer.unmount();
    inner.mount();
    outer.mount();
    throwUncaught(outer, inner);

    expect(reported(outer, inner)).toEqual([1, 0]);
  });

  it('gives capture to an outer Provider that opts in, with or without StrictMode', () => {
    const capture = load();
    const outer = provider(capture, { captureUncaught: false });
    const inner = provider(capture);

    // A child of the outer Provider opts in while it renders.
    outer.rollbar.configure({ captureUncaught: true });
    inner.mount();
    outer.mount();
    throwUncaught(outer, inner);

    expect(reported(outer, inner)).toEqual([1, 0]);

    // React 18 StrictMode, then React 19 StrictMode.
    inner.unmount();
    outer.unmount();
    inner.mount();
    outer.mount();
    outer.unmount();
    inner.unmount();
    inner.mount();
    outer.mount();
    throwUncaught(outer, inner);

    expect(reported(outer, inner)).toEqual([2, 0]);
  });

  it('keeps an opt-out made before StrictMode remounts', () => {
    const capture = load();
    const first = provider(capture);
    const second = provider(capture);

    // A child of the second Provider opts out while it renders.
    second.rollbar.configure({ captureUncaught: false });
    first.mount();
    second.mount();
    first.unmount();
    second.unmount();
    first.mount();
    second.mount();
    first.unmount();
    throwUncaught(first, second);

    // Nobody mounted wants capture, so the unmounted first one keeps it.
    expect(reported(first, second)).toEqual([1, 0]);
  });

  it("prefers an unmounted Provider to StrictMode's extra construction", () => {
    const capture = load();
    const first = provider(capture);
    // StrictMode constructs the second Provider twice; one never mounts.
    const discarded = provider(capture);
    const second = provider(capture);

    second.rollbar.configure({ captureUncaught: false });
    first.mount();
    second.mount();
    first.unmount();
    throwUncaught(first, discarded, second);

    expect(reported(first, discarded, second)).toEqual([1, 0, 0]);
  });

  it('reports once with an instance shared by several Providers', () => {
    const capture = load();
    const shared = instance();
    const first = provider(capture, undefined, shared);
    const second = provider(capture, undefined, shared);

    first.mount();
    second.mount();
    throwUncaught(first, second);
    first.unmount();
    throwUncaught(first, second);
    second.unmount();
    throwUncaught(first, second);

    expect(shared.reports).toHaveLength(3);
  });

  it('reports to every project', () => {
    const capture = load();
    const a = provider(capture, { accessToken: 'A' });
    const otherA = provider(capture, { accessToken: 'A' });
    const b = provider(capture, { accessToken: 'B' });

    a.mount();
    otherA.mount();
    b.mount();
    throwUncaught(a, otherA, b);

    expect(reported(a, otherA, b)).toEqual([1, 0, 1]);
  });

  it('skips a Provider whose instance is disabled', () => {
    const capture = load();
    const first = provider(capture, { enabled: false });
    const second = provider(capture);

    first.mount();
    second.mount();
    throwUncaught(first, second);

    expect(reported(first, second)).toEqual([0, 1]);
  });

  it('reports once after every Provider unmounts', () => {
    const capture = load();
    const first = provider(capture);
    const second = provider(capture);
    const third = provider(capture);

    first.mount();
    second.mount();
    third.mount();
    first.unmount();
    second.unmount();
    third.unmount();
    throwUncaught(first, second, third);

    expect(reported(first, second, third)).toEqual([0, 0, 1]);
  });
});
