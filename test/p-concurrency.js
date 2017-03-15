const test = require('ava')
const concurrency = require('..')
const delay = require('delay')


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


test('normal functions', t => {
  let counter = 0
  const MAX = 2
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

  const wrapped = concurrency(MAX)(fn)
  return Promise.all([
    wrapped(1, 1),
    wrapped(1, 2),
    wrapped(1, 3)
  ]).then((result) => {
    t.deepEqual(result, [2, 3, 4], 'wrong result')
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
