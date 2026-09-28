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

// A stand-in for a Provider that creates its instance from `config`.
function provider(capture, parent = null) {
  const { options, claim } = capture.claimGlobalCapture(
    { captureUncaught: true },
    parent?.claim,
  );
  const rollbar = {
    capturing: options.captureUncaught,
    configure(changes) {
      if ('captureUncaught' in changes) {
        this.capturing = changes.captureUncaught;
      }
    },
  };
  claim.rollbar = rollbar;
  return {
    claim,
    rollbar,
    mount: () => capture.mountGlobalCapture(claim),
    unmount: () => capture.unmountGlobalCapture(claim),
  };
}

const capturing = (...providers) => providers.map((p) => p.rollbar.capturing);

describe('global capture coordination', () => {
  it('keeps capture with the outer Provider under React 19 StrictMode', () => {
    const capture = load();
    const outer = provider(capture);
    const inner = provider(capture, outer);

    inner.mount();
    outer.mount();
    // Unmounts parents first, then remounts children first.
    outer.unmount();
    inner.unmount();
    inner.mount();
    outer.mount();

    expect(capturing(outer, inner)).toEqual([true, false]);
  });

  it('keeps capture with the outer Provider under React 18 StrictMode', () => {
    const capture = load();
    const outer = provider(capture);
    const inner = provider(capture, outer);

    inner.mount();
    outer.mount();
    // Unmounts and remounts children first.
    inner.unmount();
    outer.unmount();
    inner.mount();
    outer.mount();

    expect(capturing(outer, inner)).toEqual([true, false]);
  });

  it('hands capture to the outer of nested Providers', () => {
    const capture = load();
    const first = provider(capture);
    const outer = provider(capture);
    const inner = provider(capture, outer);

    first.mount();
    inner.mount();
    outer.mount();
    first.unmount();

    expect(capturing(first, outer, inner)).toEqual([false, true, false]);
  });

  it('skips Providers nested in the owner when handing capture over', () => {
    const capture = load();
    const outer = provider(capture);
    const inner = provider(capture, outer);
    const sibling = provider(capture);

    inner.mount();
    outer.mount();
    sibling.mount();
    outer.unmount();

    expect(capturing(outer, inner, sibling)).toEqual([false, false, true]);
  });
});
