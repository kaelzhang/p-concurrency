'use strict'

const test = require('ava')
const delay = require('delay')
const Q = require('q')

const {concurrency} = require('..')

function throws (t, fn, message) {
  try {
    fn()
  } catch (e) {
    t.is(e.message, message, 'should throws message')
    t.is(e instanceof TypeError, true, 'should throws TypeError')
    return
  }

  t.fail(`should throw error: ${message}`)
}


test('bad options', t => {
  throws(t, () => {
    concurrency()
  }, 'options must be an object or a number')

  throws(t, () => {
    concurrency('1')
  }, 'options must be an object or a number')

  throws(t, () => {
    concurrency({
      concurrency: '1'
    })
  }, 'concurrency must be a number from 1 and up')

  throws(t, () => {
    concurrency({
      concurrency: 0
    })
  }, 'concurrency must be a number from 1 and up')
})


const run = (t, MAX, options) => {
  let counter = 0

  const fn = function (a, b) {
    counter ++

    t.is(this, undefined, 'context')

    if (counter > MAX) {
      t.fail('exceeds concurrency')
    }

    return delay(100)
    .then(() => {
      counter --
      return a + b
    })
  }

  let arg

  if (options) {
    arg = {
      ...options,
      concurrency: MAX
    }
  } else {
    arg = MAX
  }

  const wrapped = concurrency(arg)(fn)
  return Promise.all([
    wrapped(1, 1),
    wrapped(1, 2),
    wrapped(1, 3)
  ]).then((result) => {
    t.deepEqual(result, [2, 3, 4], 'wrong result')
  })
}

test('normal functions', t => {
  run(t, 2)
})


test('when', async t => {
  let count = 0
  let max = - 1

  const fn = concurrency({
    concurrency: 1,
    when (n) {
      return n < 3
    }
  })(async n => {
    count ++
    max = Math.max(max, count)

    await delay(100)

    count --
  })

  const tasks = []
  let task_count = 50

  while (task_count > 0) {
    tasks.push(fn(task_count --))
  }

  await Promise.all(tasks)

  t.is(max, 49)
})


test('with q', async t => {
  run(t, 2, {
    promise (callback) {
      const defer = Q.defer()
      callback(x => defer.resolve(x), x => defer.reject(x))
      return defer.promise
    }
  })
})


test('reject', t => {
  let counter = 0
  const MAX = 2
  const fn = function (a, b) {
    counter ++

    t.is(this, undefined, 'context')

    if (counter > MAX) {
      t.fail('exceeds concurrency')
    }

    return delay(a)
    .then(() => {
      counter --
      const ret = a + b
      return ret === 200
        ? Promise.reject(ret)
        : ret
    })
  }

  const wrapped = concurrency(MAX)(fn)
  return Promise.all([
    wrapped(100, 1),
    wrapped(100, 2),
    wrapped(100, 3),
    wrapped(200, 0)
  ]).then((result) => {
    t.fail('should not resolve')
  }).catch((result) => {
    t.is(result, 200, 'test error message')
  })
})


test('function with context', t => {
  let counter = 0
  const MAX = 2
  const context = {
    a: 1
  }
  const fn = function (b) {
    counter ++

    t.is(this, context, 'context')

    if (counter > MAX) {
      t.fail('exceeds concurrency')
    }

    return delay(100)
    .then(() => {
      counter --
      return this.a + b
    })
  }

  context.foo = concurrency(MAX)(fn)
  return Promise.all([
    context.foo(1),
    context.foo(2),
    context.foo(3)
  ]).then((result) => {
    t.deepEqual(result, [2, 3, 4], 'wrong result')
  })
})


test('reject with context', t => {
  let counter = 0
  const MAX = 2
  const context = {
    a: 50
  }

  const fn = function (b) {
    counter ++

    t.is(this, context, 'context')

    if (counter > MAX) {
      t.fail('exceeds concurrency')
    }

    return delay(b)
    .then(() => {
      counter --
      const ret = this.a + b
      return ret === 200
        ? Promise.reject(ret)
        : ret
    })
  }

  context.foo = concurrency(MAX)(fn)
  return Promise.all([
    context.foo(100),
    context.foo(100),
    context.foo(100),
    context.foo(150)
  ]).then((result) => {
    t.fail('should not resolve')
  }).catch((result) => {
    t.is(result, 200, 'test error message')
  })
})
