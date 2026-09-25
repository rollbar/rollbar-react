import React from 'react';
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';
import Rollbar from 'rollbar';
import {
  ErrorBoundary,
  Provider,
  RollbarContext,
  useRollbarContext,
} from '../rollbar-react';

const makeRollbar = (config: Rollbar.Configuration = {}) =>
  new Rollbar({
    accessToken: 'POST_CLIENT_ITEM_TOKEN',
    enabled: false,
    ...config,
  });

const contextOf = (rollbar: Rollbar): unknown =>
  rollbar.options.payload?.context;

// With onRender, RollbarContext puts back the context of whatever is mounted
// in a microtask after rendering.
const afterMicrotasks = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('RollbarContext', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  // #102
  it('works when the config has no payload', () => {
    const rollbar = makeRollbar();
    expect(rollbar.options.payload).toBeUndefined();

    const { unmount } = render(
      <Provider instance={rollbar}>
        <RollbarContext context="home">
          <div />
        </RollbarContext>
      </Provider>,
    );
    expect(contextOf(rollbar)).toBe('home');

    // Not undefined: configure() ignores undefined values, which used to
    // leave 'home' in place after unmount.
    unmount();
    expect(contextOf(rollbar)).toBe('');
  });

  it('sets the context on mount and restores the previous one on unmount', () => {
    const rollbar = makeRollbar({ payload: { context: 'root' } });

    const { rerender, unmount } = render(
      <Provider instance={rollbar}>
        <RollbarContext context="home">
          <div />
        </RollbarContext>
      </Provider>,
    );
    expect(contextOf(rollbar)).toBe('home');

    rerender(
      <Provider instance={rollbar}>
        <RollbarContext context="about">
          <div />
        </RollbarContext>
      </Provider>,
    );
    expect(contextOf(rollbar)).toBe('about');

    unmount();
    expect(contextOf(rollbar)).toBe('root');
  });

  // #88
  describe('when a child throws while rendering', () => {
    const makeReporting = () => {
      const rollbar = makeRollbar({ payload: { context: 'root' } });
      const reported: unknown[] = [];
      rollbar.error = jest.fn(() => {
        reported.push(contextOf(rollbar));
        return { uuid: '' };
      });
      return { rollbar, reported };
    };
    const Throw = ({ when = true }: { when?: boolean }) => {
      if (when) {
        throw new Error('render error');
      }
      return null;
    };
    const renderThrowing = (onRender: boolean) => {
      const reporting = makeReporting();
      render(
        <Provider instance={reporting.rollbar}>
          <ErrorBoundary>
            <RollbarContext context="home" onRender={onRender}>
              <Throw />
            </RollbarContext>
          </ErrorBoundary>
        </Provider>,
      );
      return reporting;
    };

    it('reports with the previous context by default', () => {
      expect(renderThrowing(false).reported).toEqual(['root']);
    });

    it('reports with this context when onRender is set', async () => {
      const { rollbar, reported } = renderThrowing(true);
      expect(reported).toEqual(['home']);

      // The ErrorBoundary replaced the RollbarContext before it mounted.
      await afterMicrotasks();
      expect(contextOf(rollbar)).toBe('root');
    });

    it('leaves nothing behind when the ErrorBoundary replaces an onRender context', async () => {
      const { rollbar, reported } = makeReporting();
      const ui = (
        outer: string,
        page: 'throws' | 'renders' | 'none',
        boundaryKey: number,
      ) => (
        <Provider instance={rollbar}>
          <RollbarContext context={outer}>
            <ErrorBoundary key={boundaryKey}>
              {page !== 'none' && (
                <RollbarContext context="home" onRender>
                  <Throw when={page === 'throws'} />
                </RollbarContext>
              )}
            </ErrorBoundary>
          </RollbarContext>
        </Provider>
      );

      const { rerender } = render(ui('app', 'throws', 1));
      expect(reported).toEqual(['home']);
      await afterMicrotasks();
      expect(contextOf(rollbar)).toBe('app');

      rerender(ui('app2', 'throws', 1));
      expect(contextOf(rollbar)).toBe('app2');

      // A new ErrorBoundary, and this time the page renders.
      rerender(ui('app2', 'renders', 2));
      expect(contextOf(rollbar)).toBe('home');

      rerender(ui('app2', 'none', 2));
      expect(contextOf(rollbar)).toBe('app2');
    });

    it('reports with this context from outside the ErrorBoundary, on first render and after', () => {
      const { rollbar, reported } = makeReporting();
      const ui = (throws: boolean, boundaryKey: number) => (
        <Provider instance={rollbar}>
          <RollbarContext context="home" onRender>
            <ErrorBoundary key={boundaryKey}>
              <Throw when={throws} />
            </ErrorBoundary>
          </RollbarContext>
        </Provider>
      );

      const { rerender } = render(ui(true, 1));
      rerender(ui(false, 2));
      rerender(ui(true, 2));
      expect(reported).toEqual(['home', 'home']);
    });
  });

  describe('with onRender', () => {
    it('sets the context before children render', () => {
      const rollbar = makeRollbar({ payload: { context: 'root' } });
      let seen: unknown;
      const Child = () => {
        seen = contextOf(rollbar);
        return null;
      };

      const { unmount } = render(
        <Provider instance={rollbar}>
          <RollbarContext context="home" onRender>
            <Child />
          </RollbarContext>
        </Provider>,
      );
      expect(seen).toBe('home');

      unmount();
      expect(contextOf(rollbar)).toBe('root');
    });

    it('puts the context back after rendering on the server', async () => {
      const rollbar = makeRollbar({ payload: { context: 'root' } });
      let seen: unknown;
      const Child = () => {
        seen = contextOf(rollbar);
        return null;
      };

      renderToString(
        <Provider instance={rollbar}>
          <RollbarContext context="home" onRender>
            <Child />
          </RollbarContext>
        </Provider>,
      );
      expect(seen).toBe('home');

      // Nothing mounts on the server.
      await afterMicrotasks();
      expect(contextOf(rollbar)).toBe('root');
    });

    it('does not call setState during render', () => {
      const rollbar = makeRollbar();
      render(
        <Provider instance={rollbar}>
          <RollbarContext context="home" onRender>
            <div />
          </RollbarContext>
        </Provider>,
      );
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('follows changes to the context prop', () => {
      const rollbar = makeRollbar({ payload: { context: 'root' } });
      const ui = (context: string) => (
        <Provider instance={rollbar}>
          <RollbarContext context={context} onRender>
            <div />
          </RollbarContext>
        </Provider>
      );

      const { rerender, unmount } = render(ui('home'));
      rerender(ui('about'));
      expect(contextOf(rollbar)).toBe('about');

      unmount();
      expect(contextOf(rollbar)).toBe('root');
    });
  });
});

describe('nested contexts', () => {
  type NestedProps = { outer: string; inner: string; showInner: boolean };

  const HookInner = ({ context }: { context: string }) => {
    useRollbarContext(context);
    return null;
  };
  const HookOuter = ({ outer, inner, showInner }: NestedProps) => {
    useRollbarContext(outer);
    return showInner ? <HookInner context={inner} /> : null;
  };

  const modes: [string, React.ComponentType<NestedProps>][] = [
    [
      'RollbarContext',
      ({ outer, inner, showInner }) => (
        <RollbarContext context={outer}>
          {showInner && (
            <RollbarContext context={inner}>
              <div />
            </RollbarContext>
          )}
        </RollbarContext>
      ),
    ],
    [
      'RollbarContext with onRender',
      ({ outer, inner, showInner }) => (
        <RollbarContext context={outer} onRender>
          {showInner && (
            <RollbarContext context={inner} onRender>
              <div />
            </RollbarContext>
          )}
        </RollbarContext>
      ),
    ],
    ['useRollbarContext', HookOuter],
    [
      'useRollbarContext inside RollbarContext',
      ({ outer, inner, showInner }) => (
        <RollbarContext context={outer}>
          {showInner && <HookInner context={inner} />}
        </RollbarContext>
      ),
    ],
  ];

  it.each(modes)('%s: the innermost context wins', (_, Nested) => {
    const rollbar = makeRollbar({ payload: { context: 'root' } });
    const ui = (props: NestedProps) => (
      <Provider instance={rollbar}>
        <Nested {...props} />
      </Provider>
    );

    // React mounts children before their parents.
    const { rerender, unmount } = render(
      ui({ outer: 'outer', inner: 'inner', showInner: true }),
    );
    expect(contextOf(rollbar)).toBe('inner');

    // The outer context changes while the inner one is still mounted.
    rerender(ui({ outer: 'outer2', inner: 'inner', showInner: true }));
    expect(contextOf(rollbar)).toBe('inner');

    rerender(ui({ outer: 'outer2', inner: 'inner2', showInner: true }));
    expect(contextOf(rollbar)).toBe('inner2');

    // The outer context's current value, not the one it had when the inner
    // one mounted.
    rerender(ui({ outer: 'outer2', inner: 'inner2', showInner: false }));
    expect(contextOf(rollbar)).toBe('outer2');

    rerender(ui({ outer: 'outer2', inner: 'inner3', showInner: true }));
    expect(contextOf(rollbar)).toBe('inner3');

    unmount();
    expect(contextOf(rollbar)).toBe('root');
  });
});

describe('useRollbarContext', () => {
  // #102
  it('works when the config has no payload', () => {
    const rollbar = makeRollbar();
    const Page = () => {
      useRollbarContext('home');
      return null;
    };

    const { unmount } = render(
      <Provider instance={rollbar}>
        <Page />
      </Provider>,
    );
    expect(contextOf(rollbar)).toBe('home');

    // Not undefined: configure() ignores undefined values, which used to
    // leave 'home' in place after unmount.
    unmount();
    expect(contextOf(rollbar)).toBe('');
  });
});
