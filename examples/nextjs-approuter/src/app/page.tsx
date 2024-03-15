import * as fs from 'fs';
import { Code } from '@/components/Code';
import Link from 'next/link';

const code = fs.readFileSync('./src/rollbar.ts', 'utf-8');

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-start p-24 space-y-8">
      <header>
        <h1 className="mb-4 text-4xl font-extrabold leading-none">
          Rollbar: Next.js App Router Example
        </h1>
      </header>
      <p>
        Using Rollbar with the Next.js App Router is quick and easy to
        implement. The first step for any integration will be creating your own
        Rollbar instance. This can be done as follows:
      </p>
      <Code code={code} />
      <p>
        This will create a rollbar instance that you can use to capture your
        errors. It can be used within the{' '}
        <Link href="/next_error_handler">Next.JS App Router error handler</Link>{' '}
        or using the{' '}
        <Link href="/rollbar_error_boundary">
          {`<ErrorBoundary`} from the @rollbar/react package
        </Link>{' '}
        . It can also be used server side within Next.js middleware
      </p>
    </main>
  );
}
