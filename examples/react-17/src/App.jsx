import { useMemo, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import {
  Provider as RollbarProvider,
  ErrorBoundary,
  RollbarContext,
  useRollbar,
} from '@rollbar/react';
// Keep this after @rollbar/react: the replay build adds the replay component to
// the shared Rollbar constructor after the React package loads the standard build.
import Rollbar from 'rollbar/replay';

import './App.css';

const accessToken = import.meta.env.VITE_PUBLIC_ROLLBAR_TOKEN;

const rollbarConfig = {
  accessToken,
  hostSafeList: ['localhost:3000', '127.0.0.1:3000'],
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: 'development',
    client: {
      javascript: {
        code_version: 'react-17-vite-example',
        source_map_enabled: true,
      },
    },
  },
  replay: {
    enabled: true,
    autoStart: true,
    triggerDefaults: {
      samplingRatio: 1,
      preDuration: 60,
      postDuration: 5,
    },
    triggers: [
      {
        type: 'occurrence',
        level: ['error', 'critical'],
      },
      {
        type: 'direct',
        tags: ['playground'],
      },
    ],
    maskInputOptions: {
      password: true,
      email: true,
    },
  },
};

const features = [
  ['Messages', 'info'],
  ['Stack traces', 'error'],
  ['Custom data', 'warning'],
  ['Session replay', 'replay'],
];

function App() {
  const [activity, setActivity] = useState([]);

  const addActivity = (event) => {
    setActivity((current) =>
      [
        {
          id: `${Date.now()}-${event.kind}`,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          ...event,
        },
        ...current,
      ].slice(0, 4),
    );
  };

  return (
    <RollbarProvider Rollbar={Rollbar} config={rollbarConfig}>
      <div className="app-shell">
        <Header hasAccessToken={Boolean(accessToken)} />
        <main>
          <Routes>
            <Route path="/" element={<Playground onActivity={addActivity} />} />
            <Route
              path="/error-boundary"
              element={<ErrorBoundaryDemo onActivity={addActivity} />}
            />
            <Route path="*" element={<Playground onActivity={addActivity} />} />
          </Routes>
        </main>
        <ActivityPanel activity={activity} />
        <Footer />
      </div>
    </RollbarProvider>
  );
}

export default App;

function Header({ hasAccessToken }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink className="brand" to="/" aria-label="Rollbar React home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Rollbar</strong>
            <small>React playground</small>
          </span>
        </NavLink>

        <nav className="primary-nav" aria-label="Example navigation">
          <NavLink end to="/">
            Playground
          </NavLink>
          <NavLink to="/error-boundary">Error boundary</NavLink>
        </nav>

        <div
          className={`connection-status ${hasAccessToken ? '' : 'is-warning'}`}
        >
          <span aria-hidden="true" />
          {hasAccessToken ? 'SDK connected' : 'Token required'}
        </div>
      </div>
    </header>
  );
}

function Playground({ onActivity }) {
  return (
    <RollbarContext context="react-17-playground">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">React 17 · Vite · Rollbar.js</p>
          <h1>See what Rollbar captures.</h1>
          <p className="hero-description">
            Generate real telemetry, inspect richer occurrences, and attach a
            replay of the moments that led to an error.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#demo-grid">
              Try the demos <span aria-hidden="true">↓</span>
            </a>
            <a
              className="text-link"
              href="https://docs.rollbar.com/docs/react"
              target="_blank"
              rel="noreferrer"
            >
              Read the React docs <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="hero-console" aria-label="Rollbar event preview">
          <div className="console-toolbar">
            <span />
            <span />
            <span />
            <small>occurrence.json</small>
          </div>
          <pre>
            <code>
              <span className="code-muted">{'{'}</span>
              {'\n  '}
              <span className="code-key">level</span>:{' '}
              <span className="code-string">&quot;error&quot;</span>,{'\n  '}
              <span className="code-key">framework</span>:{' '}
              <span className="code-string">&quot;react&quot;</span>,{'\n  '}
              <span className="code-key">context</span>:{' '}
              <span className="code-string">&quot;checkout&quot;</span>,{'\n  '}
              <span className="code-key">replay</span>:{' '}
              <span className="code-value">attached</span>
              {'\n'}
              <span className="code-muted">{'}'}</span>
            </code>
          </pre>
          <div className="console-footer">
            <span className="pulse-dot" /> Recording the last 60 seconds
          </div>
        </div>
      </section>

      <section className="feature-strip" aria-label="Features in this example">
        {features.map(([label, level], index) => (
          <div key={label}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{label}</strong>
            <small>{level}</small>
          </div>
        ))}
      </section>

      {!accessToken && <TokenNotice />}

      <section className="demo-section" id="demo-grid">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow-dark">Interactive examples</p>
            <h2>Send something useful</h2>
          </div>
          <p>
            Each action creates a real event in your configured Rollbar project.
          </p>
        </div>

        <div className="demo-grid">
          <MessageDemo onActivity={onActivity} />
          <StackTraceDemo onActivity={onActivity} />
          <CustomDataDemo onActivity={onActivity} />
          <ReplayDemo onActivity={onActivity} />
        </div>
      </section>
    </RollbarContext>
  );
}

