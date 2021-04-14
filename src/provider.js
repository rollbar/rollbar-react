import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import Rollbar from 'rollbar';
import invariant from 'tiny-invariant';
import * as constants from './constants';
import * as utils from './utils';

export const Context = createContext();
Context.displayName = 'Rollbar';

const RollbarInstance = Symbol('RollbarInstance');
const BaseOptions = Symbol('BaseOptions');
const RollbarCtor = Symbol('RollbarCtor');

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
    config: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
    instance: PropTypes.instanceOf(Rollbar),
  }

  constructor(props) {
    super(props);
    const { config, Rollbar: ctor = Rollbar, instance } = this.props;
    invariant(!instance || instance instanceof Rollbar, 'providing `instance` must be of type Rollbar');
    const options = typeof config === 'function' ? config() : config;
    const rollbar = instance || new ctor(options);
    // TODO: use isUncaught to filter if this is 2nd Provider added
    // unless customer wants that
    this.state = { rollbar, options };
  }



  // componentDidUpdate()

  render() {
    const { children, Rollbar: ctor = Rollbar } = this.props;
    const { rollbar, options } = this.state;

    return (
      <Context.Provider value={{ [RollbarInstance]: rollbar, [BaseOptions]: options, [RollbarCtor]: ctor }}>
        {children}
      </Context.Provider>
    )
  }
}
