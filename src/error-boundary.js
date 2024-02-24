import React, { Component } from 'react'
import PropTypes from 'prop-types'
import invariant from 'tiny-invariant'
import { LEVEL_ERROR } from './constants'
import { Context, getRollbarFromContext } from './provider'
import * as utils from './utils'

const INITIAL_ERROR_STATE = { hasError: false, error: null }

export class ErrorBoundary extends Component {
  static contextType = Context

  static propTypes = {
    fallbackUI: PropTypes.elementType,
    errorMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    extra: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    level: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    callback: PropTypes.func,
    children: PropTypes.node,
  }

  static defaultProps = {
    level: LEVEL_ERROR,
  }

  constructor(props) {
    super(props)
    invariant(
      utils.isValidLevel(props.level),
      `${props.level} is not a valid level setting for Rollbar`
    )
    this.state = { ...INITIAL_ERROR_STATE }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    const { errorMessage, extra, level: targetLevel, callback } = this.props
    const custom = utils.value(extra, {}, error, info)
    const data = { ...info, ...custom }
    const level = utils.value(targetLevel, LEVEL_ERROR, error, info)
    const rollbar = getRollbarFromContext(this.context)
    if (!errorMessage) {
      rollbar[level](error, data, callback)
    } else {
      let logMessage = utils.value(errorMessage, '', error, info)
      rollbar[level](logMessage, error, data, callback)
    }
  }

  resetError = () => {
    this.setState(INITIAL_ERROR_STATE)
  }

  render() {
    const { hasError, error } = this.state
    const { fallbackUI: FallbackUI, children } = this.props

    if (!hasError) {
      return children
    }

    if (!FallbackUI) {
      return null
    }

    return <FallbackUI error={error} resetError={this.resetError} />
  }
}
