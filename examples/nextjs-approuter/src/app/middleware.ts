import { serverInstance as rollbar } from '@/rollbar';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  rollbar.configure({ payload: { context: request.nextUrl.pathname } });

  return NextResponse.next();
}
