'use strict'

const KEY = Symbol('p-concurrency:queue')

const DEFAULT_WHEN = () => true
const NEW_PROMISE = handler => new Promise(handler)

exports.KEY = KEY

exports.concurrency = options => {
  if (typeof options === 'number') {
    options = {
      concurrency: options
    }

  } else if (Object(options) !== options) {
    throw new TypeError('options must be an object or a number')
  }

  const {
    concurrency,
    // Whether to use global queue
    global: use_global_host = false,
    when = DEFAULT_WHEN,
    promise: promise_factory = NEW_PROMISE,
    key = KEY
  } = options

  if (typeof concurrency !== 'number' || concurrency < 1) {
    throw new TypeError('concurrency must be a number from 1 and up')
  }


  const limiter = fn => {
    function limited (...args) {
      if (!when.apply(this, args)) {
        // Should not be limited
        return fn.apply(this, args)
      }

      const host = !!this && !use_global_host
        ? this
        : limiter

      const info = host[key] || (
        host[key] = {
          size: 0,
          queue: []
        }
      )

      // console.log(host, info)

      const {queue} = info

      const next = () => {
        info.size --

        if (queue.length > 0) {
          queue.shift()()
        }
      }

      return promise_factory((resolve, reject) => {
        const run = () => {
          info.size ++

          fn.apply(this, args).then(
            value => {
              resolve(value)
              next()
            },
            err => {
              reject(err)
              next()
            }
          )
        }

        if (info.size < concurrency) {
          run()
        } else {
          queue.push(run)
        }
      })
    }

    return limited
  }

  return limiter
}
