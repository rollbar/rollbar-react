import { rollbarInstance } from '@/rollbar';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  rollbarInstance.configure({ payload: { context: request.nextUrl.pathname } });

  return NextResponse.next();
}
