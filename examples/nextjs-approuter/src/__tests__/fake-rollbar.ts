import type { ProviderProps } from '@rollbar/react';

export interface RollbarSpies {
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  critical: jest.Mock;
}

/**
 * A stand-in for the Rollbar constructor so tests never build a real client or
 * touch the network. Pass it to `Provider` via its `Rollbar` prop.
 */
export function createFakeRollbar(): {
  spies: RollbarSpies;
  Rollbar: ProviderProps['Rollbar'];
} {
  const spies: RollbarSpies = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    critical: jest.fn(),
  };

  class FakeRollbar {
    options = { accessToken: 'test-token' };
    debug = spies.debug;
    info = spies.info;
    warn = spies.warn;
    error = spies.error;
    critical = spies.critical;
  }

  return {
    spies,
    Rollbar: FakeRollbar as unknown as ProviderProps['Rollbar'],
  };
}
