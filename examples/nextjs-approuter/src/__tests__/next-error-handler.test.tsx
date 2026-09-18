import { render, screen, fireEvent } from '@testing-library/react';
import { Provider as RollbarProvider } from '@rollbar/react';

import ErrorPage from '@/app/next_error_handler/error';
import { createFakeRollbar } from './fake-rollbar';

describe('app router next_error_handler', () => {
  let consoleLog: jest.SpyInstance;

  beforeEach(() => {
    // The example logs from the error component on every render.
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
  });

  it('reports the error through the provider and can reset', () => {
    const { spies, Rollbar } = createFakeRollbar();
    const error = new Error('handled by next');
    const reset = jest.fn();

    render(
      <RollbarProvider config={{ accessToken: 'test-token' }} Rollbar={Rollbar}>
        <ErrorPage error={error} reset={reset} />
      </RollbarProvider>,
    );

    expect(spies.error).toHaveBeenCalledWith(error);
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
