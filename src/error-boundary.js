import React from 'react';
import PropTypes from 'prop-types';
import invariant from 'tiny-invariant';
import VALID_LEVELS, { LEVEL_ERROR } from './constants';
import { Context, getRollbarFromContext } from './provider';

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
    level: LEVEL_ERROR,
  }

  constructor(props) {
    super(props);
    invariant(VALID_LEVELS.includes(props.level), `${props.level} is not a valid level setting for Rollbar`);
    this.state = { ...INITIAL_ERROR_STATE };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const { errorMessage, extra, level: targetLevel, callback } = this.props;
    const custom = utils.value(extra, {}, error, info);
    const data = { ...info, ...custom };
    const level = utils.value(targetLevel, LEVEL_ERROR, error, info);
    const rollbar = getRollbarFromContext(this.context);
    if (!errorMessage) {
      rollbar[level](error, data, callback);
    } else {
      let logMessage = utils.value(errorMessage, '', error, info);
      rollbar[level](logMessage, error, data, callback);
    }
  }

  resetError = () => {
    this.setState(INITIAL_ERROR_STATE);
  }

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
}