function TokenNotice() {
  return (
    <aside className="token-notice" role="status">
      <span className="notice-icon" aria-hidden="true">
        !
      </span>
      <div>
        <strong>Add a client token to send these events</strong>
        <p>
          Create <code>examples/react-17/.env.local</code> with{' '}
          <code>VITE_PUBLIC_ROLLBAR_TOKEN=your_post_client_item_token</code>,
          then restart Vite.
        </p>
      </div>
    </aside>
  );
}

function DemoCard({ number, label, title, description, tone, children }) {
  return (
    <article className={`demo-card tone-${tone}`}>
      <div className="card-heading">
        <span className="card-number">{number}</span>
        <span className="level-pill">{label}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="card-body">{children}</div>
    </article>
  );
}

function ActionRow({ children, status }) {
  return (
    <div className="action-row">
      {children}
      <ActionFeedback status={status} />
    </div>
  );
}

function ActionFeedback({ status }) {
  if (!status) {
    return null;
  }

  return (
    <span
      className={`action-feedback is-${status.state}`}
      role="status"
      aria-live="polite"
    >
      <span className="feedback-icon" aria-hidden="true">
        {status.state === 'sending'
          ? '…'
          : status.state === 'success'
            ? '✓'
            : '!'}
      </span>
      {status.message}
    </span>
  );
}

function deliveryCallback({
  failureMessage,
  onFailure,
  onSuccess,
  successMessage,
}) {
  return (error, response) => {
    if (!deliverySucceeded(error, response)) {
      onFailure({
        state: 'error',
        message: failureMessage,
      });
      return;
    }

    onSuccess({
      state: 'success',
      message: successMessage,
    });
  };
}

function deliverySucceeded(error, response) {
  return !error && Boolean(response) && !response.err;
}

function MessageDemo({ onActivity }) {
  const rollbar = useRollbar();
  const [message, setMessage] = useState('Release completed successfully');
  const [status, setStatus] = useState(null);

  const sendMessage = () => {
    setStatus({ state: 'sending', message: 'Sending…' });
    const result = rollbar.info(
      message,
      {
        demo: 'message',
        source: 'react-17-playground',
      },
      deliveryCallback({
        failureMessage: 'Message not sent',
        onFailure: setStatus,
        onSuccess: (nextStatus) => {
          setStatus(nextStatus);
          onActivity({
            kind: 'info',
            title: 'Message sent',
            detail: message,
            uuid: result.uuid,
          });
        },
        successMessage: 'Message sent',
      }),
    );
  };

  return (
    <DemoCard
      number="01"
      label="Info"
      title="Send a message"
      description="Log an informational event with a searchable message and context."
      tone="blue"
    >
      <label className="field-label" htmlFor="message">
        Event message
      </label>
      <input
        id="message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <ActionRow status={status}>
        <button
          className="button button-primary"
          disabled={
            !accessToken || !message.trim() || status?.state === 'sending'
          }
          onClick={sendMessage}
        >
          Send info message <span aria-hidden="true">→</span>
        </button>
      </ActionRow>
    </DemoCard>
  );
}

