import React, { StrictMode, ReactNode } from 'react';
import { render } from '@testing-library/react';
import Rollbar from 'rollbar';
import {
  Provider,
  useRollbar,
  useRollbarConfiguration,
} from '../rollbar-react';

const CAPTURE_OFF = {
  captureUncaught: false,
  captureUnhandledRejections: false,
};

const CAPTURE_ON = {
  captureUncaught: true,
  captureUnhandledRejections: true,
};

// Capture is coordinated per access token, so each test gets its own and
// starts as a page with no Providers does.
let tokens = 0;
let accessToken = '';

beforeEach(() => {
  tokens += 1;
  accessToken = `POST_CLIENT_ITEM_TOKEN_${tokens}`;
  window.onerror = null;
});

// Each config records the uncaught items its instance tried to send.
function makeConfig(capture = true, token = accessToken) {
  const reports: unknown[] = [];
  const config: Rollbar.Configuration = {
    accessToken: token,
    ...(capture && CAPTURE_ON),
    checkIgnore: (isUncaught, args) => {
      if (isUncaught) reports.push(args);
      return true; // never send
    },
  };
  return { config, reports };
}

// A Rollbar constructor whose instances each count their own uncaught items,
// in construction order, for Providers that share a config across renders.
function countingRollbar() {
  const reports: number[] = [];
  const ctor = jest.fn((options: Rollbar.Configuration) => {
    const index = reports.push(0) - 1;
    return new Rollbar({
      ...options,
      checkIgnore: (isUncaught) => {
        if (isUncaught) reports[index] += 1;
        return true;
      },
    });
  });
  return { ctor, reports };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

async function throwUncaught() {
  window.onerror?.('boom', 'http://localhost/app.js', 1, 1, new Error('boom'));
  await settle();
}

async function rejectUnhandled() {
  const event = new Event('unhandledrejection');
  Object.assign(event, {
    reason: new Error('nope'),
    promise: Promise.resolve(),
  });
  window.dispatchEvent(event);
  await settle();
}

// Applies `config` to the enclosing Provider's instance on every render.
const Configure = ({ config }: { config: Rollbar.Configuration }) => {
  useRollbarConfiguration(config);
  return null;
};

// Rendering its children again after an error throws away the first attempt,
// including any Provider inside it, which never mounts.
class Retry extends React.Component<{ children: ReactNode }> {
  state = { attempt: 0 };
  static getDerivedStateFromError() {
    return { attempt: 1 };
  }
  render() {
    const { children } = this.props;
    return <React.Fragment key={this.state.attempt}>{children}</React.Fragment>;
  }
}

// A component that throws on its first render only.
function throwOnce() {
  let thrown = false;
  return function ThrowOnce() {
    if (!thrown) {
      thrown = true;
      throw new Error('first render');
    }
    return null;
  };
}

// Renders without the error React reports for a render that throws.
async function renderQuietly(ui: React.ReactElement) {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  const onError = (event: ErrorEvent) => event.preventDefault();
  window.addEventListener('error', onError);
  try {
    render(ui);
  } finally {
    window.removeEventListener('error', onError);
    consoleError.mockRestore();
  }
  await settle();
}

describe('Provider global capture', () => {
  it('reports an uncaught error once with several Providers', async () => {
    const providers = [makeConfig(), makeConfig(), makeConfig()];
    render(
      <>
        {providers.map(({ config }, i) => (
          <Provider key={i} config={config}>
            <div />
          </Provider>
        ))}
      </>,
    );

    await throwUncaught();
    await rejectUnhandled();

    expect(providers.map(({ reports }) => reports.length)).toEqual([2, 0, 0]);
  });

  it('reports once, from the provided instance, under StrictMode', async () => {
    const { config } = makeConfig();
    const { ctor, reports } = countingRollbar();
    let provided: Rollbar | undefined;
    const Consumer = () => {
      provided = useRollbar();
      return null;
    };

    render(
      <StrictMode>
        <Provider Rollbar={ctor as unknown as typeof Rollbar} config={config}>
          <Consumer />
        </Provider>
      </StrictMode>,
    );

    await throwUncaught();
    await rejectUnhandled();

    // StrictMode constructs the Provider twice and keeps one.
    expect(ctor).toHaveBeenCalledTimes(2);
    const kept = ctor.mock.results.findIndex(({ value }) => value === provided);
    expect(kept).not.toBe(-1);
    expect(reports[kept]).toBe(2);
    expect(reports.reduce((a, b) => a + b)).toBe(2);
  });

  it('reports to each project once', async () => {
    const a = makeConfig(true, `${accessToken}_A`);
    const otherA = makeConfig(true, `${accessToken}_A`);
    const b = makeConfig(true, `${accessToken}_B`);
    render(
      <>
        {[a, otherA, b].map(({ config }, i) => (
          <Provider key={i} config={config}>
            <div />
          </Provider>
        ))}
      </>,
    );

    await throwUncaught();
    await rejectUnhandled();

    expect([a, otherA, b].map(({ reports }) => reports.length)).toEqual([
      2, 0, 2,
    ]);
  });

  it('reports once with an instance shared through a custom constructor', async () => {
    const { config, reports } = makeConfig();
    const shared = new Rollbar(config);
    const ctor = jest.fn(() => shared);
    const App = ({ showFirst }: { showFirst: boolean }) => (
      <>
        {showFirst && (
          <Provider Rollbar={ctor as unknown as typeof Rollbar} config={config}>
            <div />
          </Provider>
        )}
        <Provider Rollbar={ctor as unknown as typeof Rollbar} config={config}>
          <div />
        </Provider>
      </>
    );

    const { rerender } = render(<App showFirst />);
    await throwUncaught();
    rerender(<App showFirst={false} />);
    await throwUncaught();
    await rejectUnhandled();

    expect(reports).toHaveLength(3);
  });

  it('keeps the instance and options in state', () => {
    const { config } = makeConfig();
    const ref = React.createRef<Provider>();
    let provided: Rollbar | undefined;
    const Consumer = () => {
      provided = useRollbar();
      return null;
    };

    render(
      <Provider ref={ref} config={config}>
        <Consumer />
      </Provider>,
    );

    const state = ref.current?.state as { rollbar: Rollbar; options: unknown };
    expect(state.rollbar).toBe(provided);
    expect(state.options).toBe(config);
  });

  it('hands capture to the next Provider when the owner unmounts', async () => {
    const first = makeConfig();
    const second = makeConfig();
    const App = ({ showFirst }: { showFirst: boolean }) => (
      <>
        {showFirst && (
          <Provider config={first.config}>
            <div />
          </Provider>
        )}
        <Provider config={second.config}>
          <div />
        </Provider>
      </>
    );

    const { rerender } = render(<App showFirst />);
    await throwUncaught();
    rerender(<App showFirst={false} />);
    await throwUncaught();
    await rejectUnhandled();

    expect(first.reports).toHaveLength(1);
    expect(second.reports).toHaveLength(2);
  });

  it('hands capture to a remounted Provider', async () => {
    const before = makeConfig();
    const after = makeConfig();
    const App = ({
      config,
      id,
    }: {
      config: Rollbar.Configuration;
      id: number;
    }) => (
      <Provider key={id} config={config}>
        <div />
      </Provider>
    );

    const { rerender } = render(<App config={before.config} id={1} />);
    rerender(<App config={after.config} id={2} />);
    await throwUncaught();
    await rejectUnhandled();

    expect(before.reports).toHaveLength(0);
    expect(after.reports).toHaveLength(2);
  });

  it('keeps capture with the outer Provider when nested', async () => {
    const outer = makeConfig();
    const inner = makeConfig();
    const Wrap = ({ children }: { children: ReactNode }) => (
      <Provider config={outer.config}>
        <Provider config={inner.config}>{children}</Provider>
      </Provider>
    );

    render(
      <StrictMode>
        <Wrap>
          <div />
        </Wrap>
      </StrictMode>,
    );
    await throwUncaught();

    expect(outer.reports).toHaveLength(1);
    expect(inner.reports).toHaveLength(0);
  });

  it('keeps capture with the outer Provider through an instance Provider', async () => {
    const outer = makeConfig();
    const inner = makeConfig();
    const shared = new Rollbar({ accessToken: 'POST_CLIENT_ITEM_TOKEN' });

    render(
      <Provider config={outer.config}>
        <Provider instance={shared}>
          <Provider config={inner.config}>
            <div />
          </Provider>
        </Provider>
      </Provider>,
    );
    await throwUncaught();

    expect(outer.reports).toHaveLength(1);
    expect(inner.reports).toHaveLength(0);
  });

  it('hands capture to the Provider that mounts when a render is thrown away', async () => {
    const { config } = makeConfig();
    const { ctor, reports } = countingRollbar();
    let provided: Rollbar | undefined;
    const Consumer = () => {
      provided = useRollbar();
      return null;
    };
    const ThrowOnce = throwOnce();

    await renderQuietly(
      <Retry>
        <Provider Rollbar={ctor as unknown as typeof Rollbar} config={config}>
          <ThrowOnce />
          <Consumer />
        </Provider>
      </Retry>,
    );
    reports.fill(0);

    await throwUncaught();
    await rejectUnhandled();

    expect(ctor).toHaveBeenCalledTimes(2);
    expect(provided).toBe(ctor.mock.results[1].value);
    expect(reports).toEqual([0, 2]);
  });

  it('keeps capture with the outer Provider when a nested render is thrown away', async () => {
    const outer = makeConfig();
    const inner = makeConfig();
    const { ctor, reports } = countingRollbar();
    const Counting = ctor as unknown as typeof Rollbar;
    const ThrowOnce = throwOnce();

    await renderQuietly(
      <Retry>
        <Provider Rollbar={Counting} config={outer.config}>
          <Provider Rollbar={Counting} config={inner.config}>
            <ThrowOnce />
          </Provider>
        </Provider>
      </Retry>,
    );
    reports.fill(0);

    await throwUncaught();
    await rejectUnhandled();

    // Thrown-away outer and inner, then the outer and inner that mounted.
    expect(ctor).toHaveBeenCalledTimes(4);
    expect(reports).toEqual([0, 0, 2, 0]);
  });

  it('keeps the previous owner capturing when a constructor throws', async () => {
    const before = makeConfig();
    const after = makeConfig();
    const failing = jest.fn(() => {
      throw new Error('bad config');
    });
    class Fallback extends React.Component<{ children: ReactNode }> {
      state = { failed: false };
      static getDerivedStateFromError() {
        return { failed: true };
      }
      render() {
        const { children } = this.props;
        return this.state.failed ? null : children;
      }
    }

    const { unmount } = render(
      <Provider config={before.config}>
        <div />
      </Provider>,
    );
    unmount();
    await renderQuietly(
      <Fallback>
        <Provider
          Rollbar={failing as unknown as typeof Rollbar}
          config={after.config}
        >
          <div />
        </Provider>
      </Fallback>,
    );
    before.reports.length = 0;
    await throwUncaught();

    expect(failing).toHaveBeenCalled();
    expect(before.reports).toHaveLength(1);
  });

  it('does not re-render a nested Provider when the outer one re-renders', () => {
    const outer = makeConfig();
    const inner = makeConfig();
    let renders = 0;
    const Consumer = () => {
      useRollbar();
      renders += 1;
      return null;
    };
    const nested = (
      <Provider config={inner.config}>
        <Consumer />
      </Provider>
    );
    const App = () => <Provider config={outer.config}>{nested}</Provider>;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(renders).toBe(1);
  });

  it("leaves the app's options and configure alone", () => {
    const owner = makeConfig();
    const other = makeConfig();
    const instances: Rollbar[] = [];
    const Consumer = () => {
      instances.push(useRollbar());
      return null;
    };

    render(
      <>
        <Provider config={owner.config}>
          <Consumer />
        </Provider>
        <Provider config={other.config}>
          <Consumer />
        </Provider>
      </>,
    );
    const configure = jest.spyOn(instances[1], 'configure');
    instances[1].configure({ captureUncaught: true, payload: {} });

    expect(instances.map((rollbar) => rollbar.options.captureUncaught)).toEqual(
      [true, true],
    );
    expect(instances[0].configure).toBe(Rollbar.prototype.configure);
    expect(configure).toHaveBeenCalledTimes(1);
    expect(configure).toHaveBeenCalledWith({
      captureUncaught: true,
      payload: {},
    });
  });

  it('gives capture to an outer Provider that opts in', async () => {
    const outer = makeConfig(false);
    const inner = makeConfig();
    const App = ({ optIn }: { optIn: boolean }) => (
      <Provider config={outer.config}>
        <Provider config={inner.config}>
          <div />
        </Provider>
        {optIn && <Configure config={CAPTURE_ON} />}
      </Provider>
    );

    const { rerender } = render(<App optIn={false} />);
    await throwUncaught();
    rerender(<App optIn />);
    await throwUncaught();

    expect(outer.reports).toHaveLength(1);
    expect(inner.reports).toHaveLength(1);
  });

  it('reports once after every Provider unmounts', async () => {
    const providers = [makeConfig(), makeConfig(false), makeConfig()];
    const { unmount } = render(
      <>
        {providers.map(({ config }, i) => (
          <Provider key={i} config={config}>
            <div />
          </Provider>
        ))}
      </>,
    );
    unmount();
    await throwUncaught();

    expect(providers.map(({ reports }) => reports.length)).toEqual([0, 0, 1]);
  });

  it('keeps a Provider that opted out off when the owner unmounts', async () => {
    const first = makeConfig();
    const second = makeConfig();
    const App = ({ showFirst }: { showFirst: boolean }) => (
      <>
        {showFirst && (
          <Provider config={first.config}>
            <div />
          </Provider>
        )}
        <Provider config={second.config}>
          <Configure config={CAPTURE_OFF} />
        </Provider>
      </>
    );

    const { rerender } = render(<App showFirst />);
    rerender(<App showFirst={false} />);
    await throwUncaught();
    await rejectUnhandled();

    // Nobody else wants capture, so the unmounted owner keeps it.
    expect(first.reports).toHaveLength(2);
    expect(second.reports).toHaveLength(0);
  });

  it('hands capture to the next Provider when the owner opts out', async () => {
    const first = makeConfig();
    const second = makeConfig();
    const App = ({ optOut }: { optOut: boolean }) => (
      <>
        <Provider config={first.config}>
          {optOut && <Configure config={CAPTURE_OFF} />}
        </Provider>
        <Provider config={second.config}>
          <div />
        </Provider>
      </>
    );

    const { rerender } = render(<App optOut={false} />);
    rerender(<App optOut />);
    await throwUncaught();
    await rejectUnhandled();

    expect(first.reports).toHaveLength(0);
    expect(second.reports).toHaveLength(2);
  });

  it('keeps a Provider that opts in off while another owns capture', async () => {
    const first = makeConfig();
    const second = makeConfig(false);
    const App = ({ showFirst }: { showFirst: boolean }) => (
      <>
        {showFirst && (
          <Provider config={first.config}>
            <div />
          </Provider>
        )}
        <Provider config={second.config}>
          <Configure config={CAPTURE_ON} />
        </Provider>
      </>
    );

    const { rerender } = render(<App showFirst />);
    await throwUncaught();
    await rejectUnhandled();

    expect(first.reports).toHaveLength(2);
    expect(second.reports).toHaveLength(0);

    rerender(<App showFirst={false} />);
    await throwUncaught();
    await rejectUnhandled();

    expect(first.reports).toHaveLength(2);
    expect(second.reports).toHaveLength(2);
  });

  it('stops capturing when the only owner opts out and resumes when it opts in', async () => {
    const { config, reports } = makeConfig();
    let rollbar: Rollbar | undefined;
    const Consumer = () => {
      rollbar = useRollbar();
      return null;
    };

    render(
      <Provider config={config}>
        <Consumer />
      </Provider>,
    );
    rollbar?.configure(CAPTURE_OFF);
    await throwUncaught();

    expect(reports).toHaveLength(0);

    rollbar?.configure(CAPTURE_ON);
    await throwUncaught();

    expect(reports).toHaveLength(1);
  });

  describe('in Chrome', () => {
    const { prepareStackTrace } = Error;

    beforeEach(() => {
      Object.assign(window, { chrome: { runtime: {} } });
    });

    afterEach(() => {
      delete (window as { chrome?: unknown }).chrome;
      Error.prepareStackTrace = prepareStackTrace;
    });

    // Chrome calls onerror without the error, then Error.prepareStackTrace,
    // which the instance that installed its handlers last set, with it.
    async function throwAnonymous() {
      window.onerror?.('Script error.', '', 0, 0, null as unknown as Error);
      Error.prepareStackTrace?.(new Error('anonymous'), []);
      await settle();
    }

    it('reports an anonymous error once, from the reporting instance', async () => {
      const first = makeConfig();
      const second = makeConfig();
      const App = ({ optOut, showSecond }: Record<string, boolean>) => (
        <>
          <Provider config={first.config}>
            <Configure config={{ captureUncaught: !optOut }} />
          </Provider>
          {showSecond && (
            <Provider config={second.config}>
              <div />
            </Provider>
          )}
        </>
      );

      const { rerender } = render(<App optOut={false} showSecond />);
      await throwAnonymous();
      rerender(<App optOut showSecond />);
      await throwAnonymous();
      rerender(<App optOut showSecond={false} />);
      rerender(<App optOut={false} showSecond={false} />);
      await throwAnonymous();

      expect(first.reports).toHaveLength(2);
      expect(second.reports).toHaveLength(1);
    });
  });
});
