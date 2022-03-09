// EXPERIMENTAL
// NOT EXPORTED AS PART OF PUBLIC API YET: no current test coverage

// PURPOSE provide a wrapping around Rollbar configuration for a subtree

import { Component } from 'react';
import PropTypes from 'prop-types';
import { Context, getRollbarFromContext } from './provider';

export class RollbarConfiguration extends Component {
  static propTypes = {
    options: PropTypes.object.isRequired,
    children: PropTypes.node,
  }

  static contextType = Context;

  constructor(props) {
    super(props);
    this.state = { parentConfig: null };
  }

  componentDidMount() {
    const rollbar = getRollbarFromContext(this.context);
    const { options } = this.props;
    // TODO: need to clone this somehow to prevent downstream changes from manipulating it
    const parentConfig = (o => o)(rollbar.options);
    this.setState({ parentConfig });
    rollbar.configure(options);
  }

  componentWillUnmount() {
    const rollbar = getRollbarFromContext(this.context);
    const { parentConfig } = this.state;
    rollbar.configure(parentConfig);
  }

  render() {
    return this.props.children;
  }
}
