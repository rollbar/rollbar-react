import Rollbar from 'rollbar';
import { historyContext } from './rollbar-react';

describe('historyContext', () => {
  const accessToken = 'POST_CLIENT_ITEM_TOKEN';

  it('accepts a Rollbar instance', () => {
    const rollbar = new Rollbar({ accessToken });

    expect(() => historyContext(rollbar)).not.toThrow();
  });

  it('accepts an instance from another copy of the Rollbar class', () => {
    // Stands in for an instance created through rollbar's other entry point.
    const rollbar = { configure: jest.fn() } as unknown as Rollbar;

    expect(rollbar).not.toBeInstanceOf(Rollbar);
    expect(() => historyContext(rollbar)).not.toThrow();
  });

  it.each([undefined, null, {}, { configure: 'not a function' }])(
    'rejects %p',
    (rollbar) => {
      expect(() => historyContext(rollbar as unknown as Rollbar)).toThrow(
        'historyContext must have an instance of Rollbar',
      );
    },
  );

  it('sets the context from history v4 and v5 listener calls', () => {
    const rollbar = new Rollbar({ accessToken });
    const configure = jest.spyOn(rollbar, 'configure');
    const listener = historyContext(rollbar);

    listener({ pathname: '/v4', search: '', hash: '' }, 'PUSH');
    expect(configure).toHaveBeenLastCalledWith({
      payload: { context: '/v4' },
    });

    listener({
      location: { pathname: '/v5', search: '', hash: '' },
      action: 'PUSH',
    });
    expect(configure).toHaveBeenLastCalledWith({
      payload: { context: '/v5' },
    });
  });
});
