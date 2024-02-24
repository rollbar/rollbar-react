import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from '../rollbar-react'

export const renderWithProviderProps = (
  ui: ReactElement,
  options: RenderOptions,
  providerProps: any
) => {
  return render(ui, {
    wrapper: (props) => <Provider {...props} {...providerProps} />,
    ...options,
  })
}
