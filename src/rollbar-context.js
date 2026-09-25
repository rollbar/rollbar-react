'use client';

import { Component } from 'react';
import PropTypes from 'prop-types';
import { Context, getRollbarFromContext } from './provider';
import { nextContextOrder, removeContext, setContext } from './context-stack';

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
  // Kept on the instance rather than in state because with onRender it is
  // added during render, where setState isn't allowed.
  entry = { order: nextContextOrder(), context: undefined };
  active = false;

  changeContext = () => {
    this.entry.context = this.props.context;
    this.active = true;
    setContext(getRollbarFromContext(this.context), this.entry);
  };

  componentDidMount() {
    // With onRender the context was already set during the first render.
    if (!this.active) {
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
    removeContext(getRollbarFromContext(this.context), this.entry);
    this.active = false;
  }

  render() {
    const { onRender } = this.props;
    if (onRender && !this.active) {
      this.changeContext();
    }
    return this.props.children;
  }
}
