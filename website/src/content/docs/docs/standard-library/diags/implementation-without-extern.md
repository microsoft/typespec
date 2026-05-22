---
title: implementation-without-extern
---

A function is registered in a JS file's `$functions` map but there is no matching `extern fn` declaration in TypeSpec. Without the declaration the implementation is silently ignored.

#### ❌ Incorrect

```js
// lib.js — "testFn" is registered but never declared in TypeSpec
export const $functions = {
  "": {
    testFn: (context, target) => target,
  },
};
```

```tsp
// lib.tsp — missing extern fn declaration; testFn is silently ignored
using TypeSpec.Reflection;
```

#### ✅ Correct

```js
// lib.js
export const $functions = {
  "": {
    testFn: (context, target) => target,
  },
};
```

```tsp
// lib.tsp
using TypeSpec.Reflection;

#suppress "experimental-feature" "Functions are experimental"
extern fn testFn(target: unknown): unknown;
```

For namespaced functions, make sure the namespace in `$functions` matches the TypeSpec namespace:

```js
// lib.js
export const $functions = {
  "MyLib": {
    myFn: (context, value) => value,
  },
};
```

```tsp
// lib.tsp
#suppress "experimental-feature" "Functions are experimental"
namespace MyLib {
  extern fn myFn(value: unknown): unknown;
}
```
