This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Using Rollbar with the Next.js App Router

The first step to using Rollbar with the Next.js App Router is to configure your Rollbar instance.

```
// ./src/rollbar.ts
import Rollbar from 'rollbar';

const baseConfig = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
};

export const clientConfig = {
  accessToken: process.env.NEXT_PUBLIC_POST_CLIENT_ITEM_TOKEN,
  ...baseConfig,
};

export const serverInstance = new Rollbar({
  accessToken: process.env.POST_SERVER_ITEM_TOKEN,
  ...baseConfig,
});
```

We suggest you create a single instance for use server side, to be certain there are not more than one, and a config to use in your client side components. React Server Components limit you to passing simple objects as props from Server Components to Client Components. The config object can be used by the Rollbar Provider to construct your Rollbar instance.

### Configuring the Rollbar Provider

To be able to use the hooks consistently through your application. It is easiest if you configure your Rollbar Provider within your root layout.

**_Note:_** The Rollbar Provider uses a React Context. This context, like hooks are only available for use in your client components.

### Configuring the global-error handler

To be certain that you are catching all errors within your application, you will want to [configure a `global-error.js/tsx`](./src/app/global-error.tsx). This handler will catch errors, including from your root layout and relay then to Rollbar.

### Using the Next.js route error handler (Recommended)

Next.js provides an [error handler]() this handler will automatically wrap your router, at the desired level, within an [Error Boundary](). It is recommended to [use your Rollbar instance within this error handler](./src/app//next_error_handler/error.tsx) to report errors to Rollbar.

### Using the Rollbar ErrorBoundary

The `<ErrorBoundary>` component provided by this library [may still be used](./src/app/rollbar_error_boundary/page.tsx) if you would prefer that over the built in Next.js error handler

#### Special note on Error boundaries

The ErrorBoundary class is not perfect at catching and stopping the propagation of all errors. Be aware, that if you turn on `captureUncaught` or `captureUnhandledRejections` in your Rollbar config you may receive doubled occurrences.
