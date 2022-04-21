import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Rollbar = require('rollbar');
import {
  ErrorBoundary, ErrorBoundaryProps, useRollbar
} from '../rollbar-react';
import { renderWithProviderProps } from '../utils/provider-util';

describe('ErrorBoundary', () => {
  const accessToken = 'POST_CLIENT_ITEM_TOKEN';

  const config: Rollbar.Configuration = {
    accessToken: accessToken,
    captureUncaught: true
  };

  let rollbar: Rollbar;
  const error: Error = new Error('Test');
  const ThrowError = () => {
    throw error;
  };
  const fallbackMessage = 'Test fallback';
  const errorMessage = 'Test error';
  const extra = { foo: 'bar' };
  const level = 'warn';
  const callback: Rollbar.Callback = (_err, _resp) => 'foo'
  const Fallback = () => <div>{fallbackMessage}</div>
  const TestComponent = (props: Omit<ErrorBoundaryProps, 'children'>) => {
    rollbar = useRollbar();
    rollbar.warn = jest
      .fn()
      .mockReturnValue({})
      .mockName('Rollbar.warn');

    return (
      <ErrorBoundary {...props}>
        <ThrowError />
      </ErrorBoundary>
    );
  };

  it('should display the fallback UI and send rollbar on error', () => {
    renderWithProviderProps(
      <TestComponent
        fallbackUI={Fallback}
        errorMessage={errorMessage}
        extra={extra}
        level={level}
        callback={callback}
      />,
      {},
      {config: config}
    );

    expect(screen.getByText(fallbackMessage)).toBeInTheDocument();

    expect(rollbar.warn).toHaveBeenLastCalledWith(
      errorMessage, error, expect.objectContaining(extra), callback
    );
  });

  describe('with extra prop as a fn', () => {
    it('should send extra value to rollbar on error', () => {
      const extraFn: ErrorBoundaryProps['extra'] = (error, errorInfo) => {
        expect(error).toBeInstanceOf(Error)
        expect(errorInfo).toHaveProperty('componentStack')
        return extra;
      };
  
      renderWithProviderProps(
        <TestComponent
          fallbackUI={Fallback}
          errorMessage={errorMessage}
          extra={extraFn}
          level={level}
          callback={callback}
        />,
        {},
        {config: config}
      );
  
      expect(rollbar.warn).toHaveBeenLastCalledWith(
        errorMessage, error, expect.objectContaining(extra), callback
      );
    });
  });
});
