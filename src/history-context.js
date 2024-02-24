import Rollbar from 'rollbar'
import invariant from 'tiny-invariant'

export function historyContext(rollbar, { formatter, filter } = {}) {
  invariant(
    rollbar instanceof Rollbar,
    'historyContext must have an instance of Rollbar'
  )
  invariant(
    formatter == null || typeof formatter === 'function',
    `formatter option must be a function, received ${typeof formatter} instead`
  )
  invariant(
    filter == null || typeof filter === 'function',
    `filter option must be a function, received ${typeof filter} instead`
  )
  // v4 of history.listen callback signature is (location, action)
  // v5 of history.listen callback signature is ({ location, action })
  // this implementation translates it to work for both
  return (v4location, v4action) => {
    let { action, location } = v4location
    if (v4action) {
      action = v4action
      location = v4location
    }
    if (filter && !filter(location, action)) {
      return
    }
    const context = formatter ? formatter(location, action) : location.pathname
    invariant(
      typeof context === 'string',
      'formatter must return a string value to set the context'
    )
    rollbar.configure({ payload: { context } })
  }
}
