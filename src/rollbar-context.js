import { Component } from 'react';
import PropTypes from 'prop-types';
import { Context, getRollbarFromContext } from './provider';

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

  firstRender = true;

  constructor(props) {
    super(props);
    this.state = { previousContext: null };
  }

  changeContext = (storePrevious = true) => {
    const rollbar = getRollbarFromContext(this.context);
    const { context } = this.props;
    if (storePrevious) {
      this.setState({ previousContext: rollbar.options.payload.context });
    }
    rollbar.configure({ payload: { context } });
  };

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
    const rollbar = getRollbarFromContext(this.context);
    const { previousContext } = this.state;
    rollbar.configure({ payload: { context: previousContext } });
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
