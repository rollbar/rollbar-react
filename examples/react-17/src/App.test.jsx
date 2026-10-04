import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import App from './App';

describe('React 17 Rollbar playground', () => {
  test('renders the interactive Rollbar demos', () => {
    window.history.pushState(null, '', '/');
    render(<App />);

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
    window.history.pushState(null, '', '/error-boundary');
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Crash safely.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trigger render error/i }),
    ).toBeInTheDocument();
  });

  test('switches pages from the header navigation', () => {
    window.history.pushState(null, '', '/');
    render(<App />);

    fireEvent.click(screen.getByRole('link', { name: 'Error boundary' }));

    expect(window.location.pathname).toBe('/error-boundary');
    expect(
      screen.getByRole('heading', { name: 'Crash safely.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Error boundary' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
