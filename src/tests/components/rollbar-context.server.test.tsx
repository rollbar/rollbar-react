/**
 * @jest-environment node
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import Rollbar from 'rollbar';
import { Provider, useRollbarContext } from '../rollbar-react';

describe('useRollbarContext on the server', () => {
  it('renders without the useLayoutEffect warning', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const rollbar = new Rollbar({
      accessToken: 'POST_SERVER_ITEM_TOKEN',
      enabled: false,
    });
    const Page = () => {
      useRollbarContext('home');
      return null;
    };

    renderToString(
      <Provider instance={rollbar}>
        <Page />
      </Provider>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
