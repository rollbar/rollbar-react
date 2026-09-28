'use client';

import { Component } from 'react';
import PropTypes from 'prop-types';
import { Context, getRollbarFromContext } from './provider';
import {
  nextContextOrder,
  removeContext,
  setContext,
  setRenderContext,
} from './context-stack';

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

  // Where this component sits among nested contexts; see context-stack.js.
  order = nextContextOrder();
  // The context this component has set since mounting, if it's mounted.
  mountedContext = undefined;

  changeContext = () => {
    this.mountedContext = this.props.context;
    setContext(
      getRollbarFromContext(this.context),
      this.order,
      this.props.context,
    );
  };

  componentDidMount() {
    this.changeContext();
  }

  componentDidUpdate(prevProps) {
    const { onRender, context } = this.props;
    if (!onRender || context !== prevProps.context) {
      this.changeContext();
    }
  }

  componentWillUnmount() {
    removeContext(getRollbarFromContext(this.context), this.order);
    this.mountedContext = undefined;
  }

  render() {
    const { onRender, context } = this.props;
    if (onRender && context !== this.mountedContext) {
      // Before the children render, on the first render and when the context
      // prop changes, so that errors they throw are reported with this
      // context. It's applied for good on mount or update.
      setRenderContext(
        getRollbarFromContext(this.context),
        this.order,
        context,
      );
    }
    return this.props.children;
  }
}
