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
