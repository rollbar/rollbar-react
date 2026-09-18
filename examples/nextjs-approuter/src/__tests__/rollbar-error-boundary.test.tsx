import { render, screen } from '@testing-library/react';
import { Provider as RollbarProvider } from '@rollbar/react';

import RollbarErrorBoundaryPage from '@/app/rollbar_error_boundary/page';
import { createFakeRollbar } from './fake-rollbar';

describe('app router rollbar_error_boundary', () => {
  it('renders the client component inside an ErrorBoundary', () => {
    const { Rollbar } = createFakeRollbar();

    render(
      <RollbarProvider config={{ accessToken: 'test-token' }} Rollbar={Rollbar}>
        <RollbarErrorBoundaryPage />
      </RollbarProvider>,
    );

    expect(
      screen.getByRole('button', {
        name: 'Click for Error with Rollbar Error Boundary',
      }),
    ).toBeInTheDocument();
  });
});
