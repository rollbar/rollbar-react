import React, { StrictMode, ReactNode } from 'react';
import { render } from '@testing-library/react';
import Rollbar from 'rollbar';
import { Provider, useRollbar } from '../rollbar-react';

// Each config records the uncaught items its instance tried to send.
function makeConfig() {
  const reports: unknown[] = [];
  const config: Rollbar.Configuration = {
    accessToken: 'POST_CLIENT_ITEM_TOKEN',
    captureUncaught: true,
    captureUnhandledRejections: true,
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

  it('builds one instance under StrictMode', async () => {
    const { config, reports } = makeConfig();
    const ctor = jest.fn(
      (options: Rollbar.Configuration) => new Rollbar(options),
    );
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

    expect(ctor).toHaveBeenCalledTimes(1);
    expect(provided).toBe(ctor.mock.results[0].value);
    expect(reports).toHaveLength(1);
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

  it('turns capture off only where another instance owns it', () => {
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

    expect(instances[0].options.captureUncaught).toBe(true);
    expect(instances[1].options.captureUncaught).toBe(false);
    expect(instances[1].options.accessToken).toBe('POST_CLIENT_ITEM_TOKEN');
  });
});
