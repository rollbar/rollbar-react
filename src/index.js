import React, { Component, createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Rollbar from 'rollbar';
import invariant from 'tiny-invariant';

const LEVEL_DEBUG = 'debug';
const LEVEL_INFO = 'info';
const LEVEL_WARN = 'warn';
const LEVEL_ERROR = 'error';
const LEVEL_CRITICAL = 'critical';

const Context = createContext();
Context.displayName = 'Rollbar';

const RollbarInstance = Symbol('RollbarInstance');
const BaseOptions = Symbol('BaseOptions');
const RollbarCtor = Symbol('RollbarCtor');

function value(val, defaultTo, ...args) {
  if (typeof val === 'function') {
    return val(...args);
  }
  return val;
}

function wrapValue(val, defaultAs) {
  return (defaultTo, ...args) => value(val, defaultAs === undefined ? defaultTo : defaultAs, ...args);
}

export function historyContext(rollbar, { formatter, filter }) {
  invariant(rollbar instanceof Rollbar, 'historyContext must have an instance of Rollbar');
  invariant(formatter == null || typeof formatter === 'function', `formatter option must be a function, received ${typeof formatter} instead`);
  invariant(filter == null || typeof filter === 'function', `filter option must be a function, received ${typeof filter} instead`);
  return (v4location, v4action) => {
    let  { action, location } = v4location;
    if (v4action) {
      action = v4action;
      location = v4location;
    }
    if (filter && !filter(location, action)) {
      return;
    }
    const context = formatter ? formatter(location, action) : location.pathname;
    rollbar.configure({ payload: { context }});
  }
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

export class RollbarContext extends Component {
  static propTypes = {
    context: PropTypes.string.isRequired,
    onRender: PropTypes.bool,
  }

  static defaultProps = {
    onRender: false,
  }

  static contextType = Context;

  firstRender = true;

  constructor(props) {
    super(props);
    this.state = { previousContext: null };
  }

  // static getDerivedStateFromProps() {}

  changeContext = (storePrevious = true) => {
    const { [RollbarInstance]: rollbar } = this.context;
    const { context } = this.props;
    if (storePrevious) {
      this.setState({ previousContext: rollbar.options.payload.context });
    }
    rollbar.configure({ payload: { context }});
  }

  componentDidMount() {
    const { onRender } = this.props;
    if (!onRender) {
      this.changeContext(true);
    }
  }

  componentDidUpdate() {
    const { onRender } = this.props;
    if (!onRender) {
      this.changeContext(false);
    }
  }

  componentWillUnmount() {
    const { [RollbarInstance]: rollbar } = this.context;
    const { previousContext } = this.state;
    rollbar.configure({ payload: { context: previousContext }});
  }

  render() {
    const { onRender } = this.props;
    if (onRender && this.firstRender) {
      this.changeContext(true);
    }
    this.firstRender = false;
    return this.props.children;
  }
}

// export class RollbarConfiguration extends Component {
//   static propTypes = {
//     options: PropTypes.object.isRequired,
//   }

//   static contextType = Context;

//   constructor(props) {
//     super(props);
//     this.state = { parentConfig: null };
//   }

//   componentDidMount() {
//     const { [RollbarInstance]: rollbar } = this.context;
//     const { options } = this.props;
//     // need to clone this somehow to prevent downstream changes from manipulating it
//     const parentConfig = (o => o)(rollbar.options);
//     this.setState({ parentConfig });
//     rollbar.configure(options);
//   }

//   componentWillUnmount() {
//     const { [RollbarInstance]: rollbar } = this.context;
//     const { parentConfig } = this.state;
//     rollbar.configure(parentConfig);
//   }

//   render() {
//     return this.props.children;
//   }
// }

const NOOP = () => {};
const INITIAL_ERROR_STATE = { hasError: false, error: null };

export class ErrorBoundary extends Component {
  static contextType = Context;

  static propTypes = {
    fallbackUI: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    errorMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    extra: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    level: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    callback: PropTypes.func,
  }

  static defaultProps = {
    level: 'error',
  }

  constructor(props) {
    super(props);
    this.state = { ...INITIAL_ERROR_STATE };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const { errorMessage, extra, level: targetLevel, callback } = this.props;
    const custom = value(extra, {}, error, info);
    const data = { ...info, ...custom };
    const level = value(targetLevel, 'error', error, info);
    const { [RollbarInstance]: rollbar } = this.context;
    if (!errorMessage) {
      rollbar[level](error, data, callback);
    } else {
      let logMessage = value(errorMessage, '', error, info);
      rollbar[level](logMessage, error, data, callback);
    }
  }

  resetError = () => {
    this.setState(INITIAL_ERROR_STATE);
  }

  // wrapRollbar = (rollbar, children) => {
  //   return (
  //     <Context.Provider value={{ rollbar }}>
  //       {children}
  //     </Context.Provider>
  //   );
  // }

  // getChildren = () => {
  render() {
    const { hasError, error } = this.state;
    const { fallbackUI, children } = this.props;

    if (!hasError) {
      return children;
    }

    if (!fallbackUI) {
      return null;
    }

    if (React.isValidElement(fallbackUI)) {
      return <fallbackUI error={error} resetError={this.resetError} />;
    }

    if (typeof fallbackUI === 'function') {
      const fallbackComponent = fallbackUI(error, this.resetError);
      return React.isValidElement(fallbackComponent) ? fallbackComponent : null;
    }

    return null;
  }

  // render() {
  //   const { rollbar, doWrapRollbar } = this.state;
  //   const children = this.getChildren();
  //   if (doWrapRollbar) {
  //     return this.wrapRollbar(rollbar, children);
  //   }
  //   return children;
  // }
}

export function useRollbar() {
  const { [RollbarInstance]: rollbar } = useContext(Context);
  return rollbar;
}

export function useRollbarConfiguration(config) {
  const rollbar = useRollbar();
  rollbar.configure(config);
}

export function useScopedConfiguration(config) {
  const { [RollbarInstance]: base, [RollbarCtor]: ctor } = useContext(Context);
  // const base = useRollbar();
  const rollbar = new ctor(base.options);
  rollbar.configure(config);
  return rollbar;
}

export function useRollbarPerson(person) {
  useRollbarConfiguration({ payload: { person }});
}

export function useRollbarContext(context) {
  useRollbarConfiguration({ payload: { context }});
}

function useRollbarNotify(type, isLayout, ...args) {
  const rollbar = useRollbar();
  (isLayout ? useLayoutEffect : useEffect)(() => {
    rollbar[type](...args);
  }, args)
}

function wrapRollbarApi(rollbar) {
  const rb = useRef(rollbar);
  return {
    log: (...args) => rb.current.log(...args),
    debug: (...args) => rb.current.debug(...args),
    info: (...args) => rb.current.info(...args),
    warn: (...args) => rb.current.warn(...args),
    error: (...args) => rb.current.error(...args),
    critical: (...args) => rb.current.critical(...args),
    captureEvent: (...args) => rb.current.captureEvent(...args),
  }
}

export function useRollbarLog(...args) {
  useRollbarNotify('log', ...args);
}

export function useRollbarDebug(...args) {
  useRollbarNotify('debug', ...args);
}

export function useRollbarInfo(...args) {
  useRollbarNotify('info', ...args);
}

export function useRollbarWarn(...args) {
  useRollbarNotify('warn', ...args);
}

export function useRollbarError(...args) {
  useRollbarNotify('error', ...args);
}

export function useRollbarCritical(...args) {
  useRollbarNotify('critical', ...args);
}

export function useRollbarCaptureEvent(metadata, level) {
  const rollbar = useRollbar();
  useEffect(() => {
    rollbar.captureEvent(metadata, level);
  }, [metadata]);
}

export function useContext(ctx = '', isLayout = false) {
  invariant(ctx && typeof ctx === 'string', '`ctx` must be a non-empty string');
  const rollbar = useRollbar();
  (isLayout ? useLayoutEffect : useEffect)(() => {
    const origCtx = rollbar.options.payload.context;
    rollbar.configure({ payload: { context: ctx }});
    return () => {
      rollbar.configure({ payload: { context: origCtx }});
    };
  }, [ctx]);
}
