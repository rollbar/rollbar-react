import React from 'react';
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
    const renderThrowing = (onRender: boolean) => {
      const rollbar = makeRollbar({ payload: { context: 'root' } });
      const reported: unknown[] = [];
      rollbar.error = jest.fn(() => {
        reported.push(contextOf(rollbar));
        return { uuid: '' };
      });
      const Throw = () => {
        throw new Error('render error');
      };
      render(
        <Provider instance={rollbar}>
          <ErrorBoundary>
            <RollbarContext context="home" onRender={onRender}>
              <Throw />
            </RollbarContext>
          </ErrorBoundary>
        </Provider>,
      );
      expect(rollbar.error).toHaveBeenCalledTimes(1);
      return reported[0];
    };

    it('reports with the previous context by default', () => {
      expect(renderThrowing(false)).toBe('root');
    });

    it('reports with this context when onRender is set', () => {
      expect(renderThrowing(true)).toBe('home');
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

    it('keeps the innermost context when nested', () => {
      const rollbar = makeRollbar({ payload: { context: 'root' } });
      render(
        <Provider instance={rollbar}>
          <RollbarContext context="outer" onRender>
            <RollbarContext context="inner" onRender>
              <div />
            </RollbarContext>
          </RollbarContext>
        </Provider>,
      );
      expect(contextOf(rollbar)).toBe('inner');
    });
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
