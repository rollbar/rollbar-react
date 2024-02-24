import React, { ReactNode, ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider, ProviderProps } from '../rollbar-react'

export const renderWithProviderProps = (
  ui: ReactElement,
  options: RenderOptions,
  providerProps: Omit<ProviderProps, 'children'>
) =>
  render(ui, {
    wrapper: (props: { children?: ReactNode }) => (
      <Provider {...{ children: props.children ?? <></> }} {...providerProps} />
    ),
    ...options,
  })
