import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import App from './App';

describe('React 17 Rollbar playground', () => {
  test('renders the interactive Rollbar demos', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'See what Rollbar captures.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Send a message' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Capture a stack trace' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Attach custom data' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Collect a session replay' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Recording · 60s lookback')).toBeInTheDocument();
  });

  test('renders the ErrorBoundary demonstration route', () => {
    render(
      <MemoryRouter initialEntries={['/error-boundary']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Crash safely.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trigger render error/i }),
    ).toBeInTheDocument();
  });
});
