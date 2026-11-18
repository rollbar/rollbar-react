/**
 * @jest-environment node
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import Rollbar from 'rollbar';
import { Provider, useRollbarContext } from '../rollbar-react';

describe('useRollbarContext on the server', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it.each([false, true])(
    'renders without the useLayoutEffect warning (isLayout: %s)',
    (isLayout) => {
      const rollbar = new Rollbar({
        accessToken: 'POST_SERVER_ITEM_TOKEN',
        enabled: false,
      });
      const Page = () => {
        useRollbarContext('home', isLayout);
        return null;
      };

      renderToString(
        <Provider instance={rollbar}>
          <Page />
        </Provider>,
      );
      expect(consoleError).not.toHaveBeenCalled();
    },
  );
});
