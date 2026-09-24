# Typescript App Example

This project demonstrates @rollbar/react in a basic Typescript app.

## Rollbar usage in this example

- Provider component
- ErrorBoundary
- Usage from class components
- Hooks
  - useRollbar
  - useRollbarContext

## Rollbar configuration

To send live reports to Rollbar, replace `POST_CLIENT_ITEM_TOKEN` in App.tsx
with your valid client token before building the app.

## Documentation

For complete documentation see https://docs.rollbar.com/docs/react
and https://docs.rollbar.com/docs/react-ts.

## Available Scripts

This project is built with [Vite](https://vite.dev/). In the project directory,
you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

### `npm test`

Runs the tests with [Vitest](https://vitest.dev/) in watch mode.
`npm run test:ci` runs them once.

### `npm run build`

Type-checks the project with `tsc`, then builds the app for production to the
`build` folder. `npm run preview` serves that build locally.
