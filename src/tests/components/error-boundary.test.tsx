import React from 'react';
import { screen, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Rollbar from 'rollbar';
import { ErrorBoundary, ErrorBoundaryProps } from '../rollbar-react';

describe('ErrorBoundary', () => {
  const accessToken = 'POST_CLIENT_ITEM_TOKEN';

  const rollbar: Rollbar = new Rollbar({
    accessToken: accessToken,
    captureUncaught: true,
  });
  rollbar.warn = jest.fn();
  const error: Error = new Error('Test');
  const ThrowError = () => {
    throw error;
  };
  const fallbackMessage = 'Test fallback';
  const errorMessage = 'Test error';
  const extra = { foo: 'bar' };
  const level = 'warn';
  const callback: Rollbar.Callback = (_err, _resp) => 'foo';
  const Fallback = () => <div>{fallbackMessage}</div>;
  const TestComponent = (props: Omit<ErrorBoundaryProps, 'children'>) => {
    return (
      <ErrorBoundary {...props}>
        <ThrowError />
      </ErrorBoundary>
    );
  };

  it('should display the fallback UI and send rollbar on error', () => {
    render(
      <TestComponent
        fallbackUI={Fallback}
        errorMessage={errorMessage}
        extra={extra}
        level={level}
        callback={callback}
        rollbar={rollbar}
      />,
      {},
    );

    expect(screen.getByText(fallbackMessage)).toBeInTheDocument();

    expect(rollbar.warn).toHaveBeenLastCalledWith(
      errorMessage,
      error,
      expect.objectContaining(extra),
      callback,
    );
  });

  describe('with extra prop as a fn', () => {
    it('should send extra value to rollbar on error', () => {
      const extraFn: ErrorBoundaryProps['extra'] = (error, errorInfo) => {
        expect(error).toBeInstanceOf(Error);
        expect(errorInfo).toHaveProperty('componentStack');
        return extra;
      };

      render(
        <TestComponent
          fallbackUI={Fallback}
          errorMessage={errorMessage}
          extra={extraFn}
          level={level}
          callback={callback}
          rollbar={rollbar}
        />,
        {},
      );

      expect(rollbar.warn).toHaveBeenLastCalledWith(
        errorMessage,
        error,
        expect.objectContaining(extra),
        callback,
      );
    });
  });
});
