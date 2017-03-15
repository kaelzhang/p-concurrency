const test = require('ava')

test('description', t => {
  t.is(true, true)
})



class Foo {
  constructor () {
  }

  @
  async bar (n) {
    return await remoteGetSomething(n)
  }
}