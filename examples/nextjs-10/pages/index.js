import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import React, { useEffect, useState } from 'react';
import { Provider, ErrorBoundary, useRollbar } from '@rollbar/react';

const rollbarConfig = {
  accessToken: '...',
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: 'testenv',
    code_version: 'cf29e4a',
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: 'cf29e4a',
        guess_uncaught_frames: true,
      },
    },
    server: {
      root: 'webpack://_N_E/./pages/',
      branch: 'main',
    },
    person: {
      id: 1234,
      email: 'local@host.com',
      username: 'localuser',
    },
  },
};

export default function App() {
  console.log(rollbarConfig);
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary>
        <Home />
        <AnotherError />
      </ErrorBoundary>
    </Provider>
  );
}

function AnotherError() {
  const rollbar = useRollbar();
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    const a = null;

    setFlag(true);
    rollbar.info('flag set to true');

    a.crash();
  }, [rollbar]);

  return <>{flag}</>;
}

function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>
          Read <Link href="https://nextjs.org">Next.js!</Link>
        </h1>

        <p className={styles.description}>
          Get started by editing <code>pages/index.js</code>
        </p>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h3>Documentation &rarr;</h3>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h3>Learn &rarr;</h3>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/canary/examples"
            className={styles.card}
          >
            <h3>Examples &rarr;</h3>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
          >
            <h3>Deploy &rarr;</h3>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel" className={styles.logo} />
        </a>
      </footer>
    </div>
  );
}
