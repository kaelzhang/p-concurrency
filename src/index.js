const symbol = typeof Symbol === 'undefined'
  ? key => key
  : key => Symbol.for(key)

const KEY_STACK = symbol('p-concurrency:stack')
const KEY_COUNTER = symbol('p-concurrency:counter')

module.exports = options => {
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
    global = false,
    stack_key = KEY_STACK,
    counter_key = KEY_COUNTER
  } = options

  if (typeof concurrency !== 'number' || concurrency < 1) {
    throw new TypeError('concurrency must be a number from 1 and up')
  }


  return fn => {
    function limit (...args) {
      const host = !!this && !global
        ? this
        : limit

      if (!(counter_key in host)) {
        host[counter_key] = 0
      }

      const queue = host[stack_key] || (host[stack_key] = [])
      const next = () => {
        host[counter_key] --
        if (queue.length > 0) {
          queue.shift()()
        }
      }

      return new Promise ((resolve, reject) => {
        const run = () => {
          host[counter_key] ++

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

        if (host[counter_key] < concurrency) {
          run()
        } else {
          queue.push(run)
        }
      })
    }

    return limit
  }
}
