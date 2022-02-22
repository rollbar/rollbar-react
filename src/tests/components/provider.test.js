import React from 'react';
import { waitFor, screen } from '@testing-library/react';
import Rollbar from 'rollbar';
import { useRollbar } from '../../hooks/use-rollbar';
import { renderWithProviderProps } from '../utils/provider-util';

describe('Provider', () => {
  const accessToken = 'POST_CLIENT_ITEM_TOKEN';

  const config = {
    accessToken: accessToken,
    captureUncaught: true
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
  }

  const instance = new Rollbar(config);

  it('should provide a Rollbar instance, given a config', async () => {
    renderWithProviderProps(
      <TestComponent />,
      { providerProps: { config: config }}
    );

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });

  it('should provide a Rollbar instance, given a constructor', async () => {
    renderWithProviderProps(
      <TestComponent />,
      { providerProps: { Rollbar: Rollbar, config: config }}
    );

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });

  it('should provide a Rollbar instance, given the instance', async () => {
    renderWithProviderProps(
      <TestComponent />,
      { providerProps: { instance: instance }}
    );

    await waitFor(() => {
      screen.getByText(screenText);
    });

    expect(screen.getByText(accessToken)).toBeInTheDocument();
  });
});
