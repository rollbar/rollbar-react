import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import Rollbar from 'rollbar';
import { useState } from 'react';
import { useRollbar, useRollbarContext } from '@rollbar/react';

interface Props {
  name: string;
}

function ExampleErrors(props: Props): ReactElement {
  const rollbar: Rollbar = useRollbar();
  useRollbarContext(`/${props.name}`);

  const sendRollbarMessage = () => {
    rollbar.info(`test react-app message: ${props.name}`);
  };

  const sendRollbarError = () => {
    try {
      throw new Error('caught test error');
    } catch (e) {
      rollbar.error(e as Rollbar.LogArgument);
    }
  };

  const [errorState, setErrorState] = useState({ error: false });

  const updateErrorState = () => {
    // Use an error state and throw inside render,
    // because React won't send errors within event handlers
    // to the error boundary component.
    setErrorState({ error: true });
  };

  if (errorState.error) {
    // This uncaught error will be handled by the ErrorBoundary.
    throw new Error('uncaught test error');
  }

  return (
    <>
      <h1>Rollbar Example for React Child Component: {props.name}</h1>
      <button id="rollbar-message" onClick={sendRollbarMessage}>
        Send Rollbar Message
      </button>
      <button id="rollbar-error" onClick={sendRollbarError}>
        Send Caught Error
      </button>
      <button id="uncaught-error" onClick={updateErrorState}>
        Throw Uncaught Error
      </button>
    </>
  );
}

ExampleErrors.propTypes = {
  name: PropTypes.string,
};

export default ExampleErrors;
