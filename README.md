[![Build Status](https://travis-ci.org/kaelzhang/p-concurrency.svg?branch=master)](https://travis-ci.org/kaelzhang/p-concurrency)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/p-concurrency?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/p-concurrency)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/p-concurrency.svg)](http://badge.fury.io/js/p-concurrency)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/p-concurrency.svg)](https://www.npmjs.org/package/p-concurrency)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/p-concurrency.svg)](https://david-dm.org/kaelzhang/p-concurrency)
-->

# p-concurrency

Decorate an async function with limited concurrency, which can be used as the decorator in the future.

## Install

```sh
$ npm install p-concurrency --save
```

## Usage

```js
const concurrency = require('p-concurrency')

// used as a decorator
@concurrency(1)
async function get (n) {
  return await remoteGetSomething(n)
}

// or
get = concurrency(1)(get)

// only one promise is run at once
Promise.all([
  get(),
  get(),
  get()
]).then(result => {
  console.log(result)
})
```

## It can also be used with classes

```js
class Foo {
  @concurrency(1)
  async bar (n) {
    return await remoteGetSomething(n)
  }
}

const foo = new Foo

// only one promise is run at once
Promise.all([
  foo.bar(),
  foo.bar(),
  foo.bar()
]).then(result => {
  console.log(result)
})
```

## Use as no decorators with classes

```js
class Foo {
  constructor () {
    this.bar = concurrency(1)(this.bar)
  }

  async bar (n) {
    return await remoteGetSomething(n)
  }
}
```

## License

MIT
