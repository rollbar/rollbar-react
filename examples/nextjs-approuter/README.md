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

## Using Rollbar with the Next.js App Router

The first step to using Rollbar with the Next.js App Router is to configure your Rollbar instance.

```ts
// ./src/rollbar.ts
import Rollbar from 'rollbar';

const baseConfig = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
};

export const clientConfig = {
  accessToken: process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN,
  ...baseConfig,
};

export const serverInstance = new Rollbar({
  accessToken: process.env.ROLLBAR_SERVER_TOKEN,
  ...baseConfig,
});
```

We suggest you create a single instance for use server side, to be certain there are not more than one, and a config to use in your client side components. React Server Components limit you to passing simple objects as props from Server Components to Client Components. The config object can be used by the Rollbar Provider to construct your Rollbar instance.

Set `NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN` to a project access token with the `post_client_item` scope and `ROLLBAR_SERVER_TOKEN` to one with the `post_server_item` scope.

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

### Reporting errors from `proxy.ts` (formerly `middleware.ts`)

Use your server instance, and its `post_server_item` token, from [`proxy.ts`](./src/proxy.ts). Next.js 16 runs `proxy.ts` on the Node.js runtime, so `import Rollbar from 'rollbar'` resolves to Rollbar's server build there. Visit [/proxy_error](http://localhost:3000/proxy_error) to send an error from the proxy to Rollbar.

```ts
// ./src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { serverInstance as rollbar } from '@/rollbar';

export function proxy(request: NextRequest) {
  try {
    // ...
    return NextResponse.next();
  } catch (error) {
    rollbar.error(error as Error, { pathname: request.nextUrl.pathname });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

Pass request details as an argument to `rollbar.error()`, as above, rather than calling `rollbar.configure()` in the proxy. The server instance is shared by every request, so configuring it per request leaks one request's data into another's reports.

#### Edge runtime middleware

`middleware.ts` runs on the Edge runtime by default. On Edge, the bundler resolves `rollbar` to its browser build, which sends browser items. The API rejects a browser item sent with a server token, and the report fails with:

```
insufficient privileges: post_client_item scope is required but the access token only has post_server_item.
```

To report from middleware, do one of these:

- Upgrade to Next.js 16 and rename `middleware.ts` to `proxy.ts` (`npx @next/codemod@canary middleware-to-proxy .`).
- On Next.js 15.5 or later, run the middleware on the Node.js runtime with `export const config = { runtime: 'nodejs' };`. The server instance then works as shown above.
- If the middleware must stay on Edge, create a separate instance there with `new Rollbar(clientConfig)`, which uses the `post_client_item` token. That token is already public, so using it on Edge exposes nothing new.
