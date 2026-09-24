import { render, screen } from '@testing-library/react';
import Rollbar from 'rollbar';
import { expect, test, vi } from 'vitest';
import App from './App';

test('renders the example and reports from the class component', () => {
  // ExampleClass logs on mount; keep it from reaching the Rollbar API.
  const info = vi
    .spyOn(Rollbar.prototype, 'info')
    .mockReturnValue({ uuid: '' });

  render(<App />);

  expect(screen.getByText('Rollbar React Example')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  expect(screen.getByText('Class component')).toBeInTheDocument();
  expect(info).toHaveBeenCalledWith('message from class component');
});
