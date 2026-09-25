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
  active = false;

  changeContext = () => {
    this.active = true;
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
    this.active = false;
  }

  render() {
    const { onRender, context } = this.props;
    if (onRender && !this.active) {
      // Before the children render, so that errors they throw are reported
      // with this context. The component is added to the stack on mount.
      setRenderContext(getRollbarFromContext(this.context), context);
    }
    return this.props.children;
  }
}
