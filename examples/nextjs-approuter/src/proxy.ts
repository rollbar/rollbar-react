import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { serverInstance as rollbar } from '@/rollbar';

// Next.js 16 runs `proxy.ts` on the Node.js runtime, so `rollbar` resolves to
// its server build here and the server access token (`post_server_item`) is
// the right one to use. An Edge `middleware.ts` resolves the browser build
// instead, which the API rejects unless it is given a `post_client_item`
// token. See the README for details.
export function proxy(request: NextRequest) {
  try {
    if (request.nextUrl.pathname === '/proxy_error') {
      throw new Error('Something thrown in proxy.ts');
    }

    return NextResponse.next();
  } catch (error) {
    // Pass request details per call rather than calling `rollbar.configure()`,
    // which would change the shared instance for every concurrent request.
    rollbar.error(error as Error, { pathname: request.nextUrl.pathname });

    return new NextResponse('Error reported to Rollbar from proxy.ts', {
      status: 500,
    });
  }
}

export const config = {
  matcher: '/proxy_error',
};
