import React, { Context as ReactContext, ReactNode } from 'react';
import { waitFor, screen } from '@testing-library/react';
import Rollbar = require('rollbar');
import {
  Context,
  ContextInterface,
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

  class TestClassConponent extends React.Component {
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
    renderWithProviderProps(<TestClassConponent />, {}, { config: config });

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });
});
