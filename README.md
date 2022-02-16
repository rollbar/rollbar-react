# Rollbar React SDK

React features to enhance using Rollbar.js in React Applications.

This SDK provides a wrapper around the base [Rollbar.js] SDK in order to provide an
SDK that matches the intention of how to build React Apps with a declarative API, features for the latest React API like
hooks and ErrorBoundaries, as well as simplify using Rollbar within a React SPA.

### In Beta

It is currently in a public Beta release right now as we push towards a 1.0 release that will have all of the features
we want to provide full capability for using React SDK in your production apps. We expect a 1.0 release to come in the
next month.

- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Install Rollbar SDK](#install-rollbar-sdk)
- [Usage and Reference](#usage-and-reference)
  - [Simplest Usage Possible](#simplest-usage-possible)
- [Components](#components)
  - [`Provider` Component](#provider-component)
  - [`ErrorBoundary` Component](#errorboundary-component)
  - [`RollbarContext` Component](#rollbarcontext-component)
- [Functions](#functions)
  - [`historyContext`](#historycontext)
- [Hooks](#hooks)
  - [`useRollbar` hook](#userollbar-hook)
  - [`useRollbarContext` hook](#userollbarcontext-hook)
  - [`useRollbarPerson` hook](#userollbarperson-hook)
  - [`useRollbarCaptureEvent` hook](#userollbarcaptureevent-hook)

## Setup Instructions

### Prerequisites

These instructions provide an addendum to the [Rollbar.js Setup Instructions].

After following those 2 steps, you will be ready.

### Install Rollbar React SDK

To install with `npm`:

```shell
npm install @rollbar/react rollbar
```

To install with `yarn`:

```shell
yarn add @rollbar/react rollbar
```

To install by adding to `package.json`, add the following to your project's
`package.json` file:

```json
  …
  "dependencies": {
    "@rollbar/react": "^0.8.0",
    "rollbar": "^2.24.0",
    …
  }
  …
```

then run either using `npm` or `yarn` (or other package manager):

```shell
npm install
# OR
yarn install
```

## Usage and Reference

The React SDK is very new and has not been given the full documentation treatment we expect to get from [Rollbar Docs],
but that will be coming shortly and a direct link will be put here for your reference.

In the meantime, the basic usage reference is available below.

### Simplest Usage Possible

To get you started quickly, here is an example that will get you started right away by providing the easiest and simplest
usage possible:

```javascript
import React from 'react';
import { Provider, ErrorBoundary } from '@rollbar/react'; // <-- Provider imports 'rollbar' for us

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

export default function App() {
  return (
    {/* Provider instantiates Rollbar client instance handling any uncaught errors or unhandled promises in the browser */}
    <Provider config={rollbarConfig}>
      {/* ErrorBoundary catches all React errors in the tree below and logs them to Rollbar */}
      <ErrorBoundary>
        // all other app providers and components - Rollbar will just work
        …
      </ErrorBoundary>
    </Provider>
  );
};
```

## Components

The following components are available as named imports from `@rollbar/react`.

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

The `ErrorBoundary` relies on the [`Provider`] above for the instance of Rollbar, so it will utilize
whatever configuration has been provided.

#### Simple Usage

You can add an `ErrorBoundary` component to the top of your tree right after the [`Provider`] with no additional props
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

It can accept a value that is a React Component

```javascript
import React from 'react';
import { Provider, ErrorBoundary, LEVEL_WARN } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

const ErrorDisplay = ({ error, resetError }) => ( // <-- props passed to fallbackUI component
  <div>
    <h1>A following error has occured:</h1>
    <p>{error.toString()}</p>
  </div>
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

Use the `RollbarContext` component to declaratively set the `context` value used by [Rollbar.js] when it's sending any
messages to [Rollbar].

This works for your `ErrorBoundary` from above or any other log or message sent to [Rollbar] while the `RollbarContext`
is mounted on the tree.

Like `ErrorBoundary` above, `RollbarContext` relies on a [`Provider`] for an instance of a [Rollbar.js] client.

#### Basic Usage

To use the `RollbarContext` you must provide the `context` prop, a `String` that is used to set the context used by
[Rollbar.js] to the value while mounted.

```javascript
import React from 'react';
import { RollbarContext } from '@rollbar/react';

function HomePage() {
  return (
    <RollbarContext context="home">
      …
    </RollbarContext>
  )
}
```

#### Using with React Router

It's useful to set the `context` in [Rollbar] associated with areas of your application. On the server it's usually
set when a specific page is requested. For SPAs like React Apps, using `RollbarContext` with your Router is one way
to achieve the same result.

Here is an example of using `RollbarContext` with [React Router] if you have a top level set of routes:

```javascript
import React from 'react';
import { Router, Switch, Route } from 'react-router-dom';
import { RollbarContext } from '@rollbar/react';
import { About, ContactDetails, ContactsList } from './pages';

const Routes = () => (
  <Router>
    <Switch>
      <Route path="/about">
        <RollbarContext context="/about">
          <About />
        </RollbarContext>
      </Route>
      <Route path="/contacts/:id">
        <RollbarContext context="contacts/details">
          <ContactDetails />
        </RollbarContext>
      </Route>
      <Route path="/contacts">
        <RollbarContext context="contacts">
          <ContactsList />
        </RollbarContext>
      </Route>
    </Switch>
  </Router>
)

export default Routes;
```

Here's another example of using `RollbarContext` within a component that manages its own route:

```javascript
import React from 'react';
import { Route } from 'react-router-dom';
import { RollbarContext } from '@rollbar/react';

export default function About(props) {
  return (
    <Route path="/about">
      <RollbarContext context="/about">
        …
      </RollbarContext>
    </Route>
  )
}
```

## Functions

The following functions are available as named imports from `@rollbar/react`.

### `historyContext` to create `history.listener`

A lot of SPAs and React Apps will use the [history] package to handle browser history. The
`historyContext` function is a helper that creates a valid listener function to receive
history changes and use those to change the [Rollbar.js] context.

`historyContext` is a factory function used to create a proper `history.listen` callback
that will work for v4 and v5 of the [history] package.

#### Basic `historyContext` usage

The `historyContext` factory function requires an instance of [Rollbar.js] to wrap in order
to create the listener callback function.

By default, if no options (see below) are provided, all history updates will update the `context` for [Rollbar] using the
`location.pathname` as the value.

```javascript
import Rollbar from 'rollbar';
import { createBrowserHistory } from 'history';
import { Provider } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

const rollbar = new Rollbar(rollbarConfig);

const history = createBrowserHistory();

history.listen(historyContext(rollbar));
```

#### Controlling `historyContext` behavior with options

The `historyContext` factory function accepts `options` as a 2nd argument that allow you to control the behavior
of how and when the `context` will be set for the [Rollbar.js] client.

Use the `formatter` option to provide a function that will receive the `history` change event and return a `String`
that you would like to be set as the `context` for [Rollbar].

The signature is `formatter(location, action): String` where `location` is [history.location] and `action` is [history.action].

The other option is `filter` which you can provide to tell the `historyContext` listener you create to control
which history updates will change the `context` for [Rollbar]. All truthy values will tell the listener to make
the change. Any falsy values will skip the update.

The signature is `filter(location, action): Boolean` where `location` is [history.location] and `action` is [history.action].

Here's an example of using both:

```javascript
import Rollbar from 'rollbar';
import { createBrowserHistory } from 'history';
import { Provider } from '@rollbar/react';

// same configuration you would create for the Rollbar.js SDK
const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

const rollbar = new Rollbar(rollbarConfig);

const ROUTE_PARAMS_RE = /\/\d+/g;

const historyListener = historyContext(rollbar, {
  // optional: default uses location.pathname
  formatter: (location, action) => location.pathname.replace(ROUTE_PARAMS_RE, ''),
  // optional: true return sets Rollbar context
  filter: (location, action) => !location.pathname.includes('admin'),
});
const unlisten = history.listen(historyListener);
```

## Hooks

The following hooks are available as named imports from `@rollbar/react` for use in [Functional Components] making use of the
[React Hooks API] introduced in React 16.8.

### Reliance on `Provider`

All of these hooks below require there to be a [`Provider`] in the React Tree as an ancestor to the component using the hook.

### `useRollbar` hook

To consume the [Rollbar.js] instance directly from the [`Provider`] in your React Tree and make use of the client API within
your [Functional Component], use the `useRollbar` hook which will return the instance from the currently scoped [React Context].

Here is a basic example:

```javascript
import { useRollbar } from '@rollbar/react';

function ContactDetails({ contactId }) {
  const rollbar = useRollbar(); // <-- must have parent Provider
  const [contact, setContact] = useState();

  useEffect(async () => {
    try {
      const { data } = await getContactFromApi(contactId);
      setContact(data.contact);
    } catch (error) {
      rollbar.error('Error fetching contact', error, { contactId });
    }
  }, [contactId]);

  return (
    <div>
      …
    </div>
  );
}
```

### `useRollbarContext` hook

As an alternative to the [`RollbarContext`] component, you can use the `useRollbarContext` hook in your [Functional Component]
to set the `context` in the [Rollbar.js] client provided by the [`Provider`] above in the React Tree.

Here's an example of using it in several components:

```javascript
// src/pages/HomePage.js
import { useRollbarContext } from '@rollbar/react';

function HomePage(props) {
  useRollbarContext('home#index');

  return (
    <div>
      …
    </div>
  );
}

// src/pages/UsersPage.js
import { useRollbarContext } from '@rollbar/react';
import UserTable from '../components/users/UserTable';

function UsersPage(props) {
  useRollbarContext('users#list');

  return (
    <UserTable data={props.users} />
  );
}

// src/pages/UserDetailsPage.js
import { useRollbarContext } from '@rollbar/react';
import UserDetails from '../components/users/UserDetails';

function UserDetailsPage(props) {
  useRollbarContext('users#details');

  return (
    <UserDetails user={props.user} />
  );
}
```

### `useRollbarPerson` hook

It's very usefull in [Rollbar] to log the identity of a person or user using your App for 2 major reasons:

1. It allows you to know exactly who has been affected by an item or error in your App
2. It allows [Rollbar] to tell you the impact a given item or error is having on your users

To make it convenient and easy to set the identity of a person in your React App, the `@rollbar/react` package
has the `userRollbarPerson` hook.

To use it, simply pass an `Object` that has keys and values used to identify an individual user of your App,
and for any future events or messages logged to [Rollbar] will include that person data attached to the log.

Here is a simple example of using it once the current user has been determined:

```javascript
import { useState } from 'react';
import { useRollbarPerson } from '@rollbar/react';
import LoggedInHome  from './LoggedInHome';
import LoggedOutHome from './LoggedOutHome';

function Home() {
  const [currentUser, setCurrentUser] = useState();
  useRollbarPerson(currentUser);

  useEffect(() => {
    (async () => {
      const user = await Auth.getCurrentUser();
      setCurrentUser(user);
    })()
  });

  if (currentUser != null) {
    return <LoggedInHome />;
  }

  return <LoggedOutHome />;
}
```

### `useRollbarCaptureEvent` hook

[Rollbar.js] already provides automated [Telemetry] with the default configuration `autoInstrument: true` in the client
which will capture useful telemetry events and data for you.

To provide more breadcrumbs useful for identifying the cause of an item or error, you can add your own capture events
that will be included in the [Telemetry] of an item in [Rollbar] with the `useRollbarCaptureEvent` hook.

The `useRollbarCaptureEvent` hook is designed to capture a new event in your [Functional Component] any time the
`metadata` or `level` you provide to the hook changes. On rerenders, no event is captured if there is not a change
to the references provided to those 2 arguments (utilizing the `dependencies` array arg underneath within the call to
the built-in React `useEffect` hook).

Here is an example of using `useRollbarCaptureEvent` in the render cycle of a [Functional Component] to send a telemetry
event related to the data that will be rendered in the component

```javascript
import { useEffect, useState } from 'react';
import { useRollbar, useRollbarCaptureEvent, LEVEL_INFO } from '@rollbar/react';

function BookDetails({ bookId }) {
  const rollbar = useRollbar(); // <-- must have ancestor Provider, same with useRollbarCaptureEvent
  const [book, setBook] = useState();

  useEffect(async () => {
    try {
      const { data } = await getBook(bookId);
      setBook(data.book);
    } catch (error) {
      rollbar.error('Error fetching book', error, { bookId }); // <-- use rollbar to log errors as normal
    }
  }, [bookId]);

  useRollbarCaptureEvent(book, LEVEL_INFO); // <-- only fires when book changes

  return (
    <div>
      …
    </div>
  )
}
```


[Rollbar]: https://rollbar.com
[Rollbar Docs]: https://docs.rollbar.com
[Rollbar.js]: https://github.com/rollbar/rollbar.js
[Rollbar.js Setup Instructions]: https://github.com/rollbar/rollbar.js/#setup-instructions
[React Native SDK]: https://github.com/rollbar/rollbar-react-native
[Telemetry]: https://docs.rollbar.com/docs/rollbarjs-telemetry
[`Provider`]: #provider-component
[`ErrorBoundary`]: #errorboundary-component
[`RollbarContext`]: #rollbarcontext-component
[Functional Components]: https://reactjs.org/docs/components-and-props.html#function-and-class-components
[React Context]: https://reactjs.org/docs/context.html
[Error Boundaries]: https://reactjs.org/docs/error-boundaries.html
[React Hooks API]: https://reactjs.org/docs/hooks-intro.html
[history]: https://www.npmjs.com/package/history
[history.location]: https://github.com/ReactTraining/history/blob/master/docs/api-reference.md#location
[history.action]: https://github.com/ReactTraining/history/blob/master/docs/api-reference.md#action
[1]: https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages#installing-a-package
