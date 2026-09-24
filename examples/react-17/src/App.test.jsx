import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import App from './App';

test('renders the example routes', () => {
  render(
    <MemoryRouter initialEntries={['/a']}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole('link', { name: 'A' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'B' })).toBeInTheDocument();
  expect(screen.getByText('Message: Hello, example!')).toBeInTheDocument();
});
