# Rollbar - React 17 example

This project shows an example of how to add Rollbar to a React 17 application
built with [Vite](https://vite.dev/). The interactive playground demonstrates:

- informational messages
- captured errors with stack traces
- occurrences enriched with custom data
- React ErrorBoundary reporting and recovery
- privacy-aware Session Replay, triggered manually or by an error

Session Replay uses the replay-enabled Rollbar.js bundle from `rollbar/replay`.
It requires a `.env` file to be set with a `VITE_PUBLIC_ROLLBAR_TOKEN` variable:

```sh
VITE_PUBLIC_ROLLBAR_TOKEN=POST_CLIENT_ITEM_ACCESS_TOKEN
```

Vite only exposes variables prefixed with `VITE_` to client code, through
`import.meta.env`. Use a `post_client_item` token here, since it ends up in the
browser bundle.

The important files are `src/index.jsx` and `src/App.jsx`.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.

### `npm test`

Runs the tests with [Vitest](https://vitest.dev/) in watch mode.
`npm run test:ci` runs them once.

### `npm run build`

Builds the app for production to the `build` folder.
`npm run preview` serves that build locally.
