import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from '../../provider';

export const renderWithProviderProps = (ui, options) => {
  return render(
    ui,
    {
      wrapper: props => <Provider {...props} {...options.providerProps} />,
      ...options
    }
  );
}
