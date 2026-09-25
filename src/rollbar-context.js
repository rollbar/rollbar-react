'use client';

import { Component } from 'react';
import PropTypes from 'prop-types';
import { Context, getRollbarFromContext } from './provider';

export class RollbarContext extends Component {
  static propTypes = {
    context: PropTypes.string.isRequired,
    onRender: PropTypes.bool,
    children: PropTypes.node,
  };

  static defaultProps = {
    onRender: false,
  };

  static contextType = Context;

  // The context in effect before this component set its own, restored on
  // unmount. Kept on the instance rather than in state because with onRender
  // it is captured during render, where setState isn't allowed.
  previousContext = undefined;
  contextSet = false;

  changeContext = () => {
    const rollbar = getRollbarFromContext(this.context);
    if (!this.contextSet) {
      // rollbar.js has no default payload, so options.payload is undefined
      // unless the config sets it.
      this.previousContext = rollbar.options.payload?.context;
      this.contextSet = true;
    }
    rollbar.configure({ payload: { context: this.props.context } });
  };

  componentDidMount() {
    // With onRender the context was already set during the first render.
    if (!this.contextSet) {
      this.changeContext();
    }
  }

  componentDidUpdate(prevProps) {
    const { onRender, context } = this.props;
    if (!onRender || context !== prevProps.context) {
      this.changeContext();
    }
  }

  componentWillUnmount() {
    const rollbar = getRollbarFromContext(this.context);
    // configure() ignores undefined values, so restoring an unset context
    // needs ''. rollbar.js sends '' for an unset context anyway.
    rollbar.configure({ payload: { context: this.previousContext ?? '' } });
    this.contextSet = false;
  }

  render() {
    const { onRender } = this.props;
    if (onRender && !this.contextSet) {
      this.changeContext();
    }
    return this.props.children;
  }
}
