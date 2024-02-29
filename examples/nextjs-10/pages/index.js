import Link from 'next/link'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useEffect, useState } from 'react'
import { Provider, ErrorBoundary, useRollbar } from '@rollbar/react'

const rollbarConfig = {
  accessToken: '37f08875d00d474cbb34f7fe661878fa',
  endpoint: 'https://api.rollbar.com/api/1/item', //'https://api.rollbar.com/api/1/item', //'http://localhost:8000/api/1/item',
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
  console.log(rollbarConfig)
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary>
        <Home />
        <AnotherError />
      </ErrorBoundary>
    </Provider>
  );
}

function TestError() {
  const a = null
  return a.hello()
}

function AnotherError() {
  const rollbar = useRollbar()
  const [flag, setFlag] = useState(false)

  useEffect(() => {
    const a = null
    setFlag(true)
    a.hello()
  })

  return (<>{flag}</>)
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

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
