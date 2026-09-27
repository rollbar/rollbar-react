'use client';

import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import Rollbar from 'rollbar';
import invariant from 'tiny-invariant';
import { isRollbarInstance } from './utils';
import {
  abandonGlobalCapture,
  claimGlobalCapture,
  mountGlobalCapture,
  unmountGlobalCapture,
} from './global-capture';

export const Context = createContext();
Context.displayName = 'Rollbar';

export const RollbarInstance = Symbol('RollbarInstance');
export const BaseOptions = Symbol('BaseOptions');
export const RollbarCtor = Symbol('RollbarCtor');

// Carries the enclosing Provider's global capture claim. Kept apart from
// `Context`, whose value is new on every render, so that nested Providers
// only subscribe to a value that doesn't change after their first render.
const CaptureClaimContext = createContext(null);

export function getRollbarFromContext(context) {
  const { [RollbarInstance]: rollbar } = context;
  return rollbar;
}

export function getRollbarConstructorFromContext(context) {
  const { [RollbarCtor]: ctor } = context;
  return ctor;
}

export class Provider extends Component {
  static propTypes = {
    Rollbar: PropTypes.func,
    config: (props, propName, componentName) => {
      if (!props.config && !props.instance) {
        return new Error(
          `One of the required props 'config' or 'instance' must be set for ${componentName}.`,
        );
      }
      if (props.config) {
        const configType = typeof props.config;
        if (
          configType === 'function' ||
          (configType === 'object' && !Array.isArray(configType))
        ) {
          return;
        }
        return new Error(`${propName} must be either an Object or a Function`);
      }
    },
    instance: (props, propName, componentName) => {
      if (!props.config && !props.instance) {
        return new Error(
          `One of the required props 'config' or 'instance' must be set for ${componentName}.`,
        );
      }
      if (props.instance && !isRollbarInstance(props.instance)) {
        return new Error(
          `${propName} must be a configured instance of Rollbar`,
        );
      }
    },
    children: PropTypes.node,
  };

  static contextType = CaptureClaimContext;

  constructor(props) {
    super(props);
    const { instance } = this.props;
    invariant(
      !instance || isRollbarInstance(instance),
      '`instance` must be a configured instance of Rollbar',
    );
  }

  // Created on first render rather than in the constructor: in development,
  // StrictMode constructs class components twice and throws one away, and a
  // Rollbar instance built there would keep its global handlers regardless.
  getRollbar() {
    if (!this.rollbar) {
      const { config, Rollbar: ctor = Rollbar, instance } = this.props;
      const options = typeof config === 'function' ? config() : config;
      if (instance) {
        this.rollbar = instance;
      } else {
        const { options: ctorOptions, claim } = claimGlobalCapture(
          options,
          this.parentClaim(),
        );
        try {
          this.rollbar = new ctor(ctorOptions);
        } catch (e) {
          abandonGlobalCapture(claim);
          throw e;
        }
        if (claim) {
          claim.rollbar = this.rollbar;
          this.captureClaim = claim;
        }
      }
      this.options = options;
    }
    return this.rollbar;
  }

  parentClaim() {
    return this.context;
  }

  componentDidMount() {
    mountGlobalCapture(this.captureClaim);
  }

  componentWillUnmount() {
    unmountGlobalCapture(this.captureClaim);
  }

  render() {
    const { children, Rollbar: ctor = Rollbar } = this.props;
    const rollbar = this.getRollbar();
    const { options } = this;

    return (
      <CaptureClaimContext.Provider
        value={this.captureClaim ?? this.parentClaim()}
      >
        <Context.Provider
          value={{
            [RollbarInstance]: rollbar,
            [BaseOptions]: options,
            [RollbarCtor]: ctor,
          }}
        >
          {children}
        </Context.Provider>
      </CaptureClaimContext.Provider>
    );
  }
}
