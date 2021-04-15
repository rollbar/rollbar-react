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


### `RollbarContext` Component


### `historyContext` to create `history.listener`


### `useRollbar` hook


### `useRollbarContext` hook


### `useRollbarPerson` hook


### `useRollbarCaptureEvent` hook



[Rollbar.js]: https://github.com/rollbar/rollbar.js
[Rollbar.js Setup Instructions]: https://github.com/rollbar/rollbar.js/#setup-instructions
[Rollbar Docs]: https://docs.rollbar.com
[React Context]: https://reactjs.org/docs/context.html
[React Native SDK]: https://github.com/rollbar/rollbar-react-native
