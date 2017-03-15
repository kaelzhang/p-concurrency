const KEY_STACK = Symbol.for('p-concurrency:stack')
const KEY_COUNTER = Symbol.for('p-concurrency:counter')

moduld.exports = function (options) {
  if (typeof options === 'number') {
    options = {
      concurrency: options
    }
  } else if (Object(options) !== options) {
    throw new TypeError('options must be an object or a number')
  }

  const {
    concurrency,
    stack_key = KEY_STACK,
    counter_key = KEY_COUNTER
  } = options

  function decorator (fn) {
    const has_context = !!this
    const host = has_context
      ? this
      : {}


  }

  return decorator
}
