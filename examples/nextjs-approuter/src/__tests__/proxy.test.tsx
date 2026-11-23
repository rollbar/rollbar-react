/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { proxy } from '../proxy';
import { serverInstance } from '../rollbar';

jest.mock('../rollbar', () => ({
  serverInstance: { error: jest.fn(), configure: jest.fn() },
}));

describe('app router proxy', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports errors with the server instance and per-call request data', async () => {
    const response = proxy(
      new NextRequest('http://localhost:3000/proxy_error'),
    );

    expect(serverInstance.error).toHaveBeenCalledTimes(1);
    const [error, custom] = (serverInstance.error as jest.Mock).mock.calls[0];
    expect(error).toEqual(new Error('Something thrown in proxy.ts'));
    expect(custom).toEqual({ pathname: '/proxy_error' });
    expect(serverInstance.configure).not.toHaveBeenCalled();

    expect(response.status).toBe(500);
    expect(await response.text()).toBe(
      'Error reported to Rollbar from proxy.ts',
    );
  });

  it('passes other requests through without reporting', () => {
    const response = proxy(new NextRequest('http://localhost:3000/'));

    expect(serverInstance.error).not.toHaveBeenCalled();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
