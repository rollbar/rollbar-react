import React, { useEffect, useState } from 'react';
import Rollbar from 'rollbar';
import { Router, Switch, Route } from 'react-router-dom';
import { Client } from 'rollbar-react-native';
import { Provider, Context, ErrorBoundary, useRollbar, useRollbarCaptureEvent, LEVEL_INFO, useRollbarPerson, useContext, RollbarContext, historyContext } from '../src';

function ErrorDisplay({error, resetError}) { // <-- props passed to fallbackUI component
  if (error instanceof AggregateError) {
    return <AggregateDisplay error={error} />;
  }
  return (
    <div>
      <h1>Something went wrong.</h1>
      {error && <p>{error.toString()}</p>}
    </div>
  );
}

const rollbarConfig = {
  accessToken: 'POST_CLIENT_ITEM_ACCESS_TOKEN',
  environment: 'production',
};

const rollbar = new Client('POST_CLIENT_ITEM_ACCESS_TOKEN');

const ROUTE_PARAMS_RE = /\/\d+/g;

const historyListener = historyContext(rollbar, {
  // optional: default uses location.pathname
  formatter: (location, action) => location.pathname.replace(ROUTE_PARAMS_RE, ''),
  // optional: true return sets Rollbar context
  filter: (location, action) => !location.pathname.includes('admin'),
});
const unlisten = history.listen(historyListener);


const rollbar = new Rollbar(rollbarConfig);

function level(error, info) { // <-- same signature as componentDidCatch(error, info)
  return error instanceof TypeError ? 'error' : 'warn';
}
function errorMessage(error, { componentStack }) {
  const sourceComponents = componentStack.split('\n').map(c => c.trim().replace('in ', ''))
  return `component ${sourceComponents[0]} had an error`;
}
function extraData(error, info) {
  return info.componentStack.includes('Experiment') ? { experiment: true } : null;
}

const stack = `\n    in Card\n    in App\n    in ErrorBoundary\n    in ErrorProvider`

const Routes = () => (
  <Router>
    <Switch>
      <Route path="/about">
        <RollbarContext context="/about">
          <About />
        </RollbarContext>
      </Route>
      <Route path="/contacts/:id">
        <RollbarContext context="contacts/details">
          <ContactDetails />
        </RollbarContext>
      </Route>
      <Route path="/contacts">
        <RollbarContext context="contacts">
          <ContactsList />
        </RollbarContext>
      </Route>
    </Switch>
  </Router>
)

function Contacts(props) {
  return (
    <Route path="/about">
      <RollbarContext context="/about">
        …
      </RollbarContext>
    </Route>
  )
}

function Home() {
  const [currentUser, setCurrentUser] = useState();

  useEffect(async () => {
    const user = await Auth.getCurrentUser();
    if (user) {
      useRollbarPerson(user);
    }
    setCurrentUser(user);
  });

  if (currentUser != null) {
    return <LoggedInHome />;
  }

  return <LoggedOutHome />;
}

function ContactDetails({ contactId }) {
  const rollbar = useRollbar(); // <-- must have parent Provider
  const [contact, setContact] = useState();

  useEffect(async () => {
    try {
      const { data } = await getContact(contactId);
      setContact(data.contact);
    } catch (error) {
      rollbar.error('Error fetching contact', error, { contactId });
    }
  }, [contactId]);

  useRollbarCaptureEvent(contact, LEVEL_INFO); // <-- only fires when contact changes

  return (
    <div>
      …
    </div>
  )
}

function App(props) {
  return (
    <Provider rollbar={rollbar}>
      <Router>

      </Router>
      <RollbarContext name="">
        <ErrorBoundary fallbackUI={ErrorDisplay}>
          <div>
            <h1>I'm Here</h1>
            <MyInput>
              <ErrorBoundary level errorMessage={(error, errorInfo) => `${error.message}`} extraData={{ person: {}, form: { name: 'myform' } }}>
                <Form>

                </Form>
              </ErrorBoundary>
            </MyInput>
          </div>
        </ErrorBoundary>
      </RollbarContext>
    </Provider>
  )
}

function HomePage(props) {
  useContext('home#index');

  return (
    <div>
      …
    </div>
  );
}

function UsersPage(props) {
  useContext('users#list');

  return (
    <UserTable />
  );
}

function MyInput(props) {
  const rollbar = useRollbar();

  useEffect(() => {
    try {

    } catch (err) {
      rollbar.error('error fetching data', err);
    }
  });
}

/**
 * Different teams - need separate tokens => separate instances
 * Different api endpoints
 *
 * global concerns: window.onerror, promise rejection
 */
