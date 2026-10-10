import React, { useLayoutEffect, useState } from 'react';
import { format } from 'util';
import { renderToString } from 'react-dom/server';
import { act, render } from '@testing-library/react';
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
    const setupConsoleError = console.error;
    consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation((...args: unknown[]) => {
        // Keep jest-setup.ts failing the test on a prop-type error.
        if (/Failed prop type/.test(format(...args))) {
          setupConsoleError(...args);
        }
      });
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

  it('does not re-apply an unchanged context when it re-renders', () => {
    const rollbar = makeRollbar({ payload: { context: 'root' } });
    const ui = (text: string) => (
      <Provider instance={rollbar}>
        <RollbarContext context="home">
          <div>{text}</div>
        </RollbarContext>
      </Provider>
    );

    const { rerender } = render(ui('a'));
    rollbar.configure({ payload: { context: 'elsewhere' } });
    rerender(ui('b'));
    expect(contextOf(rollbar)).toBe('elsewhere');
  });

  it('renders without children', () => {
    const rollbar = makeRollbar();
    render(
      <Provider instance={rollbar}>
        <RollbarContext context="home" />
      </Provider>,
    );
    expect(contextOf(rollbar)).toBe('home');
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

    it('reports without touching the client outside a RollbarContext', () => {
      const error = jest.fn();
      // Like jest.mock('rollbar'): no options, and no configure().
      const MockRollbar = function (this: { error: jest.Mock }) {
        this.error = error;
      } as unknown as typeof Rollbar;

      render(
        <Provider Rollbar={MockRollbar} config={{}}>
          <ErrorBoundary>
            <Throw />
          </ErrorBoundary>
        </Provider>,
      );
      expect(error).toHaveBeenCalledTimes(1);
    });

    // React removes the component, and the hook's entry, before the
    // ErrorBoundary reports.
    it('reports with the context of a useRollbarContext in the component that throws on an update', () => {
      const { rollbar, reported } = makeReporting();
      const Page = ({ throws }: { throws: boolean }) => {
        useRollbarContext('home#index');
        if (throws) {
          throw new Error('update error');
        }
        return null;
      };
      const ui = (throws: boolean) => (
        <Provider instance={rollbar}>
          <ErrorBoundary>
            <Page throws={throws} />
          </ErrorBoundary>
        </Provider>
      );

      const { rerender } = render(ui(false));
      expect(contextOf(rollbar)).toBe('home#index');
      rerender(ui(true));
      expect(reported).toEqual(['home#index']);
      expect(contextOf(rollbar)).toBe('root');
    });

    it('reports with the context of a useRollbarContext around it on first render', () => {
      const { rollbar, reported } = makeReporting();
      const Page = () => {
        useRollbarContext('home#index');
        return (
          <ErrorBoundary>
            <Throw />
          </ErrorBoundary>
        );
      };
      render(
        <Provider instance={rollbar}>
          <Page />
        </Provider>,
      );
      expect(reported).toEqual(['home#index']);
      expect(contextOf(rollbar)).toBe('home#index');
    });

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

    // From here on the RollbarContext is outside the ErrorBoundary, which
    // reports with its context with or without onRender.
    describe.each([false, true])(
      'outside the ErrorBoundary (onRender: %s)',
      (onRender) => {
        it('reports with this context, on first render and after', () => {
          const { rollbar, reported } = makeReporting();
          const ui = (throws: boolean, boundaryKey: number) => (
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
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

        // React unmounts the old page before the new page's ErrorBoundary reports,
        // in the same commit.
        it('reports with the new page context when the old page unmounts in the same commit', async () => {
          const { rollbar, reported } = makeReporting();
          const Page = ({
            name,
            throws,
          }: {
            name: string;
            throws: boolean;
          }) => (
            <RollbarContext context={name} onRender={onRender}>
              <ErrorBoundary>
                <Throw when={throws} />
              </ErrorBoundary>
            </RollbarContext>
          );
          const ui = (page: string) => (
            <Provider instance={rollbar}>
              <Page key={page} name={page} throws={page === 'about'} />
            </Provider>
          );

          const { rerender } = render(ui('home'));
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('home');

          rerender(ui('about'));
          expect(reported).toEqual(['about']);
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('about');
        });

        // React runs passive effect cleanups after the commit in which the
        // ErrorBoundary reports, so the old page's hook has to leave before then.
        it('reports with the new page context when the old page used useRollbarContext', async () => {
          const { rollbar, reported } = makeReporting();
          const HomePage = () => {
            useRollbarContext('home#index');
            return null;
          };
          const ui = (page: string) => (
            <Provider instance={rollbar}>
              <RollbarContext context={page} onRender={onRender}>
                <ErrorBoundary>
                  {page === 'home' ? <HomePage /> : <Throw />}
                </ErrorBoundary>
              </RollbarContext>
            </Provider>
          );

          const { rerender } = render(ui('home'));
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('home#index');

          rerender(ui('about'));
          expect(reported).toEqual(['about']);
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('about');
        });

        // An earlier sibling's componentDidUpdate runs before the ErrorBoundary
        // reports, in the same commit.
        it('reports with this context when a sibling context updates in the same commit', async () => {
          const { rollbar, reported } = makeReporting();
          const ui = (showPage: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="nav">
                <div />
              </RollbarContext>
              {showPage && (
                <RollbarContext context="home" onRender={onRender}>
                  <ErrorBoundary>
                    <Throw />
                  </ErrorBoundary>
                </RollbarContext>
              )}
            </Provider>
          );

          const { rerender } = render(ui(false));
          rerender(ui(true));
          expect(reported).toEqual(['home']);
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('home');
        });

        it('reports with the new context when the context prop changes', async () => {
          const { rollbar, reported } = makeReporting();
          // React reuses the RollbarContext and mounts a new page inside it.
          const ui = (page: string) => (
            <Provider instance={rollbar}>
              <RollbarContext context={page} onRender={onRender}>
                <ErrorBoundary>
                  <Throw key={page} when={page === 'about'} />
                </ErrorBoundary>
              </RollbarContext>
            </Provider>
          );

          const { rerender } = render(ui('home'));
          rerender(ui('about'));
          expect(reported).toEqual(['about']);
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('about');
        });

        it('keeps the context of a useRollbarContext between it and the ErrorBoundary', async () => {
          const { rollbar, reported } = makeReporting();
          const Page = ({ throws }: { throws: boolean }) => {
            useRollbarContext('home#index');
            return (
              <ErrorBoundary>
                <Throw when={throws} />
              </ErrorBoundary>
            );
          };
          const ui = (throws: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <Page throws={throws} />
              </RollbarContext>
            </Provider>
          );

          const { rerender } = render(ui(false));
          await afterMicrotasks();
          rerender(ui(true));
          expect(reported).toEqual(['home#index']);
          expect(contextOf(rollbar)).toBe('home#index');
        });

        // They rank after it too, but aren't between it and the ErrorBoundary.
        it('ignores a later sibling RollbarContext', async () => {
          const { rollbar, reported } = makeReporting();
          const ui = (throws: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <ErrorBoundary>
                  <Throw when={throws} />
                </ErrorBoundary>
              </RollbarContext>
              <RollbarContext context="footer" />
            </Provider>
          );

          const { rerender } = render(ui(false));
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('footer');
          rerender(ui(true));
          expect(reported).toEqual(['home']);
          expect(contextOf(rollbar)).toBe('footer');
        });

        // A hook doesn't provide a scope, so where it renders among the
        // ErrorBoundary's siblings isn't known, and it counts as between them
        // like it does for the client's context.
        it('keeps the context of a useRollbarContext after the ErrorBoundary, but not outside the RollbarContext', async () => {
          const { rollbar, reported } = makeReporting();
          const Hook = ({ ctx }: { ctx: string }) => {
            useRollbarContext(ctx);
            return null;
          };
          const ui = (throws: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <ErrorBoundary>
                  <Throw when={throws} />
                </ErrorBoundary>
                <Hook ctx="home#footer" />
              </RollbarContext>
              <Hook ctx="footer" />
            </Provider>
          );

          const { rerender } = render(ui(false));
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('footer');
          rerender(ui(true));
          expect(reported).toEqual(['home#footer']);
          expect(contextOf(rollbar)).toBe('footer');
        });

        // A new ErrorBoundary takes a new order, after the hook's.
        it('treats a sibling useRollbarContext the same after the ErrorBoundary remounts', async () => {
          const { rollbar, reported } = makeReporting();
          const Footer = () => {
            useRollbarContext('app#footer');
            return null;
          };
          const ui = (pathname: string, throws: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="app" onRender={onRender}>
                <ErrorBoundary key={pathname}>
                  <Throw when={throws} />
                </ErrorBoundary>
                <Footer />
              </RollbarContext>
            </Provider>
          );

          const { rerender } = render(ui('/', false));
          await afterMicrotasks();
          rerender(ui('/', true));
          rerender(ui('/about', false));
          await afterMicrotasks();
          rerender(ui('/about', true));
          expect(reported).toEqual(['app#footer', 'app#footer']);
        });

        it('keeps the context of a useRollbarContext whose component rendered with the error', async () => {
          const { rollbar, reported } = makeReporting();
          const Page = ({ throws }: { throws: boolean }) => {
            useRollbarContext('home#index');
            return <Throw when={throws} />;
          };
          const ui = (throws: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <ErrorBoundary>
                  <Page throws={throws} />
                </ErrorBoundary>
              </RollbarContext>
            </Provider>
          );

          const { rerender } = render(ui(false));
          await afterMicrotasks();
          rerender(ui(true));
          expect(reported).toEqual(['home#index']);
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('home');
        });

        it('reports with the new page useRollbarContext when it throws on its first render', async () => {
          const { rollbar, reported } = makeReporting();
          const HomePage = () => {
            useRollbarContext('home#index');
            return null;
          };
          const AboutPage = () => {
            useRollbarContext('about#index');
            throw new Error('render error');
          };
          const ui = (page: string) => (
            <Provider instance={rollbar}>
              <RollbarContext context={page} onRender={onRender}>
                <ErrorBoundary>
                  {page === 'home' ? <HomePage /> : <AboutPage />}
                </ErrorBoundary>
              </RollbarContext>
            </Provider>
          );

          const { rerender } = render(ui('home'));
          await afterMicrotasks();
          rerender(ui('about'));
          expect(reported).toEqual(['about#index']);
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('about');
        });

        // React removes the hook's component before the ErrorBoundary reports,
        // and it didn't render with the error.
        it('reports with this context when a child throws on its own update', async () => {
          const { rollbar, reported } = makeReporting();
          let throwOnUpdate = () => {};
          const Child = () => {
            const [throws, setThrows] = useState(false);
            throwOnUpdate = () => setThrows(true);
            return <Throw when={throws} />;
          };
          const Page = () => {
            useRollbarContext('home#index');
            return <Child />;
          };
          render(
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <ErrorBoundary>
                  <Page />
                </ErrorBoundary>
              </RollbarContext>
            </Provider>,
          );
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('home#index');
          act(() => throwOnUpdate());
          expect(reported).toEqual(['home']);
        });

        // They render before it, but in a sibling's scope.
        it('ignores a useRollbarContext inside a sibling ErrorBoundary or RollbarContext', async () => {
          const { rollbar, reported } = makeReporting();
          const Hook = ({ ctx }: { ctx: string }) => {
            useRollbarContext(ctx);
            return null;
          };
          const ui = (throws: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="dashboard" onRender={onRender}>
                <ErrorBoundary>
                  <Hook ctx="dashboard#chart" />
                </ErrorBoundary>
                <RollbarContext context="nav">
                  <Hook ctx="nav#menu" />
                </RollbarContext>
                <ErrorBoundary>
                  <Throw when={throws} />
                </ErrorBoundary>
              </RollbarContext>
            </Provider>
          );

          const { rerender } = render(ui(false));
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('nav#menu');
          rerender(ui(true));
          expect(reported).toEqual(['dashboard']);
          expect(contextOf(rollbar)).toBe('nav#menu');
        });

        // With onRender, it's still rendering when the ErrorBoundary reports.
        it('ignores a later sibling onRender RollbarContext in the same commit', async () => {
          const { rollbar, reported } = makeReporting();
          render(
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <ErrorBoundary>
                  <Throw />
                </ErrorBoundary>
                <RollbarContext context="sidebar" onRender />
              </RollbarContext>
            </Provider>,
          );
          expect(reported).toEqual(['home']);
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('sidebar');
        });

        it('keeps the innermost of several useRollbarContext hooks between it and the ErrorBoundary', async () => {
          const { rollbar, reported } = makeReporting();
          const Inner = ({ throws }: { throws: boolean }) => {
            useRollbarContext('home#show');
            return (
              <ErrorBoundary>
                <Throw when={throws} />
              </ErrorBoundary>
            );
          };
          const Outer = ({ throws }: { throws: boolean }) => {
            useRollbarContext('home#index');
            return <Inner throws={throws} />;
          };
          const ui = (throws: boolean) => (
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <Outer throws={throws} />
              </RollbarContext>
              <RollbarContext context="footer" />
            </Provider>
          );

          const { rerender } = render(ui(false));
          await afterMicrotasks();
          rerender(ui(true));
          expect(reported).toEqual(['home#show']);
        });

        // React calls componentDidCatch before the RollbarContext mounts.
        it('puts the previous context back after reporting', async () => {
          const { rollbar, reported } = makeReporting();
          let afterReport: unknown;
          const Probe = () => {
            useLayoutEffect(() => {
              afterReport = contextOf(rollbar);
            }, []);
            return null;
          };

          render(
            <Provider instance={rollbar}>
              <RollbarContext context="home" onRender={onRender}>
                <ErrorBoundary>
                  <Throw />
                </ErrorBoundary>
                <Probe />
              </RollbarContext>
            </Provider>,
          );
          expect(reported).toEqual(['home']);
          // With onRender, the context set during render is still there.
          expect(afterReport).toBe(onRender ? 'home' : 'root');
          await afterMicrotasks();
          expect(contextOf(rollbar)).toBe('home');
        });
      },
    );

    it('leaves nothing behind when the ErrorBoundary replaces an updated onRender context', async () => {
      const { rollbar, reported } = makeReporting();
      const ui = (page: string) => (
        <Provider instance={rollbar}>
          <ErrorBoundary>
            <RollbarContext context={page} onRender>
              <Throw when={page === 'about'} />
            </RollbarContext>
          </ErrorBoundary>
        </Provider>
      );

      const { rerender } = render(ui('home'));
      rerender(ui('about'));
      expect(reported).toEqual(['about']);
      await afterMicrotasks();
      expect(contextOf(rollbar)).toBe('root');
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
