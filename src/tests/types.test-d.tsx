// Compile-time checks for index.d.ts, run by `npm run typecheck` rather than
// Jest. Every `@ts-expect-error` below must stay an error: if the typings
// loosen, tsc reports the directive as unused.
import React from 'react';
import Rollbar from 'rollbar';
import {
  ErrorBoundary,
  RollbarContext,
  historyContext,
  HistoryContextListener,
} from './rollbar-react';

declare const rollbar: Rollbar;

// The `listen` signatures of history v4 (@types/history 4.7) and history v5
// (bundled types), reduced to the parts historyContext has to fit.
declare const historyV4: {
  listen(
    listener: (
      location: {
        pathname: string;
        search: string;
        hash: string;
        state: unknown;
        key?: string;
      },
      action: 'PUSH' | 'POP' | 'REPLACE',
    ) => void,
  ): () => void;
};
declare enum V5Action {
  Pop = 'POP',
  Push = 'PUSH',
  Replace = 'REPLACE',
}
declare const historyV5: {
  listen(
    listener: (update: {
      action: V5Action;
      location: {
        pathname: string;
        search: string;
        hash: string;
        state: unknown;
        key: string;
      };
    }) => void,
  ): () => void;
};

// historyContext: options are optional, as documented in the README.
historyV4.listen(historyContext(rollbar));
historyV5.listen(historyContext(rollbar));

// formatter and filter receive a location object, not a string.
const listener: HistoryContextListener = historyContext(rollbar, {
  formatter: (location, action) => `${action} ${location.pathname}`,
  filter: (location) => !location.pathname.includes('admin'),
});
historyV4.listen(listener);
historyV5.listen(listener);

// @ts-expect-error formatter must return a string
historyContext(rollbar, { formatter: (location) => location });

// @ts-expect-error a bare pathname string is not a location
historyContext(rollbar, { filter: (location: string) => !!location });

// ErrorBoundary: fallbackUI is a component, not an element.
const Fallback = ({ resetError }: { resetError: () => void }) => (
  <button onClick={resetError}>retry</button>
);
export const withComponent = (
  <ErrorBoundary fallbackUI={Fallback}>
    <div />
  </ErrorBoundary>
);
export const withElement = (
  // @ts-expect-error an element is not a component
  <ErrorBoundary fallbackUI={<div />}>
    <div />
  </ErrorBoundary>
);

// RollbarContext: context is required, onRender is optional.
export const withContext = (
  <RollbarContext context="/page" onRender>
    <div />
  </RollbarContext>
);
export const withoutContext = (
  // @ts-expect-error context is required
  <RollbarContext>
    <div />
  </RollbarContext>
);
