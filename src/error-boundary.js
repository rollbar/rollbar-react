'use client';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import invariant from 'tiny-invariant';
import { LEVEL_ERROR } from './constants';
import { Context, getRollbarFromContext } from './provider';
import { ReportContext, ScopeContext } from './rollbar-context';
import {
  getHookRenders,
  nextContextOrder,
  reportWithContext,
} from './context-stack';
import * as utils from './utils';

const INITIAL_ERROR_STATE = { hasError: false, error: null };

export class ErrorBoundary extends Component {
  static contextType = Context;

  static propTypes = {
    fallbackUI: PropTypes.elementType,
    errorMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    extra: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    level: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    callback: PropTypes.func,
    children: PropTypes.node,
  };

  static defaultProps = {
    level: LEVEL_ERROR,
  };

  constructor(props) {
    super(props);
    invariant(
      utils.isValidLevel(props.level),
      `${props.level} is not a valid level setting for Rollbar`,
    );
    this.state = { ...INITIAL_ERROR_STATE };
  }

  // Ranks this among the contexts around and inside it, and what ScopeContext
  // provides; see reportWithContext.
  order = nextContextOrder();
  path = undefined;
  // The useRollbarContext hooks that rendered with the error; see
  // setHookRender.
  renderedHooks = undefined;

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const { errorMessage, extra, level: targetLevel, callback } = this.props;
    const custom = utils.value(extra, {}, error, info);
    const data = { ...info, ...custom };
    const level = utils.value(targetLevel, LEVEL_ERROR, error, info);
    const rollbar = getRollbarFromContext(this.context);
    reportWithContext(
      rollbar,
      this.reportContext,
      this.path,
      this.renderedHooks,
      () => {
        if (!errorMessage) {
          rollbar[level](error, data, callback);
        } else {
          let logMessage = utils.value(errorMessage, '', error, info);
          rollbar[level](logMessage, error, data, callback);
        }
      },
    );
  }

  resetError = () => {
    this.setState(INITIAL_ERROR_STATE);
  };

  render() {
    const { hasError, error } = this.state;
    const { fallbackUI: FallbackUI, children } = this.props;

    // React renders this right after the child that threw, before it commits,
    // which may not be in the same task.
    this.renderedHooks = hasError
      ? getHookRenders(getRollbarFromContext(this.context))
      : undefined;

    let content = null;
    if (!hasError) {
      content = children;
    } else if (FallbackUI) {
      content = <FallbackUI error={error} resetError={this.resetError} />;
    }

    // contextType is taken by the Provider's context. The value is read again
    // whenever this renders, including the render after a child throws, which
    // is the one React commits before calling componentDidCatch.
    return (
      <ScopeContext.Consumer>
        {(parentPath) => {
          this.path ??= [...parentPath, this.order];
          return (
            <ReportContext.Consumer>
              {(reportContext) => {
                this.reportContext = reportContext;
                return (
                  <ScopeContext.Provider value={this.path}>
                    {content}
                  </ScopeContext.Provider>
                );
              }}
            </ReportContext.Consumer>
          );
        }}
      </ScopeContext.Consumer>
    );
  }
}
