# Rollbar React SDK

React features to enhance using Rollbar.js in React Applications.

This SDK provides a wrapper around the base [Rollbar.js] SDK in order to provide an
SDK that matches the intention of how to build React Apps with a declarative API, features for the latest React API like
hooks and ErrorBoundaries, as well as simplify using Rollbar within a React SPA.

### In Beta

It is currently in a public Beta release right now as we push towards a 1.0 release that will have all of the features
we want to provide full capability for using React SDK in your production apps. We expect a 1.0 release to come in the
next month.

## Setup Instructions

### Prerequisites

These instructions provide an addendum to the [Rollbar.js Setup Instructions].

After following those 2 steps, you will be ready.

### Install Rollbar React SDK

We are hosting our `@rollbar` scoped packages in Github Packages. In order to use this you will need to follow the
instructions for [Installing a Package from Github Packages](https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages#installing-a-package)

In the same directory as your `package.json` file, add a `.npmrc` file with the following:

```
@rollbar:registry=https://npm.pkg.github.com
```

To install with `npm`:

```shell
npm install @rollbar/react
```

To install with `yarn`:

```shell
yarn add @rollbar/react
```

## Usage and Reference

The React SDK is very new and has not been given the full documentation treatment we expect to get from [Rollbar Docs],
but that will be coming shortly and a direct link will be put here for your reference.

In the meantime, the basic usage reference is available below.

### `Provider` Component

The `Provider` component is used to wrap your React App so an instance of Rollbar will be made available within your React tree.

This is a common pattern in React using a custom [React Context] that is available to the
`Components` and `hooks` from this SDK library.

#### Configuration Only Usage

The simplest way to use the `Provider` is to provide a configuration as the `config` prop which will instantiate an
instance of Rollbar for you and provide that to its child tree:

```javascript
import React from 'react';
import { Provider } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

export function App(props) {
  return (
    <Provider config={rollbarConfig}>
      …
    </Provider>
  );
}
```

#### Instance Usage

Sometimes you may need to instantiate an instance of Rollbar before adding it to your App tree. In that case use the
`instance` prop to pass it to the `Provider` like this:

```javascript
import React from 'react';
import Rollbar from 'rollbar';
import { Provider } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

const rollbar = new Rollbar(rollbarConfig);

export function App(props) {
  return (
    <Provider instance={rollbar}>
      …
    </Provider>
  );
}
```

This method will also work with the global Rollbar instance when using the `Rollbar.init(…)` method.

#### React Native Usage

Rollbar provides a [React Native SDK] which also wraps the [Rollbar.js] to provide React Native capabilities based on
that specific environment.

To use the Rollbar React SDK with the [React Native SDK], pass the instance that it generates to the `Provider`'s
`instance` prop, like this:

```javascript
import React from 'react';
import { Client } from 'rollbar-react-native';
import { Provider } from '@rollbar/react';

const rollbarClient = new Client('POST_CLIENT_ITEM_ACCESS_TOKEN');

export function App(props) {
  return (
    <Provider instance={rollbarClient.rollbar}>
      …
    </Provider>
  );
}
```

### `ErrorBoundary` Component

Rollbar's React SDK provides a new `ErrorBoundary` component which implements the interface for React's [Error Boundaries]
introduced in React 16.

The `ErrorBoundary` is used to wrap any tree or subtree in your React App to catch React Errors and log them to Rollbar
automatically.

The `ErrorBoundary` relies on the [`Provider`](#provider-component) above for the instance of Rollbar, so it will utilize
whatever configuration has been provided.

#### Simple Usage

You can add an `ErrorBoundary` component to the top of your tree right after the `Provider` with no additional props
and it will just work:

```javascript
import React from 'react';
import { Provider, ErrorBoundary } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

export function App(props) {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary>
        …
      </ErrorBoundary>
    </Provider>
  );
}
```

#### Pass `prop`s to control behavior

The `ErrorBoundary` provides several `prop`s that allow customizing the behavior of how it will report errors to
[Rollbar].

These `prop`s take either a value or a function that will be invoked with the `error` and `info` from the [Error Boundaries]
API's `componentDidCatch` method (i.e. signature is `(error, info)`).

```javascript
import React from 'react';
import { Provider, ErrorBoundary, LEVEL_WARN } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

export function App(props) {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary level={LEVEL_WARN} errorMessage="Error in React render" extra={(error, info) => info.componentStack.includes('Experimental') ? { experiment: true } : {} }>
        …
      </ErrorBoundary>
    </Provider>
  );
}
```

#### Pass a Fallback UI

You may also include a Fallback UI to render when the error occurs so that the User does not experience a broken/blank
UI caused during the render cycle of React.

Like the other `prop`s it can accept a value that is a React Component or a function that returns a React Component with
the same signature `(error, info)`.

```javascript
import React from 'react';
import { Provider, ErrorBoundary, LEVEL_WARN } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

const ErrorDisplay = ({ error, resetError }) => ( // <-- props passed to fallbackUI component
  <div>…</div>
);

export function App(props) {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary level={LEVEL_WARN} fallbackUI={ErrorDisplay}>
        …
      </ErrorBoundary>
    </Provider>
  );
}
```

### `RollbarContext` Component


### `historyContext` to create `history.listener`


### `useRollbar` hook


### `useRollbarContext` hook


### `useRollbarPerson` hook


### `useRollbarCaptureEvent` hook



[Rollbar]: https://rollbar.com
[Rollbar Docs]: https://docs.rollbar.com
[Rollbar.js]: https://github.com/rollbar/rollbar.js
[Rollbar.js Setup Instructions]: https://github.com/rollbar/rollbar.js/#setup-instructions
[React Native SDK]: https://github.com/rollbar/rollbar-react-native
[React Context]: https://reactjs.org/docs/context.html
[Error Boundaries]: https://reactjs.org/docs/error-boundaries.html
