import { render, screen } from '@testing-library/react';

import Home from '@/pages/index';

describe('pages router home page', () => {
  it('renders the page shell', () => {
    render(<Home />);

    expect(screen.getByAltText('Next.js logo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Throw error' }),
    ).toBeInTheDocument();
  });
});
