'use client';

import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { Context, getRollbarFromContext } from './provider';
import {
  nextContextOrder,
  removeContext,
  setContext,
  setRenderContext,
} from './context-stack';

// The nearest RollbarContext's order and context, for an ErrorBoundary inside
// it to report with; see reportWithContext in context-stack.js.
export const ReportContext = createContext(undefined);
ReportContext.displayName = 'RollbarReportContext';

// The scope path: the orders of the RollbarContexts and ErrorBoundaries
// around a component, outermost first, for reportWithContext. Each one
// provides the path to itself, which never changes while it's mounted, so the
// components that use useRollbarContext don't re-render when it changes.
export const ScopeContext = createContext([]);
ScopeContext.displayName = 'RollbarScopeContext';

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
  // What ReportContext provides, kept until the context prop changes.
  reportContext = undefined;
  // What ScopeContext provides, set on the first render.
  path = undefined;

  changeContext = () => {
    this.mountedContext = this.props.context;
    setContext(
      getRollbarFromContext(this.context),
      this.order,
      this.props.context,
      this.path,
    );
  };

  componentDidMount() {
    this.changeContext();
  }

  componentDidUpdate(prevProps) {
    if (this.props.context !== prevProps.context) {
      this.changeContext();
    }
  }

  componentWillUnmount() {
    removeContext(getRollbarFromContext(this.context), this.order);
    this.mountedContext = undefined;
  }

  render() {
    // contextType is taken by the Provider's context.
    return (
      <ScopeContext.Consumer>
        {(parentPath) => this.renderInScope(parentPath)}
      </ScopeContext.Consumer>
    );
  }

  renderInScope(parentPath) {
    const { onRender, context } = this.props;
    this.path ??= [...parentPath, this.order];
    if (onRender && context !== this.mountedContext) {
      // Before the children render, on the first render and when the context
      // prop changes, so that errors they throw are reported with this
      // context. It's applied for good on mount or update.
      setRenderContext(
        getRollbarFromContext(this.context),
        this.order,
        context,
        this.path,
      );
    }
    if (this.reportContext?.context !== context) {
      this.reportContext = { order: this.order, context };
    }
    return (
      <ScopeContext.Provider value={this.path}>
        <ReportContext.Provider value={this.reportContext}>
          {this.props.children}
        </ReportContext.Provider>
      </ScopeContext.Provider>
    );
  }
}