function StackTraceDemo({ onActivity }) {
  const rollbar = useRollbar();
  const [status, setStatus] = useState(null);

  const sendStackTrace = () => {
    setStatus({ state: 'sending', message: 'Sending…' });
    try {
      submitCheckout();
    } catch (error) {
      const result = rollbar.error(
        'Checkout failed in payment validation',
        error,
        {
          demo: 'stack-trace',
          checkoutStep: 'payment',
          recoverable: true,
        },
        deliveryCallback({
          failureMessage: 'Stack trace not sent',
          onFailure: setStatus,
          onSuccess: (nextStatus) => {
            setStatus(nextStatus);
            onActivity({
              kind: 'error',
              title: 'Stack trace sent',
              detail: error.message,
              uuid: result.uuid,
            });
          },
          successMessage: 'Stack trace sent',
        }),
      );
    }
  };

  return (
    <DemoCard
      number="02"
      label="Error"
      title="Capture a stack trace"
      description="Catch a nested error and preserve the call path Rollbar needs to debug it."
      tone="coral"
    >
      <div className="stack-preview" aria-label="Example stack frames">
        <span>validatePayment()</span>
        <span>processCheckout()</span>
        <span>submitCheckout()</span>
      </div>
      <ActionRow status={status}>
        <button
          className="button button-danger"
          disabled={!accessToken || status?.state === 'sending'}
          onClick={sendStackTrace}
        >
          Generate stack trace <span aria-hidden="true">→</span>
        </button>
      </ActionRow>
    </DemoCard>
  );
}

function submitCheckout() {
  processCheckout();
}

function processCheckout() {
  validatePayment();
}

function validatePayment() {
  throw new Error('The payment gateway returned an invalid response');
}

function CustomDataDemo({ onActivity }) {
  const rollbar = useRollbar();
  const [plan, setPlan] = useState('growth');
  const [betaEnabled, setBetaEnabled] = useState(true);
  const [status, setStatus] = useState(null);

  const customData = useMemo(
    () => ({
      account: {
        id: 'acme-42',
        plan,
      },
      cart: {
        itemCount: 3,
        total: 129.5,
        currency: 'USD',
      },
      featureFlags: {
        newCheckout: betaEnabled,
      },
    }),
    [betaEnabled, plan],
  );

  const sendCustomData = () => {
    setStatus({ state: 'sending', message: 'Sending…' });
    const result = rollbar.warning(
      'Checkout latency crossed the warning threshold',
      customData,
      deliveryCallback({
        failureMessage: 'Custom data not sent',
        onFailure: setStatus,
        onSuccess: (nextStatus) => {
          setStatus(nextStatus);
          onActivity({
            kind: 'warning',
            title: 'Custom data sent',
            detail: `${plan} plan · ${customData.cart.itemCount} cart items`,
            uuid: result.uuid,
          });
        },
        successMessage: 'Custom data sent',
      }),
    );
  };

  return (
    <DemoCard
      number="03"
      label="Custom"
      title="Attach custom data"
      description="Add the account, feature, and business context behind an occurrence."
      tone="amber"
    >
      <div className="form-row">
        <label>
          <span className="field-label">Account plan</span>
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
          >
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={betaEnabled}
            onChange={(event) => setBetaEnabled(event.target.checked)}
          />
          <span className="toggle" aria-hidden="true" />
          New checkout
        </label>
      </div>
      <pre className="data-preview">
        <code>{JSON.stringify(customData, null, 2)}</code>
      </pre>
      <ActionRow status={status}>
        <button
          className="button button-warning"
          disabled={!accessToken || status?.state === 'sending'}
          onClick={sendCustomData}
        >
          Send with custom data <span aria-hidden="true">→</span>
        </button>
      </ActionRow>
    </DemoCard>
  );
}

function ReplayDemo({ onActivity }) {
  const rollbar = useRollbar();
  const [progress, setProgress] = useState(38);
  const [privateNote, setPrivateNote] = useState('This value is masked');
  const [status, setStatus] = useState(null);
  const isRecording = Boolean(rollbar.replay?.recorder?.isRecording);

  const captureReplay = async () => {
    setStatus({ state: 'sending', message: 'Sending replay…' });

    try {
      const replayId = await rollbar.triggerDirectReplay({
        tags: ['playground'],
        demo: 'session-replay',
        progress,
      });

      if (!replayId) {
        setStatus({ state: 'error', message: 'Replay not sent' });
        return;
      }

      setStatus({ state: 'success', message: 'Replay sent' });
      onActivity({
        kind: 'replay',
        title: 'Session replay sent',
        detail: 'Captured recent interactions with privacy masking enabled',
        uuid: replayId,
      });
    } catch {
      setStatus({ state: 'error', message: 'Replay not sent' });
    }
  };

  return (
    <DemoCard
      number="04"
      label="Replay"
      title="Collect a session replay"
      description="Record the interaction trail around an error while masking sensitive fields."
      tone="violet"
    >
      <label className="field-label" htmlFor="journey-progress">
        Simulate progress <strong>{progress}%</strong>
      </label>
      <input
        id="journey-progress"
        className="range-input"
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={(event) => setProgress(Number(event.target.value))}
      />
      <label className="field-label" htmlFor="private-note">
        Private note <span>masked in replay</span>
      </label>
      <input
        id="private-note"
        className="rb-mask"
        value={privateNote}
        onChange={(event) => setPrivateNote(event.target.value)}
      />
      <div className="replay-status">
        <span className={isRecording ? 'pulse-dot' : 'status-dot-offline'} />
        {isRecording
          ? 'Recording · 60s lookback'
          : 'Replay recorder unavailable'}
      </div>
      <ActionRow status={status}>
        <button
          className="button button-replay"
          disabled={!accessToken || !isRecording || status?.state === 'sending'}
          onClick={captureReplay}
        >
          Capture replay now <span aria-hidden="true">→</span>
        </button>
      </ActionRow>
    </DemoCard>
  );
}

