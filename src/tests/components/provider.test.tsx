import React, {
  Context as ReactContext,
  ReactNode,
  memo,
  useContext,
  useState,
} from 'react';
import { act, render, waitFor, screen } from '@testing-library/react';
import Rollbar from 'rollbar';
import {
  Context,
  ContextInterface,
  Provider,
  getRollbarFromContext,
  useRollbar,
} from '../rollbar-react';
import { renderWithProviderProps } from '../utils/provider-util';

describe('Provider', () => {
  const accessToken = 'POST_CLIENT_ITEM_TOKEN';

  const config: Rollbar.Configuration = {
    accessToken: accessToken,
    captureUncaught: true,
  };

  const screenText = 'Hello';

  const TestComponent = () => {
    const rollbar = useRollbar();

    return (
      <div>
        <div>{screenText}</div>
        <div>{rollbar?.options?.accessToken}</div>
      </div>
    );
  };

  class TestClassComponent extends React.Component {
    static contextType = Context;
    declare context: ReactContext<ContextInterface>;
    rollbar: Rollbar | undefined;

    render(): ReactNode {
      this.rollbar = getRollbarFromContext(this.context);

      return (
        <div>
          <div>{screenText}</div>
          <div>{this.rollbar?.options?.accessToken}</div>
        </div>
      );
    }
  }

  const instance: Rollbar = new Rollbar(config);

  it('should provide a Rollbar instance, given a config', async () => {
    renderWithProviderProps(<TestComponent />, {}, { config: config });

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });

  it('should provide a Rollbar instance, given a constructor', async () => {
    renderWithProviderProps(
      <TestComponent />,
      {},
      { Rollbar: Rollbar, config: config },
    );

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });

  it('should provide a Rollbar instance, given the instance', async () => {
    renderWithProviderProps(<TestComponent />, {}, { instance: instance });

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });

  it('should provide a Rollbar instance to class components', async () => {
    renderWithProviderProps(<TestClassComponent />, {}, { config: config });

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });

  describe('when the Provider re-renders', () => {
    const renderAndRerender = (rerenders: number) => {
      const rollbars = new Set<Rollbar>();
      const contextValues = new Set<ContextInterface>();
      let memoRenders = 0;
      let bump = () => {};

      const Consumer = () => {
        rollbars.add(useRollbar());
        contextValues.add(useContext(Context));
        return null;
      };
      const MemoConsumer = memo(function MemoConsumer() {
        useRollbar();
        memoRenders++;
        return null;
      });
      const App = () => {
        const [count, setCount] = useState(0);
        bump = () => setCount((n) => n + 1);
        return (
          <Provider config={config}>
            <Consumer />
            <MemoConsumer />
            <span>{count}</span>
          </Provider>
        );
      };

      render(<App />);
      for (let i = 0; i < rerenders; i++) {
        act(() => bump());
      }
      return { rollbars, contextValues, memoRenders };
    };

    it('should keep the same Rollbar instance and context value', () => {
      const { rollbars, contextValues } = renderAndRerender(3);

      expect(rollbars.size).toBe(1);
      expect(contextValues.size).toBe(1);
    });

    it('should not re-render memoized consumers', () => {
      const { memoRenders } = renderAndRerender(3);

      expect(memoRenders).toBe(1);
    });

    it('should provide a new context value when the Rollbar prop changes', () => {
      class CustomRollbar extends Rollbar {}
      const rollbars = new Set<Rollbar>();
      const contextValues = new Set<ContextInterface>();

      const Consumer = () => {
        rollbars.add(useRollbar());
        contextValues.add(useContext(Context));
        return null;
      };

      const { rerender } = render(
        <Provider config={config}>
          <Consumer />
        </Provider>,
      );
      rerender(
        <Provider config={config} Rollbar={CustomRollbar}>
          <Consumer />
        </Provider>,
      );

      expect(contextValues.size).toBe(2);
      expect(rollbars.size).toBe(1);
    });
  });
});
