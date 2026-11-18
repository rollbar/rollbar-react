'use client';

import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import Rollbar from 'rollbar';
import invariant from 'tiny-invariant';
import { isRollbarInstance, value } from './utils';
import {
  manageGlobalCapture,
  mountGlobalCapture,
  unmountGlobalCapture,
} from './global-capture';

export const Context = createContext();
Context.displayName = 'Rollbar';

export const RollbarInstance = Symbol('RollbarInstance');
export const BaseOptions = Symbol('BaseOptions');
export const RollbarCtor = Symbol('RollbarCtor');

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

  constructor(props) {
    super(props);
    const { config, Rollbar: ctor = Rollbar, instance } = this.props;
    invariant(
      !instance || isRollbarInstance(instance),
      '`instance` must be a configured instance of Rollbar',
    );
    const options = value(config);
    const rollbar = instance || new ctor(options);
    // So that several Providers, or StrictMode's second construction, report
    // each global error once.
    this.captureClaim = instance ? null : manageGlobalCapture(rollbar);
    this.state = { rollbar, options };
  }

  componentDidMount() {
    mountGlobalCapture(this.captureClaim);
  }

  componentWillUnmount() {
    unmountGlobalCapture(this.captureClaim);
  }

  render() {
    const { children, Rollbar: ctor = Rollbar } = this.props;
    const { rollbar, options } = this.state;

    return (
      <Context.Provider
        value={{
          [RollbarInstance]: rollbar,
          [BaseOptions]: options,
          [RollbarCtor]: ctor,
        }}
      >
        {children}
      </Context.Provider>
    );
  }
}