function ErrorBoundaryDemo({ onActivity }) {
  return (
    <RollbarContext context="react-17-error-boundary">
      <section className="boundary-page">
        <div className="boundary-intro">
          <p className="eyebrow eyebrow-dark">React integration</p>
          <h1>Crash safely.</h1>
          <p>
            Rollbar&apos;s ErrorBoundary catches render errors, reports the full
            component stack, and swaps in a recovery UI instead of blanking the
            entire application.
          </p>
        </div>
        <ErrorBoundary
          level="critical"
          errorMessage="Example React ErrorBoundary captured a render error"
          fallbackUI={BoundaryFallback}
          extra={{
            demo: 'error-boundary',
            route: '/error-boundary',
            customerImpact: 'contained',
          }}
          callback={(error, response) => {
            if (!deliverySucceeded(error, response)) {
              return;
            }

            onActivity({
              kind: 'critical',
              title: 'Boundary error sent',
              detail: 'The demo recovered without leaving the page',
            });
          }}
        >
          <BoundaryTrigger />
        </ErrorBoundary>
      </section>
    </RollbarContext>
  );
}

function BoundaryTrigger() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Example dashboard widget failed while rendering');
  }

  return (
    <div className="boundary-demo-card">
      <div className="fake-widget">
        <div className="widget-heading">
          <span>Deployment health</span>
          <strong>Live</strong>
        </div>
        <div className="fake-chart" aria-hidden="true">
          {[38, 52, 46, 70, 62, 84, 74, 92].map((height, index) => (
            <i key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
      <div className="boundary-action">
        <span className="notice-icon" aria-hidden="true">
          !
        </span>
        <div>
          <h2>Test the recovery path</h2>
          <p>
            This throws during render so React&apos;s ErrorBoundary can capture
            it. An error-triggered session replay is attached automatically.
          </p>
          <button
            className="button button-danger"
            disabled={!accessToken}
            onClick={() => setShouldCrash(true)}
          >
            Trigger render error <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BoundaryFallback({ error, resetError }) {
  return (
    <div className="boundary-fallback" role="alert">
      <span className="success-mark" aria-hidden="true">
        ✓
      </span>
      <p className="eyebrow eyebrow-dark">Error contained</p>
      <h2>The rest of the app is still running.</h2>
      <p>
        The boundary caught <code>{error?.message}</code> and attempted to send
        its component stack and the replay leading up to it.
      </p>
      <button className="button button-primary" onClick={resetError}>
        Reset the demo
      </button>
    </div>
  );
}

function ActivityPanel({ activity }) {
  return (
    <aside className="activity-panel" aria-live="polite">
      <div className="activity-heading">
        <div>
          <span className="pulse-dot" />
          <strong>Recent activity</strong>
        </div>
        <small>
          {activity.length ? `${activity.length} events` : 'Waiting'}
        </small>
      </div>
      {activity.length ? (
        <ul>
          {activity.map((event) => (
            <li key={event.id}>
              <span className={`activity-kind kind-${event.kind}`}>
                {event.kind}
              </span>
              <div>
                <strong>{event.title}</strong>
                <small>{event.detail}</small>
              </div>
              <time>{event.time}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="activity-empty">
          Use a demo above and its event will appear here.
        </p>
      )}
    </aside>
  );
}

function Footer() {
  return (
    <footer>
      <p>
        Built with <strong>@rollbar/react</strong> and the Rollbar Session
        Replay bundle.
      </p>
      <a
        href="https://github.com/rollbar/rollbar-react"
        target="_blank"
        rel="noreferrer"
      >
        View source <span aria-hidden="true">↗</span>
      </a>
    </footer>
  );
}
