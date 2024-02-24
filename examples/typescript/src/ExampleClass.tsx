import React, { ReactNode } from 'react';
import Rollbar from 'rollbar';
import { Context, getRollbarFromContext } from '@rollbar/react';

// Example of using the Rollbar object from a class component.

export default class ExampleClass extends React.Component {
  // Context here is a React Context and contextType is a special value used by React.
  // This technique can only be used when consuming one provider.
  // For multiple providers, see https://docs.rollbar.com/docs/react
  static contextType = Context;
  rollbar: Rollbar | undefined;

  componentDidMount(): void {
    this.rollbar = getRollbarFromContext(this.context);

    this.rollbar.info('message from class component');
  }

  render(): ReactNode {
    return <div>Class component</div>;
  }
}
