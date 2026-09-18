import type { AppProps } from 'next/app';
import { render, screen } from '@testing-library/react';
import Rollbar from 'rollbar';
import { useRollbar } from '@rollbar/react';

import App from '@/pages/_app';

// `_app` builds its own Rollbar instance from `clientConfig`, so the module is
// mocked to keep the tests offline.
jest.mock('rollbar');

function renderApp(Component: AppProps['Component']) {
  return render(
    <App
      Component={Component}
      pageProps={{}}
      router={{} as AppProps['router']}
    />,
  );
}

describe('pages router _app', () => {
  let consoleError: jest.SpyInstance;
  let consoleLog: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // React logs the caught error, and the example logs from its callback.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleLog.mockRestore();
  });

  it('renders the page with a Rollbar instance available from context', () => {
    let rollbar: Rollbar | undefined;

    const Page = () => {
      rollbar = useRollbar();
      return <p>page content</p>;
    };

    renderApp(Page);

    expect(screen.getByText('page content')).toBeInTheDocument();
    expect(rollbar).toBeDefined();
  });

  it('renders the fallback UI and reports to Rollbar when the page throws', () => {
    const error = new Error('boom');
    const critical = jest.fn();

    const Page = () => {
      const rollbar = useRollbar();
      rollbar.critical = critical;
      throw error;
    };

    renderApp(Page);

    expect(screen.getByText('Oops, there was an error.')).toBeInTheDocument();
    expect(critical).toHaveBeenCalledWith(
      'example error boundary message',
      error,
      expect.objectContaining({ more: 'data' }),
      expect.any(Function),
    );
  });
});
